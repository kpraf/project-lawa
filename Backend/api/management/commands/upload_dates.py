# backend/api/management/commands/upload_dates.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import  date
from dateutil.relativedelta import relativedelta
from api.models import DimTime

class Command(BaseCommand):
    help = 'Upload dates to DimTime from start_year-start_month until current month'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-year',
            type=int,
            default=2016,
            help='Start year (default: 2016)'
        )
        parser.add_argument(
            '--start-month',
            type=int,
            default=1,
            help='Start month (default: 1)'
        )

    def handle(self, *args, **options):
        try:
            current_date = timezone.now().date()
            
            
            start_date = date(options['start_year'], options['start_month'], 1)
            current_iter_date = start_date
            created_dates = []
            
            while current_iter_date <= current_date:
                dim_time, created = DimTime.objects.get_or_create(
                    date=current_iter_date
                )
                
                if created:
                    created_dates.append(current_iter_date)
                    self.stdout.write(
                        self.style.SUCCESS(f'Created date: {current_iter_date}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Date already exists: {current_iter_date}')
                    )
                
                current_iter_date += relativedelta(months=1)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {len(created_dates)} new dates'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )