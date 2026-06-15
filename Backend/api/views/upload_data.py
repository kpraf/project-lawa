from django.http import JsonResponse
from django.core.mail import EmailMessage, get_connection
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string
from django.utils import timezone
import json
from api.models import ReportLog, SensorAlertLog, DimStation, DimSensor, DimTime, RawSensorReading
from api.helper.helper import WaterQuality
from django.utils.timezone import localtime, now
from api.helper.email import send_upload_notification, send_alert_email, send_no_data_alert, send_upload_failed_notification



@csrf_exempt
def uploadData(request):
    if request.method == "POST":
        body = json.loads(request.body)
        value = body.get('value')
        station_code = body.get('station')
        sensor_name = body.get('sensor')
        

        if sensor_name == "Temp" or sensor_name == "temp" or sensor_name == "temperature":
            sensor_name = "Temperature"
# Sensors:
# BOD
# DO
# Fecal Coliform
# pH
# Turbidity
# TDS
# Temperature
# ORP
# TDS
# Inorganic Phosphate
# Nitrate
# Ammonia

        try:
            station = DimStation.objects.get(code = station_code)
            sensor = DimSensor.objects.get(name = sensor_name)
            current_time = timezone.now()
            time = DimTime.objects.get_or_create(date = current_time.date())


            classification = WaterQuality(sensor.name, value)
            raw_reading = RawSensorReading.objects.create(
                station = station,
                sensor = sensor,
                time = current_time,
                value = value if value is not None else None
            )
            
            if value is None:
                
                SensorAlertLog.objects.create(
                    station = station,
                    sensor = sensor,
                    value = None,
                    description = "No data uploaded",
                    alert = True,
                    timestamp = current_time
                )
                send_no_data_alert(sensor, station, localtime(current_time))
                return JsonResponse({"message": "No data uploaded"}, status=200)


            if classification['Class'] in ["Failed", "Class D"]:
                send_alert_email(sensor, value, localtime(current_time), station, classification["Class"])
                SensorAlertLog.objects.create(
                    station = station,
                    sensor = sensor,
                    value = value,
                    description = f"Bad Class ({classification['Class']})",
                    alert = True,
                    timestamp = current_time
                )

                return JsonResponse({"message": "Data Uploaded"}, status=200)
            
            
            send_upload_notification(station, sensor, localtime(current_time), value, classification['Class'])
            SensorAlertLog.objects.create(
                station = station,
                sensor = sensor,
                value = value,
                description = "Data uploaded",
                alert = False,
                timestamp = current_time
            )
            return JsonResponse({"message": "Data Uploaded"}, status=200)


        except DimStation.DoesNotExist:
            SensorAlertLog.objects.create(
                station = station,
                sensor = sensor,
                value = value,
                description = "Upload Failed - Station not found",
                alert = True,
                timestamp = current_time
            )
            send_upload_failed_notification(station, sensor, localtime(current_time), value, "Station not found")
            return JsonResponse({"message": "Station not found"}, status=404)


        except DimSensor.DoesNotExist:
            SensorAlertLog.objects.create(
                station = station,
                sensor = sensor,
                value = value,
                description = "Upload Failed - Sensor not found",
                alert = True,
                timestamp = current_time
            )

            send_upload_failed_notification(station, sensor, localtime(current_time), value, "Sensor not found")
            return JsonResponse({"message": "Sensor not found"}, status=404)
        
        except Exception as e:
            SensorAlertLog.objects.create(
                station = station,
                sensor = sensor,
                value = value,
                description = f"Upload Failed - {str(e)}",
                alert = True,
                timestamp = current_time
            )
            send_upload_failed_notification(station, sensor, localtime(current_time), value, str(e))
            return JsonResponse({"message": str(e)}, status=500)

        