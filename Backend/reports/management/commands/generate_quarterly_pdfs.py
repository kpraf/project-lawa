import os
os.add_dll_directory(r'C:\Program Files\GTK3-Runtime Win64\bin')
from pathlib import Path
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML
from django.core.mail import EmailMessage 
from django.utils.timezone import localtime
from django.core.mail import get_connection

from api.models import (
    DimStation,
    DimSensor,
    DimTime,
    FactSensorReading,
    ReportLog
)
from reports.helper.legends import get_legends
from reports.views import get_quarter_months
from api.helper.helper import WaterQuality

from reports.models import Report
from django.core.files import File



def sendemail(context, self):
    try:
        context['pdf_url'] = "https://api.projectlawa.org" + context['pdf_url']
        
        html_message = render_to_string("report_created.html", context)
        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= f"📄 New Water Quality Report: Q{context['quarter']} {context['year']}",
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com', 'jonalyne1221@gmail.com', 'jensenalmazora@gmail.com'],
            connection=zepto_connection
        )
        msg.content_subtype = "html"
        msg.send()
        ReportLog.objects.create(
            description=f"Sent email for Q{context['quarter']} {context['year']}",
            success=True
        )
        self.stdout.write(self.style.SUCCESS(f"Email sent to team with report link."))


    except Exception as e:
        self.stderr.write(self.style.ERROR(f"Failed to send email: {e}"))
        ReportLog.objects.create(
            description=f"Error sending email for Q{context['quarter']} {context['year']}: {e}",
            success=False
        )
        

class Command(BaseCommand):
    help = "Generate quarterly PDF report for a specific year and quarter."

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, required=True, help='Year for the report (e.g. 2024)')
        parser.add_argument('--quarter', type=int, choices=[1,2,3,4], required=True, help='Quarter for the report (1-4)')

    
    
    def handle(self, *args, **options):
        legends = get_legends()
        parameters = list(legends.keys())


        sensor_map = {
            sensor.name: sensor
            for sensor in DimSensor.objects.filter(name__in=parameters)
        }

        param_groups = [
            ["pH", "Temperature", "DO"],
            ["Turbidity", "ORP", "TDS"],
            ["Nitrate", "Inorganic Phosphate", "Fecal Coliform"],
            ["BOD", "Ammonia"],
        ]


        output_dir = Path(settings.MEDIA_ROOT) / "reports"
        output_dir.mkdir(parents=True, exist_ok=True)


        month_map = {
            "January": 1,   "February": 2,  "March": 3,
            "April":   4,   "May": 5,       "June": 6,
            "July":    7,   "August": 8,    "September": 9,
            "October": 10,  "November": 11, "December": 12,
        }

        year = options['year']
        quarter = options['quarter']


        raw_months = get_quarter_months(quarter)

        months = [month_map[m] for m in raw_months]


        if not FactSensorReading.objects.filter(
            time__date__year=year,
            time__date__month__in=months
        ).exists():
            self.stdout.write(self.style.WARNING(f"No data for Q{quarter} {year}, skipping."))
            return

        table_data = []
        for station in DimStation.objects.all().order_by("code"):
            row = {
                "station": f"{station.code} ({station.location})",
                "parameters": {}
            }
            for param in parameters:
                row["parameters"][param] = {}
                sensor = sensor_map.get(param)
                for month_name, month_num in zip(raw_months, months):
                    # Find the DimTime for this year and month
                    dim_time = DimTime.objects.filter(date__year=year, date__month=month_num).first()
                    if sensor and dim_time:
                        rec = (
                            FactSensorReading.objects
                                .filter(
                                    station=station,
                                    sensor=sensor,
                                    time=dim_time
                                )
                                .order_by("-time__date")
                                .first()
                        )
                        if rec:
                            val = round(rec.value, 3)
                            qinfo = WaterQuality(param, rec.value)
                            row["parameters"][param][month_name] = {
                                "value": val,
                                "class": qinfo["Class"],
                                "color": qinfo["Color"],
                            }
                        else:
                            row["parameters"][param][month_name] = None
                    else:
                        row["parameters"][param][month_name] = None
            table_data.append(row)


        context = {
            "table_data": table_data,
            "selected_months": raw_months,
            "parameters": parameters,
            "param_groups": param_groups,
            "legends": legends,
            "current_quarter": quarter,
            "current_year": year,
        }
        html = render_to_string("quarterly_report.html", context)


        filename = f"Water_Quality_Q{quarter}_{year}.pdf"
        outfile = output_dir / filename

        try:
            HTML(string=html).write_pdf(str(outfile))
            
            # existing_report = Report.objects.filter(
            #     year=str(year),
            #     quarter=str(quarter)
            # ).first()
            
            # if existing_report and existing_report.pdf:
            #     existing_report.pdf.delete()
            

            report_obj, created = Report.objects.get_or_create(
                year=str(year),
                quarter=str(quarter),
                defaults={"title": f"Q{quarter} {year}"}
            )
            

            with open(outfile, "rb") as f:
                report_obj.pdf.save(filename, File(f), save=True)
            

            if os.path.exists(outfile):
                os.remove(outfile)
            
            ReportLog.objects.create(
                description=f"Generated Q{quarter} {year} → {filename}",
                success=True
            )
            self.stdout.write(self.style.SUCCESS(f"Wrote {outfile} and saved to Report table"))

            context = {
                "year": report_obj.year,
                "quarter": report_obj.quarter,
                "title": report_obj.title,
                "created_at": localtime(report_obj.created_at).strftime("%B %d, %Y, %I:%M %p"),
                "pdf_url": report_obj.pdf.url,
            }

            sendemail(context, self)
            
        except Exception as e:
            ReportLog.objects.create(
                description=f"Error Q{quarter} {year}: {e}",
                success=False
            )
            self.stderr.write(self.style.ERROR(f"Failed Q{quarter} {year}: {e}"))