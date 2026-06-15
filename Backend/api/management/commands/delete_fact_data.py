from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from datetime import datetime
from api.models import FactSensorReading

class Command(BaseCommand):
    help = 'Deletes FactSensorReading data within a specified date range.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-date',
            type=str,
            required=True,
            help='The start date for deletion (YYYY-MM-DD format).'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            required=True,
            help='The end date for deletion (YYYY-MM-DD format).'
        )

    def handle(self, *args, **options):
        try:
            start_date = datetime.strptime(options['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(options['end_date'], '%Y-%m-%d').date()
        except ValueError:
            raise CommandError("Invalid date format. Please use YYYY-MM-DD.")

        if start_date > end_date:
            raise CommandError("The start date cannot be after the end date.")

        self.stdout.write(f"Searching for FactSensorReading data from {start_date} to {end_date}...")

        # Filter FactSensorReading records based on the date in the related DimTime model
        records_to_delete = FactSensorReading.objects.filter(
            time__date__range=[start_date, end_date]
        )

        count = records_to_delete.count()

        if count == 0:
            self.stdout.write(self.style.WARNING("No records found in the specified date range. Nothing to delete."))
            return

        self.stdout.write(self.style.WARNING(f"Found {count} records to delete."))
        
        # Ask for confirmation
        confirmation = input("Are you sure you want to delete these records? (yes/no): ")

        if confirmation.lower() != 'yes':
            self.stdout.write(self.style.ERROR("Deletion cancelled by user."))
            return

        try:
            with transaction.atomic():
                deleted_count, _ = records_to_delete.delete()
                self.stdout.write(self.style.SUCCESS(f"Successfully deleted {deleted_count} records."))
        except Exception as e:
            raise CommandError(f"An error occurred during deletion: {e}")
