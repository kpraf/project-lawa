from django.db import models

# Create your models here.

class Report(models.Model):
    year = models.CharField(max_length=4)
    quarter = models.CharField(max_length=2)
    title = models.CharField(max_length=255)
    pdf = models.FileField(upload_to='reports/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title