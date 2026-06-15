from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from .models import Report
import json
from api.models import pH, TDS, Turbidity, DissolvedOxygen, ORP, Temperature, Station, Nitrate, InorganicPhospate, FecalUniform, DimTime
from api.helper.helper import WaterQuality
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.timezone import localtime
from datetime import datetime, timedelta
from reports.helper.legends import get_legends
from api.models import ReportLog
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.db.models.functions import ExtractYear, ExtractQuarter



def email(request):
    send_mail('Latest Report',
              "Testing",
              settings.EMAIL_HOST_USER,
              ['borgepaguirigan@gmail.com', 'cjdumlao14@gmail.com', 'senalmazora@gmail.com'],
              fail_silently=True)
    return JsonResponse({"message": "Email sent successfully."}, status=200)

from reports.models import Report  # or wherever your Report model is

def delete_all(request):
    

    try:
        for report in Report.objects.all():
            if report.pdf:
                report.pdf.delete(save=False)  


        Report.objects.all().delete()
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"message": "Deleted Successfully."}, status=200)

@csrf_exempt
def upload_report(request):
    def sendEmail(context):
        try:
            context['pdf_url'] = "https://api.projectlawa.org" + context['pdf_url']
            
            html_message = render_to_string("report_uploaded.html", context)
            email = EmailMessage(
                subject=f"📥 New Water Quality Report: Q{context['quarter']} {context['year']} Uploaded",
                body=html_message,
                from_email=settings.EMAIL_HOST_USER,
                to=["borgepaguirigan@gmail.com", "cjdumlao14@gmail.com", "senalmazora@gmail.com", "jonalyne1221@gmail.com"], 
            )
            email.content_subtype = "html"
            email.send()
            ReportLog.objects.create(
                description=f"Sent email for Q{context['quarter']} {context['year']}",
                success=True
            )


        except Exception as e:
            ReportLog.objects.create(
                description=f"Error sending email for Q{context['quarter']} {context['year']}: {e}",
                success=False
            )
    
    if request.method == "POST":
        year = request.POST.get("year")
        quarter = request.POST.get("quarter")
        title = quarter + " Q" + year
        pdf = request.FILES.get("pdf")

        if not year or not quarter:
            return JsonResponse({"error": "Missing year, or quarter."}, status=400)

        if not pdf or not pdf.name.endswith('.pdf'):
            return JsonResponse({"error": "Only PDF files are allowed."}, status=400)

        try:
            report = Report.objects.create(
                year=year,
                quarter=quarter,
                title=title,
                pdf=pdf
            )

            ReportLog.objects.create(
                    description=f"Report '{title}' uploaded successfully",
                    success=True,
                    timestamp=timezone.now()
                )
            
            context = {
                "year": year,
                "quarter": quarter,
                "title": title,
                "pdf_url": report.pdf.url,
                "created_at": localtime(report.created_at).strftime("%B %d, %Y, %I:%M %p"),
            }

            sendEmail(context)

            return JsonResponse({"message": "Report uploaded successfully.", "id": report.id}, status=201)
        
        
        except Exception as e:
            ReportLog.objects.create(
                description=f"Failed to upload report '{title}': {str(e)}",
                success=False,
                timestamp=timezone.now()
            )
            return JsonResponse({"error": "Invalid request method."}, status=405)



def list_reports(request):
    try:
        report_list = []

        periods = (
            DimTime.objects
            .annotate(
                year    = ExtractYear('date'),
                quarter = ExtractQuarter('date'),
            )
            .values_list('year', 'quarter')
            .distinct()
            .order_by('-year', '-quarter')
        )
        
        all_reports = Report.objects.all()
        report_map = {
            (r.year, r.quarter): r
            for r in all_reports
        }


        report_list = []
        for year, quarter in periods:

            rep = report_map.get((str(year), str(quarter)))
            if rep:
                title   = rep.title
                
                pdf_url = request.build_absolute_uri(settings.MEDIA_URL + str(rep.pdf))
            else:
                title   = f"Q{quarter} {year}"
                pdf_url = None

            report_list.append({
                'year':    year,
                'quarter': quarter,
                'title':   title,
                'pdf':     pdf_url,
            })

        return JsonResponse({'reports': report_list}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

def get_quarter_months(quarter):
    """Get the months for a given quarter (1-4)"""
    current_year = timezone.now().year
    if quarter == 1:
        return ["January", "February", "March"]
    elif quarter == 2:
        return ["April", "May", "June"]
    elif quarter == 3:
        return ["July", "August", "September"]
    elif quarter == 4:
        return ["October", "November", "December"]
    return []

def get_month_start_end(month, year):
    """Get start and end dates for a given month"""
    month_num = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }[month]
    
    # Create timezone-aware datetime objects
    start_date = timezone.make_aware(datetime(year, month_num, 1))
    if month_num == 12:
        end_date = timezone.make_aware(datetime(year + 1, 1, 1) - timedelta(days=1))
    else:
        end_date = timezone.make_aware(datetime(year, month_num + 1, 1) - timedelta(days=1))
    
    return start_date, end_date


def water_quality_table(request):
    # Get current quarter (1-4)
    current_month = timezone.now().month
    current_quarter = (current_month - 1) // 3 + 1

    # Get quarter from request or use current quarter
    quarter = int(request.GET.get('quarter', current_quarter))
    year = int(request.GET.get('year', timezone.now().year))

    # Get months for the selected quarter
    selected_months = get_quarter_months(quarter)

    # Get legends and parameters from legends.py
    legends = get_legends()
    parameters = list(legends.keys())

    # Divide parameters into 3 groups for tables/legends
    group_size = (len(parameters) + 2) // 3
    param_groups = [
        parameters[:group_size],
        parameters[group_size:2*group_size],
        parameters[2*group_size:]
    ]

    # Map parameter names to their corresponding models
    model_map = {
        "pH": pH,
        "Temperature": Temperature,
        "DO": DissolvedOxygen,
        "Turbidity": Turbidity,
        "ORP": ORP,
        "TDS": TDS,
        "Nitrate": Nitrate,
        "Inorganic Phosphate": InorganicPhospate,
        "Fecal Coliform": FecalUniform,
        "BOD": None,      # Add your BOD model if available
        "Ammonia": None,  # Add your Ammonia model if available
    }

    table_data = []

    # Only get Station I and Station II
    stations = Station.objects.filter(station_number__in=['I', 'II'])

    for station in stations:
        station_row = {
            "station": f"Stn. {station.station_number} ({station.station_location})",
            "parameters": {}
        }

        for param in parameters:
            station_row["parameters"][param] = {}

            for month in selected_months:
                start_date, end_date = get_month_start_end(month, year)
                model = model_map.get(param)
                if model:
                    data = (
                        model.objects
                        .filter(
                            station=station,
                            time__gte=start_date,
                            time__lte=end_date
                        )
                        .order_by("-time")
                        .values("time", "value")
                        .first()
                    )
                    if data:
                        quality_info = WaterQuality(param, data["value"])
                        station_row["parameters"][param][month] = {
                            "value": round(data["value"], 3),
                            "class": quality_info["Class"],
                            "color": quality_info["Color"],
                        }
                    else:
                        station_row["parameters"][param][month] = None
                else:
                    station_row["parameters"][param][month] = None

        table_data.append(station_row)

    return render(request, "quarterly_report.html", {
        "table_data": table_data,
        "selected_months": selected_months,
        "parameters": parameters,
        "param_groups": param_groups,
        "legends": legends,
        "current_quarter": quarter,
        "current_year": year,
    })