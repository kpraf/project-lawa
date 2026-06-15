from django.core.management.base import BaseCommand
from api.models import DimSensor

class Command(BaseCommand):
    help = "Add new sensors to DimSensor table"

    def handle(self, *args, **options):
        sensors = [
            {'name': 'TDS', 'unit': 'ppm'},
            {'name': 'Turbidity', 'unit': 'NTU'},
            {'name': 'Temperature', 'unit': '°C'},
            {'name': 'ORP', 'unit': 'mV'}
        ]

        for sensor in sensors:
            DimSensor.objects.get_or_create(
                name=sensor['name'],
                defaults={'unit': sensor['unit']}
            )
            self.stdout.write(f"Added sensor: {sensor['name']} ({sensor['unit']})")