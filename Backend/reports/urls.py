from django.urls import path
from .views import upload_report, list_reports, water_quality_table, email, delete_all


urlpatterns = [
    path("upload/", upload_report, name="upload_report"),
    path("list/", list_reports, name="list_reports"),
    path("water-quality-table/", water_quality_table, name="water_quality_table"),
    path("email/", email, name="email"),
    path("delete/", delete_all, name="delete_all"),
]

