"""Shared helpers for reading/writing the tracked-keyword timeseries store."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"


def load_keywords():
    with open(CONFIG_DIR / "keywords.json", encoding="utf-8") as f:
        return json.load(f)["keywords"]


def load_timeseries():
    with open(DATA_DIR / "timeseries.json", encoding="utf-8") as f:
        return json.load(f)


def save_timeseries(data):
    with open(DATA_DIR / "timeseries.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def upsert_daily_point(series_data, keyword, date_str, **fields):
    """Insert or merge a data point for `keyword` on `date_str`, keeping the series sorted by date."""
    series = series_data.setdefault("series", {}).setdefault(keyword, [])
    for point in series:
        if point["date"] == date_str:
            point.update(fields)
            return
    series.append({"date": date_str, **fields})
    series.sort(key=lambda p: p["date"])
