from django.http import HttpResponse, JsonResponse
from api.models import Station, BOD, DissolvedOxygen, FecalUniform, pH, Ammonia, Nitrate, InorganicPhospate, Temperature, TDS, Turbidity, ORP
from django.utils import timezone
from django.forms.models import model_to_dict
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Window, F
from django.db.models.functions import RowNumber
from ..helper.helper import WaterQuality
from django.http import JsonResponse
from django.http import HttpResponse, JsonResponse
from api.models import DimStation, DimSensor, DimTime, FactSensorReading, ReportLog, SensorAlertLog, RawSensorReading, WeeklySensorReading, DailySensorReading
from django.utils.timezone import localtime
from datetime import date, datetime

def getWeeklyData(_):
    try:
        weekly_data = list(WeeklySensorReading.objects.all().order_by("-time__date").values()[:5000])
        return JsonResponse({"weekly_data": weekly_data}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

def getDailyData(_):
    try:
        daily_data = list(DailySensorReading.objects.all().order_by("-time__date").values()[:5000])
        return JsonResponse({"daily_data": daily_data}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

def getRawData(_):
    try:
        raw_data = list(RawSensorReading.objects.all().order_by("-time").values()[:5000])
        return JsonResponse({"raw_data": raw_data}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

def getDate(request):
    try:
        # Get all unique dates from DimTime
        dates = DimTime.objects.all().order_by('date')
        
        # Initialize the response structure
        response = {
            'year': {
                'data': []
            },
            'month': {},
            'day': {}
        }
        
        # Process each date
        for date_obj in dates:
            year = date_obj.year
            month = date_obj.month
            day = date_obj.date.day
            
            # Add year if not exists
            if year not in response['year']['data']:
                response['year']['data'].append(year)
            
            # Add month if not exists for this year
            if year not in response['month']:
                response['month'][year] = []
            if month not in response['month'][year]:
                response['month'][year].append(month)
            
            # Add day if not exists for this year-month
            year_month_key = f"{year}-{month}"
            if year_month_key not in response['day']:
                response['day'][year_month_key] = []
            if day not in response['day'][year_month_key]:
                response['day'][year_month_key].append(day)
        
        # Sort all arrays
        response['year']['data'].sort()
        for year in response['month']:
            response['month'][year].sort()
        for year_month in response['day']:
            response['day'][year_month].sort()
        
        return JsonResponse(response, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


def getAll(request):
    from django.core.cache import cache
    cache_key = f"getAll_{request.GET.urlencode()}"
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached, status=200)

    try:
        def groupFunction(readings, is_datetime, stationObjects, data_type):
                all_sensors = DimSensor.objects.all()
                
                metadata = {
                    "data_type": data_type,
                    "parameters": {s.name: {"unit": s.unit} for s in all_sensors},
                    "stations": {s.code: {"location": s.location} for s in stationObjects}
                }

                if not readings:
                    today_str = timezone.localtime(timezone.now()).strftime("%Y-%m-%d")

                   
                    time_str = today_str 

                    all_sensors = DimSensor.objects.all()
                    metadata = {
                        "data_type": data_type,
                        "parameters": {s.name: {"unit": s.unit} for s in all_sensors},
                        "stations": {s.code: {"location": s.location} for s in stationObjects}
                    }

                    # Just return one null entry per station and sensor
                    series = []
                    for station in stationObjects:
                        for sensor in all_sensors:
                            series.append({
                                "station": station.code,
                                "parameter": sensor.name,
                                "data": [{
                                    "time": time_str,
                                    "value": None,
                                    "Class": "No Data",
                                    "Color": "Black",
                                    "Range": "No Data"
                                }]
                            })

                    return {"metadata": metadata, "series": series}

                grouped = defaultdict(list)

                for r in readings:
                    key = (r.station.code, r.sensor.name)
                    quality = WaterQuality(r.sensor.name, r.value)

                    time_str = (
                        timezone.localtime(r.time).strftime("%Y-%m-%d:%H") if is_datetime
                        else r.time.date.strftime("%Y-%m-%d")
                    )

                    grouped[key].append({
                        "time": time_str,
                        "value": r.value,
                        "Class": quality["Class"],
                        "Color": quality["Color"],
                        "Range": quality["Range"]
                    })

                series = []
                for (station_code, sensor_name), datapoints in grouped.items():
                    series.append({
                        "station": station_code,
                        "parameter": sensor_name,
                        "data": datapoints
                    })

                return {"metadata": metadata, "series": series}
        
        station_codes = request.GET.getlist("station")
        startDate = request.GET.get("startDate")
        endDate = request.GET.get("endDate")
        status = request.GET.get("status")

        stationObjects = DimStation.objects.filter(code__in=station_codes) if station_codes else DimStation.objects.all()


        if startDate and endDate:
            startDate = datetime.strptime(startDate, "%Y-%m-%d").date()
            endDate = datetime.strptime(endDate, "%Y-%m-%d").date()


            if startDate > endDate:
                return JsonResponse({"message": "'From' date cannot be after 'To' date."}, status=400)
            

            if (endDate - startDate).days <= 4:
                readings = RawSensorReading.objects.select_related("station", "sensor").filter(
                    time__date__range=(startDate, endDate),
                    station__id__in=stationObjects.values_list("id", flat=True)
                )
            elif (endDate - startDate).days <= 13:
                readings = DailySensorReading.objects.select_related("station", "sensor","time").filter(
                    time__date__range=(startDate, endDate),
                    station__in=stationObjects
                )
            elif (endDate - startDate).days <= 90:
                readings = WeeklySensorReading.objects.select_related("station", "sensor","time").filter(
                    time__date__range=(startDate, endDate),
                    station__in=stationObjects
                )
            else:
                readings = FactSensorReading.objects.select_related("station", "sensor","time").filter(
                    time__date__range=(startDate, endDate),
                    station__in=stationObjects
                )
            data = groupFunction(readings=readings, is_datetime=(endDate-startDate).days<=4, stationObjects=stationObjects, data_type="custom_date_range")
            cache.set(cache_key, data, 300)
            return JsonResponse(data, status=200)

        def _cache_and_return(readings, is_datetime, data_type):
            data = groupFunction(readings=readings, is_datetime=is_datetime, stationObjects=stationObjects, data_type=data_type)
            cache.set(cache_key, data, 300)
            return JsonResponse(data, status=200)

        if status == "Today":
            today = localtime(timezone.now()).date()
            readings = RawSensorReading.objects.select_related("station", "sensor").filter(
                time__year=today.year, time__month=today.month, time__day=today.day,
                station__in=stationObjects
            )
            return _cache_and_return(readings, True, "today_raw_data")

        if status == "Yesterday":
            yesterday = localtime(timezone.now()).date() - timezone.timedelta(days=1)
            readings = RawSensorReading.objects.select_related("station", "sensor").filter(
                time__year=yesterday.year, time__month=yesterday.month, time__day=yesterday.day,
                station__in=stationObjects
            )
            return _cache_and_return(readings, True, "yesterday_raw_data")

        if status == "Last 7 Days":
            readings = DailySensorReading.objects.select_related("station", "sensor").filter(
                time__date__gte=localtime(timezone.now()).date() - timezone.timedelta(days=7),
                station__in=stationObjects
            )
            return _cache_and_return(readings, False, "last_7_day_daily_averaged_data")

        if status == "Last 30 Days":
            readings = WeeklySensorReading.objects.select_related("station", "sensor").filter(
                time__date__gte=localtime(timezone.now()).date() - timezone.timedelta(days=30),
                station__in=stationObjects
            )
            return _cache_and_return(readings, False, "last_30_days_weekly_averaged_data")

        if status == "Last 6 Months":
            readings = FactSensorReading.objects.select_related("station", "sensor").filter(
                time__date__gte=localtime(timezone.now()).date() - timezone.timedelta(days=180),
                station__in=stationObjects
            )
            return _cache_and_return(readings, False, "last_6_months_averaged_monthly_data")

        if status == "Last 1 Year":
            readings = FactSensorReading.objects.select_related("station", "sensor").filter(
                time__date__gte=localtime(timezone.now()).date() - timezone.timedelta(days=365),
                station__in=stationObjects
            )
            return _cache_and_return(readings, False, "last_1_year_averaged_monthly_data")

        if status == "All Time" or not status:
            readings = FactSensorReading.objects.select_related("station", "sensor").filter(
                station__in=stationObjects
            )
            return _cache_and_return(readings, False, "all_time_averaged_monthly_data")

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

def RecentData(request):
    from django.core.cache import cache
    cached = cache.get("RecentData")
    if cached:
        return JsonResponse(cached, safe=False, status=200)

    try:
        allowed_params = ["ORP", "DO", "pH", "Temperature", "Turbidity", "TDS"]

        stations = DimStation.objects.filter(code__in=["I", "II"]).order_by("code")
        sensors = DimSensor.objects.filter(name__in=allowed_params)
        results = []

        for station in stations:
            station_data = {}
            for sensor in sensors:
                try:
                    data = list(
                        RawSensorReading.objects
                        .filter(station=station, sensor=sensor)
                        .order_by("-time")
                        .values("time", "value")[:2]
                    )
                    if data:
                        current = data[0]
                        before = data[1] if len(data) > 1 else None
                        status = (
                            "Higher" if before and current["value"] > before["value"]
                            else "Lower" if before and current["value"] < before["value"]
                            else "Equal" if before
                            else "N/A"
                        )
                        station_data[sensor.name] = {
                            "time": current["time"],
                            "value": current["value"],
                            "status": status,
                            "before": before["value"] if before else [],
                            **WaterQuality(sensor.name, current["value"])
                        }
                    else:
                        station_data[sensor.name] = WaterQuality(sensor.name, None)
                except Exception:
                    station_data[sensor.name] = None
            results.append({f"Station {station.code}": station_data})

        cache.set("RecentData", results, 60)
        return JsonResponse(results, safe=False, status=200)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)




def getRecent(request, station_id):
    from django.core.cache import cache
    cache_key = f"getRecent_{station_id}"
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached, status=200)

    display_name_map = {
        "DO": "Dissolved Oxygen",
        "TDS": "Total Dissolved Solids"
    }

    try:
        station = DimStation.objects.get(code=station_id)
        sensors = DimSensor.objects.all()
        parameters = {}

        for sensor in sensors:
            display_name = display_name_map.get(sensor.name, sensor.name)
            try:
                reading = (
                    RawSensorReading.objects
                    .filter(station=station, sensor=sensor)
                    .order_by('-time')
                    .values("time", "value")
                    .first()
                )
                if reading:
                    parameters[display_name] = {
                        "time": reading["time"],
                        "value": reading["value"],
                        **WaterQuality(sensor.name, reading["value"])
                    }
                else:
                    parameters[display_name] = WaterQuality(sensor.name, None)
            except Exception:
                parameters[display_name] = None

        result = {"Parameters": parameters}
        cache.set(cache_key, result, 60)
        return JsonResponse(result, status=200)
    except DimStation.DoesNotExist:
        return JsonResponse({"message": f"Station '{station_id}' not found."}, status=404)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

def report_table(request):

    sensor_data = {}

    try:
        stations = DimStation.objects.all()
        station_codes = list(stations.values_list('code', flat=True))
        sensors = DimSensor.objects.all()
        sensor_names = [s.name for s in sensors]

        
        display_name_map = {
            "DO": "Dissolved Oxygen",
            "TDS": "Total Dissolved Solids"
        }

        
        for sensor in sensors:
            display_name = display_name_map.get(sensor.name, sensor.name)
            query_results = (
                RawSensorReading.objects
                .filter(station__code__in=station_codes, sensor=sensor)
                .annotate(
                    rn=Window(
                        expression=RowNumber(),
                        partition_by=[F('station')],
                        order_by=F('time').desc()
                    )
                )
                .filter(rn__lte=2)
                .values('station__code', 'value', 'time', 'rn')
            )

            grouped = {}
            for entry in query_results:
                sid = entry['station__code']
                grouped.setdefault(sid, []).append(entry)

            sensor_data[display_name] = grouped

        station_data = []

        for station in stations:
            information = {
                "station_id": station.code,
                "station_location": station.location,
            }

            for sensor in sensors:
                display_name = display_name_map.get(sensor.name, sensor.name)
                data = sensor_data[display_name].get(station.code)
                if data:
                    information[display_name] = {
                        "value": data[0]['value'],
                        "time": data[0]['time'],
                        "before": data[1]['value'] if len(data) > 1 else [],
                        "status": "Higher" if len(data) > 1 and data[0]['value'] > data[1]['value']
                            else "Lower" if len(data) > 1 and data[0]['value'] < data[1]['value']
                            else "Equal" if len(data) > 1
                            else "N/A"
                    }
                else:
                    information[display_name] = None

            station_data.append(information)

        return JsonResponse({"stations": station_data}, status=200)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

# def getLogs(request):
#     try:
#         logs = list(ReportLog.objects.all().order_by('-timestamp'))
#         all_logs = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp),
                
#             } for log in logs
#         ]
        
#         all_report = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp),
#             } for log in logs if log.type == "Report"
#         ]
#         error_report = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp)
#             } for log in logs if not log.success and log.type == "Report"
#         ]

#         success_report = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp)
#             } for log in logs if log.success and log.type == "Report"
#         ]
        
#         all_email = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp)
#             } for log in logs if log.type == "System"
#         ]

#         success_email = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp)
#             } for log in logs if log.type == "System" and log.success
#         ]

#         error_email = [
#             {
#                 "description": log.description,
#                 "type": log.type,
#                 "success": log.success,
#                 "time": localtime(log.timestamp)
#             } for log in logs if log.type == "System" and not log.success
#         ]

#         logReport = {
#             "All": {
#                 "Total": len(all_logs),
#                 "Data": all_logs if all_logs else [],
#                 "Total_Error": len(error_report) + len(error_email),
#                 "Total_Success": len(success_report) + len(success_email), 
#             },
#             "Report":{
#                 "Total": len(all_report),
#                 "Data": all_report if all_report else [],
#                 "Error_Report": {
#                     "Total": len(error_report),
#                     "Data": error_report if error_report else []
#                 },
#                 "Success_Report": {
#                     "Total": len(success_report),
#                     "Data": success_report if success_report else []
#                 },
#             },

#             "System": {
#                 "Total": len(all_email),
#                 "Data": all_email if all_email else [],
#                 "Error_System": {
#                     "Total": len(error_email),
#                     "Data": error_email if error_email else []
#                 },
#                 "Success_System": {
#                     "Total": len(success_email),
#                     "Data": success_email if success_email else []
#                 },
#             }
#         }
        
        
#         sensor_alert_all = list(SensorAlertLog.objects.all().order_by('-timestamp'))
#         stations = DimStation.objects.all().order_by('code')
#         sensorList = DimSensor.objects.all()
        
#         all_sensor = [
#             {
#                 "description": log.description,
#                 "station": log.station.code,
#                 "sensor": log.sensor.name,
#                 "value": log.value,
#                 "time": localtime(log.timestamp),
#                 "alert": log.alert,
#             } for log in sensor_alert_all
#         ]
#         all_alert_sensor = [
#             {
#                 "description": log.description,
#                 "station": log.station.code,
#                 "sensor": log.sensor.name,
#                 "value": log.value,
#                 "time": localtime(log.timestamp),
#                 "alert": log.alert,
#             } for log in sensor_alert_all if log.alert
#         ]

#         all_no_alert_sensor = [
#             {
#                 "description": log.description,
#                 "station": log.station.code,
#                 "sensor": log.sensor.name,
#                 "value": log.value,
#                 "time": localtime(log.timestamp),
#                 "alert": log.alert,
#             } for log in sensor_alert_all if not log.alert
#         ]
        
#         all_station_data = []

#         for station in stations:
#             station_logs = [log for log in all_sensor if log['station'] == station.code]
            

#             all_station_data.append({
#                 station.code: {
#                     "Total": len(station_logs),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in station_logs
#                     ]
#                 }
#             })

#         all_parameter_data = []

#         for sensor in sensorList:
#             sensor_logs = [log for log in all_sensor if log['sensor'] == sensor.name]

#             all_parameter_data.append({
#                 sensor.name: {
#                     "Total": len(sensor_logs),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in sensor_logs
#                     ]
#                 }
#             })
        
#         alert_station_data = []
#         for station in stations:
#             station_alerts = [log for log in sensor_alert_all if log['station'] == station.code and log.alert]

#             alert_station_data.append({
#                 station.code: {
#                     "Total": len(station_alerts),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in station_alerts
#                     ]
#                 }
#             })

#         alert_parameter_data = []
#         for sensor in sensorList:
#             sensor_alerts = [log for log in sensor_alert_all if log['sensor'] == sensor.name and log.alert]

#             alert_parameter_data.append({
#                 sensor.name: {
#                     "Total": len(sensor_alerts),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in sensor_alerts
#                     ]
#                 }
#             })

#         no_alert_station_data = []
#         for station in stations:
#             station_no_alerts = [log for log in sensor_alert_all if log.station.code == station.code and not log.alert]

#             no_alert_station_data.append({
#                 station.code: {
#                     "Total": len(station_no_alerts),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in station_no_alerts
#                     ]
#                 }
#             })
        
#         no_alert_parameter_data = []
#         for sensor in sensorList:
#             sensor_no_alerts = [log for log in sensor_alert_all if log.sensor.name == sensor.name and not log.alert]

#             no_alert_parameter_data.append({
#                 sensor.name: {
#                     "Total": len(sensor_no_alerts),
#                     "Data": [
#                         {
#                             "description": log.description,
#                             "station": log.station.code,
#                             "sensor": log.sensor.name,
#                             "value": log.value,
#                             "time": localtime(log.timestamp),
#                             "alert": log.alert,
#                         } for log in sensor_no_alerts
#                     ]
#                 }
#             })

#         sensorReport = {
#             "Total": len(all_sensor),
#             "Data": {
#                 "All": all_sensor if all_sensor else [],
#                 "Stations": all_station_data if all_station_data else [],
#                 "Parameters": all_parameter_data if all_parameter_data else [],
#             },
#             "Alert": {
#                 "Total": len(all_alert_sensor),
#                 "Data": {
#                     "All": all_alert_sensor if all_alert_sensor else [],
#                     "Stations": alert_station_data if alert_station_data else [],
#                     "Parameters": alert_parameter_data if alert_parameter_data else [],
#                 }
#             },

#             "No_Alert": {
#                 "Total": len(all_no_alert_sensor),
#                 "Data": {
#                     "All": all_no_alert_sensor if all_no_alert_sensor else [],
#                     "Stations": no_alert_station_data if no_alert_station_data else [],
#                     "Parameters": no_alert_parameter_data if no_alert_parameter_data else [],
#                 }
#             }
#         }


#         return JsonResponse({"Log": logReport, "Sensor": sensorReport}, safe=False, status=200)

#     except Exception as e:
#         return JsonResponse({"message": str(e)}, status=500)


from collections import defaultdict
from django.utils.timezone import localtime
from django.http import JsonResponse

def getLogs(request):
    try:
        # 1) Grab every ReportLog in one go, with no list() wrapper yet.
        report_qs = (
            ReportLog.objects
            .order_by('-timestamp')
            .select_related()  # only matters if you have foreign‐keys to include
        )

        # Prepare buckets
        all_logs = []
        all_report = []
        error_report = []
        success_report = []
        all_system = []
        error_system = []
        success_system = []

        # 2) Single pass: build a plain dict, then append to the right lists
        for log in report_qs:
            rec = {
                "description": log.description,
                "type":        log.type,
                "success":     log.success,
                "time":        localtime(log.timestamp),
            }
            all_logs.append(rec)

            if log.type == "Report":
                all_report.append(rec)
                (success_report if log.success else error_report).append(rec)
            elif log.type == "System":
                all_system.append(rec)
                (success_system if log.success else error_system).append(rec)

        # 3) Assemble the summary
        logReport = {
            "All": {
                "Total":         len(all_logs),
                "Data":          all_logs,
                "Total_Error":   len(error_report) + len(error_system),
                "Total_Success": len(success_report) + len(success_system),
            },
            "Report": {
                "Total":          len(all_report),
                "Data":           all_report,
                "Error_Report":   {"Total": len(error_report),   "Data": error_report},
                "Success_Report": {"Total": len(success_report), "Data": success_report},
            },
            "System": {
                "Total":          len(all_system),
                "Data":           all_system,
                "Error_System":   {"Total": len(error_system),   "Data": error_system},
                "Success_System": {"Total": len(success_system), "Data": success_system},
            }
        }

        # --- Now do sensor alerts the same way ---

        # 4) One query, with related station/sensor to avoid extra queries
        alert_qs = (
            SensorAlertLog.objects
            .order_by('-timestamp')
            .select_related('station', 'sensor')
        )

        # Buckets by overall, by station, by sensor, and alert vs no‐alert:
        all_sensor        = []
        alert_sensor      = []
        no_alert_sensor   = []
        by_station        = defaultdict(lambda: {"All": [], "Alert": [], "No_Alert": []})
        by_sensor_name    = defaultdict(lambda: {"All": [], "Alert": [], "No_Alert": []})

        for log in alert_qs:
            rec = {
                "description": log.description,
                "station":     log.station.code,
                "sensor":      log.sensor.name,
                "value":       log.value,
                "time":        localtime(log.timestamp),
                "alert":       log.alert,
            }
            all_sensor.append(rec)
            if log.alert:
                alert_sensor.append(rec)
                by_station[log.station.code]["Alert"].append(rec)
                by_sensor_name[log.sensor.name]["Alert"].append(rec)
            else:
                no_alert_sensor.append(rec)
                by_station[log.station.code]["No_Alert"].append(rec)
                by_sensor_name[log.sensor.name]["No_Alert"].append(rec)
            # and in any case go into the station/sensor "All" bucket
            by_station[log.station.code]["All"].append(rec)
            by_sensor_name[log.sensor.name]["All"].append(rec)

        # 5) Convert those defaultdicts into the shape you want
        stations_data = [
            {
                code: {
                    "Total": len(buckets["All"]),
                    "Data":  buckets["All"]
                }
            }
            for code, buckets in by_station.items()
        ]
        sensors_data = [
            {
                name: {
                    "Total": len(buckets["All"]),
                    "Data":  buckets["All"]
                }
            }
            for name, buckets in by_sensor_name.items()
        ]

        alert_stations_data = [
            {
                code: {
                    "Total": len(buckets["Alert"]),
                    "Data":  buckets["Alert"]
                }
            }
            for code, buckets in by_station.items()
        ]
        alert_sensors_data = [
            {
                name: {
                    "Total": len(buckets["Alert"]),
                    "Data":  buckets["Alert"]
                }
            }
            for name, buckets in by_sensor_name.items()
        ]

        no_alert_stations_data = [
            {
                code: {
                    "Total": len(buckets["No_Alert"]),
                    "Data":  buckets["No_Alert"]
                }
            }
            for code, buckets in by_station.items()
        ]
        no_alert_sensors_data = [
            {
                name: {
                    "Total": len(buckets["No_Alert"]),
                    "Data":  buckets["No_Alert"]
                }
            }
            for name, buckets in by_sensor_name.items()
        ]

        sensorReport = {
            "Total": len(all_sensor),
            "Data": {
                "All":       all_sensor,
                "Stations":  stations_data,
                "Parameters": sensors_data
            },
            "Alert": {
                "Total": len(alert_sensor),
                "Data": {
                    "All":       alert_sensor,
                    "Stations":  alert_stations_data,
                    "Parameters": alert_sensors_data
                }
            },
            "No_Alert": {
                "Total": len(no_alert_sensor),
                "Data": {
                    "All":       no_alert_sensor,
                    "Stations":  no_alert_stations_data,
                    "Parameters": no_alert_sensors_data
                }
            }
        }

        return JsonResponse({"Log": logReport, "Sensor": sensorReport}, safe=False, status=200)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)