from django.core.management.base import BaseCommand
from django.utils import timezone
from django.http import HttpRequest
from django.test import RequestFactory
import random
import json
import time as t
from datetime import datetime, time
from api.views.upload_data import uploadData
from django.utils.timezone import localtime

class Command(BaseCommand):
    help = 'Generates random sensor data and uploads it to the system'

    def generate_sensor_value(self, sensor_name):
        """Generate random values with occasional extreme values and nulls"""
        if random.random() < 0.05:
            return None


        if random.random() < 0.1:
            if sensor_name == "DO":
                return round(random.uniform(0.0, 1.0) if random.random() < 0.5 else random.uniform(9.0, 12.0), 2)

            elif sensor_name == "TDS":
                return round(random.uniform(0.0, 50.0) if random.random() < 0.5 else random.uniform(2000.0, 3000.0), 2)

            elif sensor_name == "ORP":
                return round(random.uniform(0.0, 100.0) if random.random() < 0.5 else random.uniform(400.0, 600.0), 2)

            elif sensor_name == "Temperature":
                return round(random.uniform(20.0, 24.0) if random.random() < 0.5 else random.uniform(32.0, 35.0), 2)

            elif sensor_name == "pH":
                return round(random.uniform(4.0, 5.9) if random.random() < 0.5 else random.uniform(9.1, 11.0), 2)

            elif sensor_name == "Turbidity":
                return round(random.uniform(0.0, 0.9) if random.random() < 0.5 else random.uniform(20.0, 30.0), 2)

        if sensor_name == "DO":
            return round(random.uniform(2.0, 8.0), 2)

        elif sensor_name == "TDS":
            return round(random.uniform(100.0, 2000.0), 2)

        elif sensor_name == "ORP":
            return round(random.uniform(100.0, 400.0), 2)

        elif sensor_name == "Temperature":
            return round(random.uniform(25.0, 31.0), 2)

        elif sensor_name == "pH":
            return round(random.uniform(6.0, 9.0), 2)

        elif sensor_name == "Turbidity":
            return round(random.uniform(1.0, 20.0), 2)

        return None

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting continuous data generation...'))
        self.stdout.write(self.style.SUCCESS('Press Ctrl+C to stop'))

        rf = RequestFactory()

        

        try:
            while True:
                current_time = localtime(timezone.now()).time()
                if not (time(8, 0) <= current_time <= time(17, 0)):
                    self.stdout.write(self.style.WARNING(f'current_time: {current_time}'))
                    self.stdout.write(self.style.WARNING('Outside of operating hours (8 AM - 5 PM)'))
                    t.sleep(60)
                    continue

                sensors = ["DO", "TDS", "ORP", "Temperature", "pH", "Turbidity"]
                stations = ["I", "II"]

                for station in stations:
                    for sensor in sensors:
                        try:
                            value = self.generate_sensor_value(sensor)
                            
                            
                            payload = {
                            "station": station,
                            "sensor": sensor,
                            "value": value,
                            }
                            # create a POST request with JSON body
                            request = rf.post(
                                '/api/upload-data/',
                                data=json.dumps(payload),
                                content_type='application/json'
                            )
                            # call your view directly
                            response = uploadData(request)


                            if response.status_code == 200:
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        f'Successfully uploaded data for Station {station}, Sensor {sensor}: {value}'
                                    )
                                )
                            else:
                                self.stdout.write(
                                    self.style.ERROR(
                                        f'Failed to upload data for Station {station}, Sensor {sensor}. Status code: {response.status_code}'
                                    )
                                )

                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(
                                    f'Error uploading data for Station {station}, Sensor {sensor}: {str(e)}'
                                )
                            )
                    self.stdout.write(self.style.SUCCESS(
                        f'Successfully uploaded all sensor data for Station {station}. Proceeding to next station...'
                    ))
                self.stdout.write(self.style.SUCCESS('All sensor data uploaded successfully.'))
                self.stdout.write(self.style.SUCCESS('Waiting for the next cycle...'))
                t.sleep(3600)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Data generation stopped'))
            return
