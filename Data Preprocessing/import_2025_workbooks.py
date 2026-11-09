"""
Convert the 2025 LLDA quarterly Excel workbooks into the formats Project LAWA uses.

Inputs  : the four workbooks (Q1 = "Laguna_Lake_Water_Quality.xlsx", Q2, Q3, Q4 2025)
Outputs : 1. Backend/data.csv (+ Data Preprocessing/data.csv)  -> 2025 rows appended
             (same schema as the 2016-2023 rows; consumed by `manage.py upload_csv --csv`)
          2. Backend/data_2025_full.csv -> same rows plus Chloride and TSS
             (parameters the app does not model yet)
          3. Frontend/build/data/historical.json -> 2025 points appended to every series
             (the static "All Time" view)

Usage:  python3 import_2025_workbooks.py <dir with the 4 xlsx> [--repo <repo root>]
Re-running is safe: existing 2025 rows/points are removed before appending.
"""
import argparse, calendar, csv, glob, json, os, re
import openpyxl

# ---- station naming: workbook code -> name used in data.csv ----------------------------
STATIONS = {
    "I": "Stn. I (Central West Bay)", "II": "Stn. II (East Bay)",
    "IV": "Stn. IV (Central Bay)", "V": "Stn. V (Northern West Bay)",
    "VIII": "Stn. VIII (South Bay)", "XIII": "Stn. XIII (Taytay)",
    "XV": "Stn. XV (San Pedro)", "XVI": "Stn. XVI (Sta. Rosa)",
    "XVII": "Stn. XVII (Sanctuary)", "XVIII": "Stn. XVIII (Pagsanjan)",
    "XIX": "Stn. XIX (Muntinlupa)", "XX": "Stn. XX (GEMS)",
    "XXI": "Stn. XXI (Cardona)", "XXII": "Stn. XXII (Jala-jala)",
    "XXIII": "Stn. XXIII (Lumban)",
    "XXIV": "Stn. XXIV (Cardona North Central Bay)",   # NEW station in 2025 workbooks
}

# Workbook parameter order inside Q2/Q3/Q4 (3 monthly columns each, starting at column C)
BLOCKS = ["BOD", "DO", "FC", "Chloride", "pH", "Ammonia", "Nitrate", "Phosphate", "TSS"]
# Q1 workbook only has the first four
Q1_BLOCKS = BLOCKS[:4]

# data.csv column for each parameter, number of decimals to write
APP_COLS = {
    "BOD": ("BOD (mg/L)", 2), "DO": ("Dissolved Oxygen (mg/L)", 2),
    "FC": ("Fecal Coliform, MPN/100ml (Geomean)", 2), "pH": ("pH (units)", 2),
    "Ammonia": ("Ammonia (mg/L)", 3), "Nitrate": ("Nitrate (mg/L)", 3),
    "Phosphate": ("Inorganic Phospate (mg/L)", 3),
}
EXTRA_COLS = {"Chloride": ("Chloride (mg/L)", 1), "TSS": ("TSS (mg/L)", 1)}
# historical.json parameter names
JSON_NAMES = {"BOD": "BOD", "DO": "Dissolved Oxygen", "FC": "Fecal Coliform", "pH": "pH",
              "Ammonia": "Ammonia", "Nitrate": "Nitrate", "Phosphate": "Inorganic Phosphate"}

MONTHS = [calendar.month_abbr[m] for m in range(1, 13)]


def clean(v):
    """'<0.1' -> half the detection limit (the convention already used in data.csv:
    <1 -> 0.5, <0.01 -> 0.005, <0.1 -> 0.05). '*', blanks -> None (no data)."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if s in ("", "*", "-", "N/A", "NA"):
        return None
    m = re.fullmatch(r"<\s*([0-9.]+)", s)
    if m:
        return float(m.group(1)) / 2
    return float(s)


def read_workbook(path, first_row, blocks, first_month_idx):
    """Return {(code, month_idx0): {param: value}}."""
    ws = openpyxl.load_workbook(path, data_only=True).active
    out = {}
    for r in range(first_row, ws.max_row + 1):
        code = ws.cell(r, 1).value
        if code is None or str(code).strip() not in STATIONS:
            continue
        code = str(code).strip()
        for b, param in enumerate(blocks):
            for k in range(3):
                val = clean(ws.cell(r, 3 + b * 3 + k).value)
                out.setdefault((code, first_month_idx + k), {})[param] = val
    return out


def find(d, suffix):
    hits = glob.glob(os.path.join(d, f"*{suffix}"))
    if len(hits) != 1:
        raise SystemExit(f"expected exactly one *{suffix} in {d}, found {hits}")
    return hits[0]


def fmt(v, dec):
    return "" if v is None else f"{v:.{dec}f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--repo", default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    a = ap.parse_args()

    data = {}
    data.update(read_workbook(find(a.src, "Laguna_Lake_Water_Quality.xlsx"), 5, Q1_BLOCKS, 0))  # Jan-Mar
    data.update(read_workbook(find(a.src, "Q2_2025.xlsx"), 4, BLOCKS, 3))                        # Apr-Jun
    data.update(read_workbook(find(a.src, "Q3_2025.xlsx"), 2, BLOCKS, 6))                        # Jul-Sep
    data.update(read_workbook(find(a.src, "Q4_2025.xlsx"), 2, BLOCKS, 9))                        # Oct-Dec

    order = list(STATIONS)
    rows = []  # (month_idx, code, {param: value})
    for mi in range(12):
        for code in order:
            if (code, mi) in data:
                rows.append((mi, code, data[(code, mi)]))

    # ---- 1. data.csv --------------------------------------------------------------
    app_header = ["Month", "Stations"] + [c for c, _ in APP_COLS.values()]
    app_lines = []
    for mi, code, vals in rows:
        app_lines.append([f"{MONTHS[mi]}-25", STATIONS[code]] +
                         [fmt(vals.get(p), d) for p, (_, d) in APP_COLS.items()])
    for path in (os.path.join(a.repo, "Backend", "data.csv"),
                 os.path.join(a.repo, "Data Preprocessing", "data.csv")):
        with open(path, newline="") as f:
            existing = list(csv.reader(f))
        kept = [r for r in existing if not (r and r[0].endswith("-25"))]
        with open(path, "w", newline="") as f:
            csv.writer(f, lineterminator="\n").writerows(kept + app_lines)
        print(f"{path}: {len(kept)-1} old rows + {len(app_lines)} 2025 rows")

    # ---- 2. full csv incl. Chloride and TSS ------------------------------------------
    allcols = {**APP_COLS, **EXTRA_COLS}
    with open(os.path.join(a.repo, "Backend", "data_2025_full.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Month", "Stations"] + [c for c, _ in allcols.values()])
        for mi, code, vals in rows:
            w.writerow([f"{MONTHS[mi]}-25", STATIONS[code]] + [fmt(vals.get(p), d) for p, (_, d) in allcols.items()])

    # ---- 3. historical.json -----------------------------------------------------------
    jp = os.path.join(a.repo, "Frontend", "build", "data", "historical.json")
    with open(jp, encoding="utf-8-sig") as f:
        hist = json.load(f)
    series = {(s["station"], s["parameter"]): s for s in hist["series"]}
    for s in hist["series"]:
        s["data"] = [p for p in s["data"] if not p["time"].startswith("2025-")]
    added = 0
    for mi, code, vals in rows:
        last = calendar.monthrange(2025, mi + 1)[1]
        t = f"2025-{mi+1:02d}-{last:02d}"
        for p, jname in JSON_NAMES.items():
            v = vals.get(p)
            if v is None:
                continue
            key = (code, jname)
            if key not in series:  # new station (XXIV)
                series[key] = {"station": code, "data": [], "parameter": jname}
                hist["series"].append(series[key])
            series[key]["data"].append({"time": t, "value": round(v, 4)})
            added += 1
    with open(jp, "w", encoding="utf-8-sig") as f:
        json.dump(hist, f, separators=(",", ":"))
    print(f"{jp}: +{added} points, {len(hist['series'])} series")


if __name__ == "__main__":
    main()
