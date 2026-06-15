from django.http import HttpResponse, JsonResponse
from api.models import DimSensor, DimStation, RawSensorReading
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
from django.utils import timezone
import csv
import json

@csrf_exempt
def downloadWaterData(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)

            
            date_range = body.get('dateRange', {})
            start_str = date_range.get('from')
            end_str = date_range.get('to')

            if not start_str or not end_str:
                return JsonResponse({"message": "Missing 'from' or 'to' date."}, status=400)

            
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_str, "%Y-%m-%d").date()

            if start_date > end_date:
                return JsonResponse({"message": "'From' date cannot be after 'To' date."}, status=400)
  
            
            selected_stations = [s.replace("Station ", "").strip() for s in body.get('selectedStations', [])]
            stations = DimStation.objects.filter(code__in=selected_stations)
            

            sensor_aliases = {
                "Biochemical Oxygen Demand": "BOD",
                "BOD": "BOD",
                "DO": "DO",
                "Dissolved Oxygen": "DO",
                "Fecal Coliform": "Fecal Coliform",
                "pH": "pH",
                "Ammonia": "Ammonia",
                "Nitrate": "Nitrate",
                "Inorganic Phosphate": "Inorganic Phosphate",
                "TDS": "TDS",
                "Total Dissolved Solids": "TDS",
                "Turbidity": "Turbidity",
                "Temperature": "Temperature",
                "ORP": "ORP",
                "Oxidation Reduction Potential": "ORP",
            }

            selected_parameters = body.get('selectedParameters', [])
            normalized_sensor_names = [sensor_aliases.get(s, s) for s in selected_parameters if s in sensor_aliases]
            sensors = DimSensor.objects.filter(name__in=normalized_sensor_names)
            

            readings = RawSensorReading.objects.select_related('station', 'sensor').filter(
                station__in=stations,
                sensor__in=sensors,
                time__date__range=(start_date, end_date)
            ).order_by('station__code', 'sensor__name', 'time')

            
            response = HttpResponse(
                content_type='text/csv',
                headers={'Content-Disposition': f'attachment; filename="water_data_{start_date}_{end_date}.csv"'},
                status=200,
            )

            writer = csv.writer(response)
            writer.writerow(['Station', 'Sensor', 'Value', 'Date','Time'])

            for reading in readings:
                local_time = timezone.localtime(reading.time)
                writer.writerow([
                    reading.station.code,
                    reading.sensor.name,
                    reading.value,
                    local_time.strftime("%Y-%m-%d"),
                    local_time.strftime("%H:%M:%S"),
                ])

            return response

        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

    return JsonResponse({"message": "Only POST method is allowed."}, status=405)