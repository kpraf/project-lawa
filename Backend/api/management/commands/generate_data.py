from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import datetime, date, timedelta
import random
from collections import defaultdict
import sys

from api.models import (
    DimStation, DimSensor, DimTime, 
    RawSensorReading, DailySensorReading, 
    WeeklySensorReading, FactSensorReading
)

# Color codes for terminal logging
class LogColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class Command(BaseCommand):
    help = "Generate and fix historical sensor data, preserving existing valid monthly averages."

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-date',
            type=str,
            default='2016-03-01',
            help='Start date in YYYY-MM-DD format (default: 2016-01-01)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            default='2025-04-30',
            help='End date in YYYY-MM-DD format (default: 2025-04-30)'
        )

    def log(self, msg, color=LogColors.ENDC):
        print(f"{color}{msg}{LogColors.ENDC}", file=sys.stderr)

    def handle(self, *args, **options):
        start_date = datetime.strptime(options['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(options['end_date'], '%Y-%m-%d').date()
        
        self.log(f"Starting data generation from {start_date} to {end_date}", LogColors.HEADER)
        
        stations = DimStation.objects.filter(code__in=["I", "II"])
        sensors = DimSensor.objects.all()
        
        if not stations.exists() or not sensors.exists():
            self.log("No stations or sensors found. Please add them first.", LogColors.FAIL)
            return
            
        self.log(f"Found {stations.count()} stations and {sensors.count()} sensors", LogColors.OKCYAN)
        
        self.generate_historical_data(stations, sensors, start_date, end_date)
        
        self.log("Data generation completed successfully!", LogColors.OKGREEN)

    def get_existing_monthly_data(self, stations, sensors):
        """Reads all true monthly data into a dictionary for quick lookup."""
        existing_data = defaultdict(lambda: defaultdict(dict))
        monthly_readings = FactSensorReading.objects.filter(
            station__in=stations,
            sensor__in=sensors
        ).select_related('time', 'station', 'sensor')
        
        for reading in monthly_readings:
            month_key = reading.time.date.strftime('%Y-%m')
            existing_data[reading.station.code][reading.sensor.name][month_key] = reading.value
        
        self.log(f"Found {len(monthly_readings)} existing monthly records to use as a source of truth.", LogColors.OKCYAN)
        return existing_data

    def generate_historical_data(self, stations, sensors, start_date, end_date):
        existing_monthly_data = self.get_existing_monthly_data(stations, sensors)
        current_month_start = start_date.replace(day=1)

        while current_month_start <= end_date:
            self.log(f"--- Processing month: {current_month_start.strftime('%Y-%m')} ---", LogColors.HEADER)
            
            # Determine the end of the current month
            if current_month_start.month == 12:
                next_month_start = date(current_month_start.year + 1, 1, 1)
            else:
                next_month_start = date(current_month_start.year, current_month_start.month + 1, 1)
            
            # This transaction ensures all operations for a single month succeed or fail together.
            with transaction.atomic():
                # Clear all granular data for the month to be regenerated.
                self.log("  - Clearing existing granular (raw, daily, weekly) data for this month...")
                RawSensorReading.objects.filter(time__gte=timezone.make_aware(datetime.combine(current_month_start, datetime.min.time())), time__lt=timezone.make_aware(datetime.combine(next_month_start, datetime.min.time()))).delete()
                DailySensorReading.objects.filter(time__date__gte=current_month_start, time__date__lt=next_month_start).delete()
                WeeklySensorReading.objects.filter(time__date__gte=current_month_start, time__date__lt=next_month_start).delete()
                
                # Generate new raw data for the month
                all_raw_for_month = self.generate_raw_data_for_month(stations, sensors, current_month_start, next_month_start, existing_monthly_data)

                if not all_raw_for_month:
                    self.log("    - No raw data was generated for this month. Skipping save.", LogColors.WARNING)
                    continue
                
                # Save new granular data
                self.log(f"  - Saving new granular data for {current_month_start.strftime('%Y-%m')}...")
                RawSensorReading.objects.bulk_create(all_raw_for_month)
                self.log(f"    - Saved {len(all_raw_for_month)} raw records.", LogColors.OKGREEN)

                # Aggregate and save new daily, weekly, and monthly data
                daily_data = self.aggregate_to_daily(all_raw_for_month)
                DailySensorReading.objects.bulk_create(daily_data)
                self.log(f"    - Saved {len(daily_data)} daily records.", LogColors.OKGREEN)

                weekly_data = self.aggregate_to_weekly(daily_data)
                # Deduplicate weekly_data by (station, sensor, time)
                unique_weekly = {}
                for w in weekly_data:
                    key = (w.station_id, w.sensor_id, w.time_id)
                    unique_weekly[key] = w
                weekly_data = list(unique_weekly.values())

                # Delete all possible conflicting records for the weeks being inserted
                week_time_ids = set(w.time_id for w in weekly_data)
                WeeklySensorReading.objects.filter(
                    station__in=stations,
                    sensor__in=sensors,
                    time_id__in=week_time_ids
                ).delete()

                WeeklySensorReading.objects.bulk_create(weekly_data)
                self.log(f"    - Saved {len(weekly_data)} weekly records.", LogColors.OKGREEN)
                
                monthly_data = self.aggregate_to_monthly(daily_data)
                self.log(f"    - Updating/Creating {len(monthly_data)} monthly 'Fact' records...")
                for fact in monthly_data:
                    FactSensorReading.objects.update_or_create(
                        station=fact.station, sensor=fact.sensor, time=fact.time,
                        defaults={'value': fact.value}
                    )
                self.log("    - Finished upserting monthly records.", LogColors.OKGREEN)

            self.log(f"==== Successfully processed all data for {current_month_start.strftime('%Y-%m')} ====", LogColors.BOLD)
            current_month_start = next_month_start

    def generate_raw_data_for_month(self, stations, sensors, start_date, end_date, existing_monthly_data):
        all_raw_for_month = []
        for station in stations:
            for sensor in sensors:
                month_key = start_date.strftime('%Y-%m')
                target_avg = existing_monthly_data.get(station.code, {}).get(sensor.name, {}).get(month_key)
                
                # This is the critical fix: If target_avg is 0.0, the `if target_avg:` condition is False, forcing regeneration.
                if target_avg:
                    base_daily_value = target_avg
                else:
                    if target_avg == 0.0:
                        self.log(f"    - Existing avg for {station.code}/{sensor.name} is 0. Regenerating.", LogColors.WARNING)
                    base_daily_value = self.generate_realistic_value(sensor.name, month_key)

                if base_daily_value is None: continue

                day_iterator = start_date
                while day_iterator < end_date:
                    DimTime.objects.get_or_create(date=day_iterator)
                    for hour in range(9, 17):
                        variation = base_daily_value * (random.random() * 0.1 - 0.05)
                        value = base_daily_value + variation
                        aware_datetime = timezone.make_aware(datetime.combine(day_iterator, datetime.min.time().replace(hour=hour)))
                        all_raw_for_month.append(RawSensorReading(station=station, sensor=sensor, time=aware_datetime, value=round(value, 3)))
                    day_iterator += timedelta(days=1)
        return all_raw_for_month

    def generate_realistic_value(self, sensor_name, month_key):
        sensor_configs = {
            'pH': {'good': (6.8, 8.2), 'warning': (6.0, 6.4), 'failed': (5.5, 5.9)},
            'DissolvedOxygen': {'good': (5.5, 8.0), 'warning': (2.5, 4.5), 'failed': (1.0, 2.0)},
            'TDS': {'good': (400, 900), 'warning': (1100, 1400), 'failed': (1550, 1800)},
            'Turbidity': {'good': (3.0, 9.0), 'warning': (11.0, 14.0), 'failed': (16.0, 25.0)},
            'ORP': {'good': (220, 280), 'warning': (160, 190), 'failed': (100, 140)},
            'Temperature': {'good': (26.5, 29.5), 'warning': (25.1, 26.4), 'failed': (23.0, 24.9)},
            'BOD': {'good': (5.0, 9.0), 'warning': (11.0, 14.0), 'failed': (16.0, 20.0)},
            'Inorganic Phosphate': {'good': (0.01, 0.025), 'warning': (0.1, 0.4), 'failed': (0.6, 1.0)},
            'Ammonia': {'good': (0.02, 0.05), 'warning': (0.1, 0.25), 'failed': (0.35, 0.5)},
            'Fecal Coliform': {'good': (80, 180), 'warning': (250, 350), 'failed': (450, 600)},
            'Nitrate': {'good': (4.0, 6.0), 'warning': (8.0, 14.0), 'failed': (16.0, 20.0)},
        }
        sensor_name_map = {"DO": "DissolvedOxygen", "InorganicPhosphate": "Inorganic Phosphate", "FecalUniform": "Fecal Coliform"}
        mapped_name = sensor_name_map.get(sensor_name, sensor_name)
        
        config = sensor_configs.get(mapped_name)
        if not config:
            self.log(f"    - No config for sensor '{sensor_name}'. Using default value 10.", LogColors.WARNING)
            return 10
        
        rand_choice = random.random()
        if rand_choice < 0.85: quality = 'good'
        elif rand_choice < 0.95: quality = 'warning'
        else: quality = 'failed'
        
        min_val, max_val = config[quality]
        return random.uniform(min_val, max_val)

    def aggregate_to_daily(self, raw_readings):
        daily_values = defaultdict(lambda: {'sum': 0, 'count': 0})
        for r in raw_readings:
            daily_values[(r.station, r.sensor, r.time.date())]['sum'] += r.value
            daily_values[(r.station, r.sensor, r.time.date())]['count'] += 1
        
        records = []
        for (station, sensor, date_val), data in daily_values.items():
            dim_time, _ = DimTime.objects.get_or_create(date=date_val)
            records.append(DailySensorReading(station=station, sensor=sensor, time=dim_time, value=round(data['sum'] / data['count'], 3)))
        return records

    def aggregate_to_weekly(self, daily_readings):
        weekly_values = defaultdict(lambda: {'sum': 0, 'count': 0})
        for r in daily_readings:
            # FIX: r.time is now a DimTime object, so we access its .date attribute
            current_date = r.time.date
            week_start_date = current_date - timedelta(days=current_date.weekday())
            weekly_values[(r.station, r.sensor, week_start_date)]['sum'] += r.value
            weekly_values[(r.station, r.sensor, week_start_date)]['count'] += 1
        
        records = []
        for (station, sensor, date_val), data in weekly_values.items():
            dim_time, _ = DimTime.objects.get_or_create(date=date_val)
            records.append(WeeklySensorReading(station=station, sensor=sensor, time=dim_time, value=round(data['sum'] / data['count'], 3)))
        return records

    def aggregate_to_monthly(self, daily_readings):
        monthly_values = defaultdict(lambda: {'sum': 0, 'count': 0})
        for r in daily_readings:
            # FIX: r.time is now a DimTime object, so we access its .date attribute
            current_date = r.time.date
            month_start_date = current_date.replace(day=1)
            monthly_values[(r.station, r.sensor, month_start_date)]['sum'] += r.value
            monthly_values[(r.station, r.sensor, month_start_date)]['count'] += 1
            
        records = []
        for (station, sensor, date_val), data in monthly_values.items():
            dim_time, _ = DimTime.objects.get_or_create(date=date_val)
            records.append(FactSensorReading(station=station, sensor=sensor, time=dim_time, value=round(data['sum'] / data['count'], 3)))
        return records
