from django.core.management.base import BaseCommand
from django.db.models import Avg
from api.models import RawSensorReading, DimTime, DailySensorReading

from datetime import datetime

class Command(BaseCommand):
    help = 'Compute and store daily averages for all stations and sensors for a specific day (YYYY-MM-DD)'

    def add_arguments(self, parser):
        parser.add_argument('date', type=str, help='Date in YYYY-MM-DD format')

    def handle(self, *args, **options):
        date_str = options['date']
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            self.stderr.write(self.style.ERROR("Invalid date format. Use YYYY-MM-DD."))
            return

        dim_time, _ = DimTime.objects.get_or_create(date=date_obj)

        readings = (
            RawSensorReading.objects
            .filter(time__date=date_obj)
            .values('station', 'sensor')
            .annotate(avg_value=Avg('value'))
        )

        count = 0
        for r in readings:
            if r['avg_value'] is not None:
                DailySensorReading.objects.update_or_create(
                    station_id=r['station'],
                    sensor_id=r['sensor'],
                    time=dim_time,
                    defaults={'value': r['avg_value']}
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Stored {count} daily averages for {date_str}"))