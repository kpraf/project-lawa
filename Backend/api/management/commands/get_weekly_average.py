from django.core.management.base import BaseCommand
from django.db.models import Avg
from api.models import DailySensorReading, DimTime, WeeklySensorReading

from datetime import datetime

class Command(BaseCommand):
    help = 'Compute and store weekly averages for all stations and sensors for a specific week (YYYY-WW, e.g. 2024-25)'

    def add_arguments(self, parser):
        parser.add_argument('year', type=int, help='Year (e.g. 2024)')
        parser.add_argument('week', type=int, help='ISO week number (1-53)')

    def handle(self, *args, **options):
        year = options['year']
        week = options['week']

        # Find all DimTime objects in this week
        dim_times = DimTime.objects.filter(date__year=year, date__isocalendar__week=week)
        if not dim_times.exists():
            self.stderr.write(self.style.ERROR("No DimTime entries for this week."))
            return

        # Get all RawSensorReading for this week
        daily_readings = (
            DailySensorReading.objects
            .filter(time__in=dim_times)
            .values('station', 'sensor')
            .annotate(avg_value=Avg('value'))
        )

        # Use the first DimTime as the "week" reference
        dim_time = dim_times.first()
        count = 0
        for r in daily_readings:
            if r['avg_value'] is not None:
                WeeklySensorReading.objects.update_or_create(
                    station_id=r['station'],
                    sensor_id=r['sensor'],
                    time=dim_time,
                    defaults={'value': r['avg_value']}
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Stored {count} weekly averages for {year}-W{week:02d}"))