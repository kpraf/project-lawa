import pandas as pd
from django.utils import timezone
from datetime import datetime
from api.models import Station, BOD, DissolvedOxygen, FecalUniform, pH, Ammonia, Nitrate, InorganicPhospate


def convertDateTime(date):

    actualDate = datetime.strptime(date, "%b-%y")

    timezone_aware_datetime = timezone.make_aware(actualDate, timezone=timezone.get_fixed_timezone(8 * 60))

    return timezone_aware_datetime


filePath = "../backend/Copy of LLDA-Data-2013-2023-Compiled.xlsx - Preprocessing v2B.csv"

df = pd.read_csv(filePath)

stations = df['Stations'].unique()


for i in stations:
    print(i)
    i = i.split(" ", 2)
    print(i)
    
    station = Station(
        station_number = i[1],
        station_location = i[-1].strip("(").strip(")")
    )

    station.save()


for i, data in df.iterrows():
    
    date = convertDateTime(data['Month'])
    num = data['Stations'].split()
    station_num = Station.objects.get( station_number = num[1])
    
    bod = BOD(
        time = date,
        station = station_num,
        value = float(data['BOD (mg/L)'])
    )
    bod.save()

    do = DissolvedOxygen(
        time = date,
        station = station_num,
        value = float(data['Dissolved Oxygen (mg/L)'])
    )

    do.save()

    fecal = FecalUniform(
        time = date,
        station = station_num,
        value = float(data['Fecal Coliform, MPN/100ml (Geomean)'])
    )

    fecal.save()

    ph = pH(
        time = date,
        station = station_num,
        value = float(data['pH (units)'])
    )

    ph.save()

    ammonia = Ammonia(
        time = date,
        station = station_num,
        value = float(data['Ammonia (mg/L)'])
    )
    ammonia.save()

    nitrate = Nitrate(
        time = date,
        station = station_num,
        value = float(data['Nitrate (mg/L)'])
    )

    nitrate.save()


    phospate = InorganicPhospate(
        time = date,
        station = station_num,
        value = float(data['Inorganic Phospate (mg/L)'])
    )

    phospate.save()

    print("done", i+1)

# Month                                                 Mar-23
# Stations                               Stn. XXII (Jala-jala)
# BOD (mg/L)                                               2.0
# Dissolved Oxygen (mg/L)                                  7.7
# Fecal Coliform, MPN/100ml (Geomean)                    167.0
# pH (units)                                               8.0
# Ammonia (mg/L)                                         0.005
# Nitrate (mg/L)                                          0.56
# Inorganic Phospate (mg/L)                               0.23