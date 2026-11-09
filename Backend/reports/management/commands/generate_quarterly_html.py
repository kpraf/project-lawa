import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.conf import settings

from api.models import DimStation, DimSensor, DimTime, FactSensorReading
from reports.helper.legends import get_legends
from reports.views import get_quarter_months
from api.helper.helper import WaterQuality

# Legend keys that are named differently in the static dataset.
JSON_PARAM_NAMES = {"DO": "Dissolved Oxygen"}


def table_from_json(path, year, raw_months, months, parameters):
    data = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    locations = data.get("metadata", {}).get("stations", {})
    values = {}
    for series in data["series"]:
        for point in series["data"]:
            y, m = int(point["time"][:4]), int(point["time"][5:7])
            if y == year and m in months and point["value"] is not None:
                values[(series["station"], series["parameter"], m)] = point["value"]
    if not values:
        return None

    table_data = []
    for code in sorted({station for station, _, _ in values}):
        location = locations.get(code, {}).get("location", "")
        row = {"station": f"{code} ({location})" if location else code, "parameters": {}}
        for param in parameters:
            row["parameters"][param] = {}
            for month_name, month_num in zip(raw_months, months):
                value = values.get((code, JSON_PARAM_NAMES.get(param, param), month_num))
                if value is None:
                    row["parameters"][param][month_name] = None
                    continue
                qinfo = WaterQuality(param, value)
                row["parameters"][param][month_name] = {
                    "value": round(value, 3),
                    "class": qinfo["Class"],
                    "color": qinfo["Color"],
                }
        table_data.append(row)
    return table_data


class Command(BaseCommand):
    help = "Generate quarterly HTML reports (open in Chrome and Print → Save as PDF)"

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, required=True)
        parser.add_argument('--quarter', type=int, choices=[1, 2, 3, 4], required=True)
        parser.add_argument(
            '--from-json',
            help='Read readings from a static historical.json (e.g. Frontend/public/data/historical.json) instead of the database',
        )

    def handle(self, *args, **options):
        legends = get_legends()
        parameters = list(legends.keys())

        param_groups = [
            ["pH", "Temperature", "DO"],
            ["Turbidity", "ORP", "TDS"],
            ["Nitrate", "Inorganic Phosphate", "Fecal Coliform"],
            ["BOD", "Ammonia"],
        ]

        month_map = {
            "January": 1, "February": 2, "March": 3,
            "April": 4, "May": 5, "June": 6,
            "July": 7, "August": 8, "September": 9,
            "October": 10, "November": 11, "December": 12,
        }

        year = options['year']
        quarter = options['quarter']
        raw_months = get_quarter_months(quarter)
        months = [month_map[m] for m in raw_months]

        if options.get('from_json'):
            table_data = table_from_json(options['from_json'], year, raw_months, months, parameters)
        else:
            table_data = self.table_from_db(year, raw_months, months, parameters)
        if table_data is None:
            self.stdout.write(self.style.WARNING(f"No data for Q{quarter} {year}, skipping."))
            return

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

        output_dir = Path(settings.BASE_DIR).parent / "html_reports"
        output_dir.mkdir(exist_ok=True)
        filename = f"Water_Quality_Q{quarter}_{year}.html"
        outfile = output_dir / filename
        outfile.write_text(html, encoding="utf-8")

        self.stdout.write(self.style.SUCCESS(f"Saved: {outfile}"))
        self.stdout.write("Open this file in Chrome, then File → Print → Save as PDF (set paper to A4 landscape, no margins)")

    def table_from_db(self, year, raw_months, months, parameters):
        sensor_map = {s.name: s for s in DimSensor.objects.filter(name__in=parameters)}

        if not FactSensorReading.objects.filter(
            time__date__year=year,
            time__date__month__in=months
        ).exists():
            return None

        table_data = []
        for station in DimStation.objects.all().order_by("code"):
            row = {"station": f"{station.code} ({station.location})", "parameters": {}}
            for param in parameters:
                row["parameters"][param] = {}
                sensor = sensor_map.get(param)
                for month_name, month_num in zip(raw_months, months):
                    dim_time = DimTime.objects.filter(date__year=year, date__month=month_num).first()
                    if sensor and dim_time:
                        rec = (
                            FactSensorReading.objects
                            .filter(station=station, sensor=sensor, time=dim_time)
                            .order_by("-time__date")
                            .first()
                        )
                        if rec:
                            qinfo = WaterQuality(param, rec.value)
                            row["parameters"][param][month_name] = {
                                "value": round(rec.value, 3),
                                "class": qinfo["Class"],
                                "color": qinfo["Color"],
                            }
                        else:
                            row["parameters"][param][month_name] = None
                    else:
                        row["parameters"][param][month_name] = None
            table_data.append(row)
        return table_data
