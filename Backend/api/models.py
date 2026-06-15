from django.db import models
from django.utils import timezone

# Create your models here.

class Station(models.Model):
    station_number = models.CharField(max_length=5, primary_key=True)
    station_location = models.CharField(max_length=50)

    def __str__(self):
        return self.station_number
    
    

class pH(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class BOD(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class DissolvedOxygen(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class Ammonia(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class Nitrate(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class InorganicPhospate(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]


class FecalUniform(models.Model):
    class Meta:
        db_table = "api_fecalcoliform"
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class Turbidity(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class Temperature(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]


class ORP(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]

class TDS(models.Model):
    def getTime():
        return timezone.localtime(timezone.now())
    
    time = models.DateTimeField(default=getTime)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["station", "-time"]),
        ]


# --- Snowflake ----

class DimStation(models.Model):
    code = models.CharField(max_length=10, unique=True) 
    location = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["code"]),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.location}"

class DimSensor(models.Model):
    name = models.CharField(max_length=50, unique=True)   
    unit = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]
    
    def __str__(self):
        return self.name

class DimTime(models.Model):
    date = models.DateField(unique=True)

    class Meta:
        indexes = [
            models.Index(fields=["date"]),
        ]

    @property
    def year(self):
        return self.date.year

    @property
    def month(self):
        return self.date.month

    @property
    def quarter(self):
        return (self.date.month - 1) // 3 + 1

    @property
    def week(self):
        return self.date.isocalendar()[1]

    def __str__(self):
        return self.date.strftime("%B %Y")



class RawSensorReading(models.Model):
    station = models.ForeignKey(DimStation, on_delete=models.CASCADE)
    sensor = models.ForeignKey(DimSensor, on_delete=models.CASCADE)
    time = models.DateTimeField()
    value = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["station"]),
            models.Index(fields=["sensor"]),
            models.Index(fields=["time"]),
            models.Index(fields=["station", "sensor", "time"]),
        ]

    def __str__(self):
        return f"{self.station.code} | {self.sensor.name} @ {self.time} = {self.value}"

class DailySensorReading(models.Model):
    station = models.ForeignKey(DimStation, on_delete=models.CASCADE)
    sensor = models.ForeignKey(DimSensor, on_delete=models.CASCADE)
    time = models.ForeignKey(DimTime, on_delete=models.CASCADE)
    value = models.FloatField()
    class Meta:
        unique_together = ("station", "sensor", "time")
        indexes = [
            models.Index(fields=["station"]),
            models.Index(fields=["sensor"]),
            models.Index(fields=["time"]),
            models.Index(fields=["station", "sensor", "time"]),
        ]
    def __str__(self):
        return f"{self.station.code} | {self.sensor.name} | {self.time.date} = {self.value}"


class WeeklySensorReading(models.Model):
    station = models.ForeignKey(DimStation, on_delete=models.CASCADE)
    sensor = models.ForeignKey(DimSensor, on_delete=models.CASCADE)
    time = models.ForeignKey(DimTime, on_delete=models.CASCADE)
    value = models.FloatField()
    
    class Meta:
        unique_together = ("station", "sensor", "time")
        indexes = [
            models.Index(fields=["station"]),
            models.Index(fields=["sensor"]),
            models.Index(fields=["time"]),
            models.Index(fields=["station", "sensor", "time"]),
        ]
    def __str__(self):
        return f"{self.station.code} | {self.sensor.name} | Week {self.time.week} of {self.time.date} = {self.value}"

class FactSensorReading(models.Model):
    station = models.ForeignKey(DimStation, on_delete=models.CASCADE)
    sensor = models.ForeignKey(DimSensor, on_delete=models.CASCADE)
    time = models.ForeignKey(DimTime, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        unique_together = ("station", "sensor", "time")
        indexes = [
             models.Index(fields=["station"]),
            models.Index(fields=["sensor"]),
            models.Index(fields=["time"]),
            models.Index(fields=["station", "sensor", "time"]),
        ]

    def __str__(self):
        return f"{self.station.code} | {self.sensor.name} | {self.time.date} = {self.value}"


class BaseAudit(models.Model):    
    timestamp   = models.DateTimeField(
        default=timezone.now,
        db_index=True
    )
    description = models.TextField()
    alert       = models.BooleanField(
        default=False,
        help_text="True if the row represents an error / alarm situation"
    )

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["timestamp"])]


class SensorAlertLog(BaseAudit):   
    station  = models.ForeignKey(DimStation, on_delete=models.CASCADE)
    sensor   = models.ForeignKey(DimSensor,  on_delete=models.CASCADE)
    value    = models.FloatField(null=True, blank=True) 

    class Meta(BaseAudit.Meta):                 
        indexes = [
            models.Index(fields=["station"]),
            models.Index(fields=["sensor"]),
            models.Index(fields=["station", "sensor", "timestamp"]),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.station.code} - {self.sensor.name}: {self.description[:40]}..."


class ReportLog(BaseAudit):                     
    success  = models.BooleanField(default=True, db_index=True)
    type     = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.description[:40]}..."