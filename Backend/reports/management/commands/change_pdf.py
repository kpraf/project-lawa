from django.core.management.base import BaseCommand
from reports.models import Report

class Command(BaseCommand):
    help = 'Set pdf field to null for all reports in year 2024, and for year 2023 except quarter 1'

    def handle(self, *args, **options):
        reports_2024 = Report.objects.filter(year=2024)
        reports_2023 = Report.objects.filter(year=2023).exclude(quarter=1)
        reports = list(reports_2024) + list(reports_2023)
        for report in reports:
            report.delete()
            self.stdout.write(self.style.SUCCESS(f'Successfully deleted) report: {report.title}'))