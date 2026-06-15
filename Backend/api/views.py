from django.http import HttpResponse, JsonResponse
from api.models import Station, BOD, DissolvedOxygen, FecalUniform, pH, Ammonia, Nitrate, InorganicPhospate, Temperature, TDS, Turbidity, ORP
from django.utils import timezone
from django.forms.models import model_to_dict
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
import json
import csv
from django.utils import timezone
from datetime import datetime, timedelta


def index(request):
    return HttpResponse("API is working")


def downloadWaterData(request, startDate, endDate):
    def iterate(writer, data, sensor):
        for d in data:
            writer.writerow([d['station_id'], sensor, d['value'], d['time']])
        return
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename="data-{startDate}-{endDate}.csv"'},
        status=200,
        )
    
    try:
        ph = pH.objects.filter(time__date__range=(startDate, endDate)).values()
        temperature = Temperature.objects.filter(time__date__range=(startDate, endDate)).values()
        tds = TDS.objects.filter(time__date__range=(startDate, endDate)).values()
        turbidity = Turbidity.objects.filter(time__date__range=(startDate, endDate)).values()
        do = DissolvedOxygen.objects.filter(time__date__range=(startDate, endDate)).values()
        orp = ORP.objects.filter(time__date__range=(startDate, endDate)).values()

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

    
    writer = csv.writer(response)
    writer.writerow(['Station', 'Sensor', 'Value', 'Time'])

    iterate(writer, ph, "pH")
    iterate(writer, temperature, "Temperature")
    iterate(writer, tds, "Todal Dissolved Solids")
    iterate(writer, turbidity, "Turbidity")
    iterate(writer, do, "Dissolved Oxygen")
    iterate(writer, orp, "Oxidation Reduction Potential")


    return response

    




def getAll(request):
    

    data = {"Stations": list(Station.objects.all().values()),
            "Parameters": {

                "BOD": list(BOD.objects.all().values()),
                "Dissolved Oxygen": list(DissolvedOxygen.objects.all().values()),
                "Fecal Coliform": list(FecalUniform.objects.all().values()),
                "pH": list(pH.objects.all().values()),
                "Ammonia": list(Ammonia.objects.all().values()),
                "Nitrate": list(Nitrate.objects.all().values()),
                "Inorganic Phospate": list(InorganicPhospate.objects.all().values()),
                "Temperature": list(Temperature.objects.all().values())
            }}


    


    return JsonResponse(data, status=200)

@csrf_exempt
def uploadData(request):
    def sendEmail(sensor, value,station):
        send_mail(
            "Warning",
            f"Abnormal Value Detected at Station {station}!\n{sensor}:{value}",
            "lc6035769@gmail.com",
            ["borgepaguirigan@gmail.com"],
            fail_silently=False,
        )
        return
     
    if request.method == "POST":
        body = json.loads(request.body)
        value = body.get('value')
        station = body.get('station')
        sensor = body.get('sensor')
            
        # sendEmail(sensor, value, station)

        sensor_map = {
            "temperature": Temperature,
            "pH": pH,
            "TDS": TDS,
            "Turbidity" : Turbidity,
            "DO" : DissolvedOxygen,
            "ORP": ORP,
            
        }


        station_num = Station.objects.get(station_number = station)
        try:
            post_sensor = sensor_map[sensor](
                time = timezone.now(),
                station = station_num,
                value = float(value)
            )

            post_sensor.save()
            
            return JsonResponse({"message": "Success"}, status=200)
        except KeyError:
            return JsonResponse({"message": "Sensor not Found"}, status=404)

        except Exception as e:
            return JsonResponse({"message": str(e)}, status= 500)
    




def getRecent(request, station_id):
    
    parameters = {
        "BOD": None,
        "Dissolved Oxygen": None,
        "Fecal Coliform": None,
        "pH": None,
        "Ammonia": None,
        "Nitrate": None,
        "Inorganic Phosphate": None,
        "Temperature": None,
        "Turbidity": None,
    }

    try:
        models = {
            "BOD": BOD,
            "Dissolved Oxygen": DissolvedOxygen,
            "Fecal Coliform": FecalUniform,
            "pH": pH,
            "Ammonia": Ammonia,
            "Nitrate": Nitrate,
            "Inorganic Phosphate": InorganicPhospate,
            "Temperature": Temperature,
            "Turbidity": Turbidity
        }

        for key, model in models.items():
            try:
                parameters[key] = model_to_dict(model.objects.filter(station=station_id).latest('time'))
            except ObjectDoesNotExist:
                parameters[key] = None
       
        return JsonResponse({"Parameters": parameters}, status=200)
    
    except Exception as e:
        return JsonResponse({"message": str(e)},status=500)
    