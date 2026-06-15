from api.models import ReportLog
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Get all ReportLog entries
        report_logs = ReportLog.objects.all()

        # Iterate through each ReportLog entry
        for report_log in report_logs:
            self.stdout.write(
                self.style.SUCCESS('Processing ReportLog entry: {}'.format(report_log))
            )
            if report_log.description.split()[0] == "Sent":
                report_log.type = "System"
                self.stdout.write(
                        self.style.SUCCESS('Successfully updated ReportLog type to System')
                    )

            
            elif report_log.description.split()[0] == "Generated":
                report_log.type = "Report"
                self.stdout.write(
                        self.style.SUCCESS('Successfully updated ReportLog type to Report')
                    )
            
            else:
                report_log.type = "System"
                self.stdout.write(
                        self.style.SUCCESS('Successfully updated ReportLog type to System')
                    )

            # Save the changes to the database
            report_log.save()
            self.stdout.write(
                self.style.SUCCESS('Successfully updated ReportLog entry: {}'.format(report_log))
            )
            
                