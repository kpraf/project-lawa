"""Build Frontend/public/data/historical.json from the 2016-2023 base export plus the 2025 LLDA quarterly sheets.

Run: python "Data Preprocessing/build_static_dataset.py"
"""
import calendar
import json
import re
from collections import defaultdict
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BASE = HERE / "historical_2016_2023.json"
SHEETS_2025 = HERE / "2025"
OUT = ROOT / "Frontend" / "public" / "data" / "historical.json"

YEAR = 2025
QUARTER_START_MONTH = {1: 1, 2: 4, 3: 7, 4: 10}

STATION_LOCATIONS = {
    "I": "Central West Bay", "II": "East Bay", "IV": "Central Bay", "V": "Northern West Bay",
    "VIII": "South Bay", "XIII": "Taytay", "XV": "San Pedro", "XVI": "Sta. Rosa",
    "XVII": "Sanctuary", "XVIII": "Pagsanjan", "XIX": "Muntinlupa", "XX": "GEMS",
    "XXI": "Cardona", "XXII": "Jala-jala", "XXIII": "Lumban", "XXIV": "Cardona (North Central Bay)",
}

# Sheet header prefix -> parameter name used by the frontend. Chloride and TSS have no grading, so they are dropped.
PARAM_PREFIXES = [
    ("Dissolved Oxygen", "Dissolved Oxygen"), ("DO", "Dissolved Oxygen"), ("BOD", "BOD"),
    ("Fecal", "Fecal Coliform"), ("pH", "pH"), ("Ammonia", "Ammonia"), ("Nitrate", "Nitrate"),
    ("Phosphate", "Inorganic Phosphate"),
]

ROMAN = re.compile(r"^[IVXL]+$")


def param_for(header):
    header = (header or "").strip()
    for prefix, name in PARAM_PREFIXES:
        if header.startswith(prefix):
            return name
    return None


def parse_value(raw):
    """Numbers pass through; '<DL' (below detection limit) becomes half the detection limit,
    matching the 2016-2023 data (e.g. <1 -> 0.5); '*' and blanks are missing."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).strip()
    if text.startswith("<"):
        try:
            return float(text[1:]) / 2
        except ValueError:
            return None
    try:
        return float(text)
    except ValueError:
        return None


def read_quarter(path, quarter):
    rows = list(openpyxl.load_workbook(path, data_only=True).worksheets[0].iter_rows(values_only=True))
    data_start = next(i for i, r in enumerate(rows) if r[0] and ROMAN.match(str(r[0]).strip()))
    # The parameter header is the closest row above the data whose first group cell is filled.
    header = next(rows[i] for i in range(data_start - 1, -1, -1) if rows[i][2] and param_for(str(rows[i][2])))

    readings = []
    for row in rows[data_start:]:
        code = str(row[0] or "").strip()
        if not ROMAN.match(code):
            continue
        for col in range(2, len(row)):
            group_col = col - (col - 2) % 3
            param = param_for(str(header[group_col] or ""))
            value = parse_value(row[col])
            if param is None or value is None:
                continue
            month = QUARTER_START_MONTH[quarter] + (col - 2) % 3
            day = calendar.monthrange(YEAR, month)[1]
            readings.append((code, param, f"{YEAR}-{month:02d}-{day:02d}", value))
    return readings


def main():
    base = json.loads(BASE.read_text(encoding="utf-8-sig"))
    series = defaultdict(list)
    for s in base["series"]:
        for p in s["data"]:
            if p.get("value") is not None:
                series[(s["station"], s["parameter"])].append({"time": p["time"], "value": p["value"]})

    for quarter in (1, 2, 3, 4):
        for code, param, time, value in read_quarter(SHEETS_2025 / f"Laguna_Lake_Q{quarter}_{YEAR}.xlsx", quarter):
            series[(code, param)].append({"time": time, "value": value})

    out_series = [
        {"station": station, "parameter": param, "data": sorted(points, key=lambda p: p["time"])}
        for (station, param), points in sorted(series.items())
    ]
    years = sorted({p["time"][:4] for s in out_series for p in s["data"]})
    stations = sorted({s["station"] for s in out_series})
    out = {
        "metadata": {
            "data_type": "all_time_averaged_monthly_data",
            "years": [int(y) for y in years],
            "stations": {code: {"location": STATION_LOCATIONS.get(code, "")} for code in stations},
        },
        "series": out_series,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT} ({len(out_series)} series, years {years})")


if __name__ == "__main__":
    main()
