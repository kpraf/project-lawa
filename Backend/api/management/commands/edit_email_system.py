from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import  date
from dateutil.relativedelta import relativedelta
from api.models import ReportLog


class Command(BaseCommand):
    help = "Edit Email to System"

    def handle(self, *args, **options):
        try:
            report_logs = ReportLog.objects.all()
            for report_log in report_logs:
                if not report_log.success and report_log.description == "Email sent successfully":
                    report_log.description = "Error: Email not sent."
                    report_log.save()
                    self.stdout.write(
                        self.style.SUCCESS(f"Updated ReportLog ID: {report_log.id} to type 'System'")
                    )
                self.stdout.write(
                    self.style.WARNING(f"ReportLog ID: {report_log.id} already has type 'System'")
                )
        
            self.stdout.write(
                self.style.SUCCESS("Successfully updated all ReportLog types from 'Email' to 'System'")
            )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error: {str(e)}")
            )
        

