from django.urls import path

from .views.index import index
from .views.request_data import getAll, getRecent, report_table, RecentData, getLogs, getDate, getWeeklyData, getDailyData, getRawData
from .views.download_data import downloadWaterData
from .views.upload_data import uploadData


urlpatterns = [
    path("", index, name="index"),
    path("get-all-data/", getAll, name="getAll"),
    path("upload-data", uploadData, name="upload"),
    path("download-csv/", downloadWaterData, name="download-water-data"),
    path("recent-data/<str:station_id>", getRecent, name="get-recent"),
    path("recent-data", RecentData, name="RecentData"),
    path("report-table", report_table, name="report-table"),
    path("report-logs", getLogs, name="getLogs"),
    path("getDate/", getDate, name="getDate"),
    path("get-weekly-data", getWeeklyData, name="get-weekly-data"),
    path("get-daily-data", getDailyData, name="get-daily-data"),
    path("get-raw-data", getRawData, name="get-raw-data"),
]