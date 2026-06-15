from django.core.management.base import BaseCommand
from django.db.models import Avg
from api.models import WeeklySensorReading, FactSensorReading, DimTime

class Command(BaseCommand):
    help = 'Compute and store monthly averages for all stations and sensors using WeeklySensorReading for a specific month (YYYY-MM)'

    def add_arguments(self, parser):
        parser.add_argument('year', type=int, help='Year (e.g. 2024)')
        parser.add_argument('month', type=int, help='Month (1-12)')

    def handle(self, *args, **options):
        year = options['year']
        month = options['month']

        
        dim_times = DimTime.objects.filter(date__year=year, date__month=month)
        if not dim_times.exists():
            self.stderr.write(self.style.ERROR("No DimTime entries for this month."))
            return

        
        readings = (
            WeeklySensorReading.objects
            .filter(time__in=dim_times)
            .values('station', 'sensor')
            .annotate(avg_value=Avg('value'))
        )

        
        dim_time = dim_times.first()
        count = 0
        for r in readings:
            if r['avg_value'] is not None:
                FactSensorReading.objects.update_or_create(
                    station_id=r['station'],
                    sensor_id=r['sensor'],
                    time=dim_time,
                    defaults={'value': r['avg_value']}
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Stored {count} monthly averages for {year}-{month:02d}"))