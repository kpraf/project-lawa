import pandas as pd
from django.core.management.base import BaseCommand
from datetime import datetime
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from api.models import DimStation, DimSensor, DimTime, FactSensorReading
from api.helper.helper import WaterQuality

# Map CSV columns to sensor names
SENSOR_MAP = {
    'BOD (mg/L)': 'BOD',
    'Dissolved Oxygen (mg/L)': 'DO',
    'Fecal Coliform, MPN/100ml (Geomean)': 'Fecal Coliform',
    'pH (units)': 'pH',
    'Ammonia (mg/L)': 'Ammonia',
    'Nitrate (mg/L)': 'Nitrate',
    'Inorganic Phospate (mg/L)': 'Inorganic Phosphate',
    'ORP': 'ORP',
    'Temperature': 'Temperature',
    'TDS': 'TDS',
}

def parse_month(month_str):
    """Parse month string in format 'MMM-YY' to datetime"""
    try:
        # Parse the month and year
        month, year = month_str.split('-')
        # Convert 2-digit year to 4-digit year
        year = '20' + year
        # Parse the date
        date = datetime.strptime(f"{month}-{year}", "%b-%Y")
        return date
    except Exception as e:
        raise ValueError(f"Invalid date format: {month_str}. Expected format: MMM-YY (e.g., Feb-16)")

def send_upload_notification(station, sensor, time, value):
    """Send email notification for new data upload"""
    try:
        print(f"Attempting to send email for {station} - {sensor}")  # Debug print
        
        classification = WaterQuality(sensor, value)
        print(f"Classification: {classification}")  # Debug print
        
        html_message = render_to_string('uploaded.html', {
            'station': station,
            'sensor': sensor,
            'time': time.strftime("%Y-%m-%d"),
            'classification': classification['Class'],
            'value': value,
        })
        
        print(f"Email settings: {settings.EMAIL_HOST_USER}")  # Debug print
        
        email = EmailMessage(
            'New Water Quality Data Upload',
            html_message,
            settings.EMAIL_HOST_USER,
            ['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com'],
        )
        email.content_subtype = "html" 
        email.send()
        print(f"Email sent successfully for {sensor}")  # Debug print
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")  # Debug print
        print(f"Error type: {type(e)}")  # Debug print
        import traceback
        print(f"Traceback: {traceback.format_exc()}")  # Debug print

class Command(BaseCommand):
    help = "Upload historical water quality data into FactSensorReading"

    def add_arguments(self, parser):
        parser.add_argument('--csv', type=str, required=True, help='Path to the CSV file to upload')

    def handle(self, *args, **options):
        csv_path = options['csv']
        print(f"Starting to process CSV file: {csv_path}")  # Debug print
        
        try:
            # Read CSV file
            df = pd.read_csv(csv_path)
            total_rows = len(df)
            print(f"Found {total_rows} rows in CSV")  # Debug print
            imported = 0
            errors = []
            
            # Process each row
            for index, row in df.iterrows():
                try:
                    print(f"\nProcessing row {index + 1}")  # Debug print
                    
                    # Parse date and create time dimension
                    parsed_date = parse_month(str(row['Month']))
                    print(f"Parsed date: {parsed_date}")  # Debug print
                    dim_time, _ = DimTime.objects.get_or_create(date=parsed_date.replace(day=1))

                    # Get station code and create station dimension
                    station_code = row['Stations'].split()[1]  # e.g., "Stn. II (East Bay)" → "II"
                    print(f"Processing station: {station_code}")  # Debug print
                    station_obj, _ = DimStation.objects.get_or_create(
                        code=station_code,
                        defaults={'location': row['Stations']}
                    )

                    # Process each sensor
                    for csv_col, sensor_name in SENSOR_MAP.items():
                        value = row.get(csv_col)
                        if pd.isna(value):
                            continue

                        try:
                            value = float(value)
                            print(f"Processing {sensor_name}: {value}")  # Debug print
                        except (ValueError, TypeError):
                            continue

                        # Create sensor dimension
                        sensor_obj, _ = DimSensor.objects.get_or_create(
                            name=sensor_name,
                            defaults={'unit': csv_col.split('(')[1].split(')')[0] if '(' in csv_col else ''}
                        )

                        # Create or update fact reading
                        fact, created = FactSensorReading.objects.update_or_create(
                            station=station_obj,
                            sensor=sensor_obj,
                            time=dim_time,
                            defaults={"value": value}
                        )
                        
                        # Send notification for new readings
                        if created:
                            print(f"New reading created for {sensor_name}")  # Debug print
                            # send_upload_notification(
                            #     station=station_code,
                            #     sensor=sensor_name,
                            #     time=parsed_date,
                            #     value=value
                            # )
                        
                        imported += 1

                    print(f"Completed processing record {index + 1}")  # Debug print

                except Exception as row_error:
                    error_msg = f"Row {index}: {str(row_error)}"
                    print(f"Error: {error_msg}")  # Debug print
                    errors.append(error_msg)
                    continue

            # Print results
            success_message = f"Successfully uploaded {imported} records from {csv_path}"
            print("\n" + success_message)  # Debug print
            self.stdout.write(self.style.SUCCESS(success_message))
            
            if errors:
                error_message = f"\nEncountered {len(errors)} errors:\n" + "\n".join(errors[:10])
                if len(errors) > 10:
                    error_message += f"\n... and {len(errors) - 10} more errors"
                print(error_message)  # Debug print
                self.stderr.write(self.style.WARNING(error_message))

        except Exception as global_error:
            error_msg = f"Failed to upload CSV: {csv_path}. Error: {str(global_error)}"
            print(f"Global error: {error_msg}")  # Debug print
            self.stderr.write(self.style.ERROR(error_msg))