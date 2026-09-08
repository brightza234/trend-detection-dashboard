"""Classify each tracked keyword as Rising / Stable / Declining / Spike using a
rolling z-score (primary signal, easy to explain) plus a short-window slope
(direction). Writes data/trend_status.json.

EWMA control charts and STL decomposition are documented as stretch goals in
PROJECT_PLAN_TREND_DETECTION.md but intentionally not implemented here -- the
z-score approach is what the plan calls the starting point, and there isn't
enough accumulated history yet for STL's seasonal decomposition to be meaningful.
"""
import json
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from lib import DATA_DIR, load_keywords, load_timeseries

ROLLING_WINDOW = 14
SLOPE_WINDOW = 7
Z_SPIKE_THRESHOLD = 2.0
SLOPE_FLAT_THRESHOLD = 0.5


def classify(z_score, slope):
    if z_score is not None and z_score > Z_SPIKE_THRESHOLD:
        return "Spike"
    if slope is not None and slope > SLOPE_FLAT_THRESHOLD:
        return "Rising"
    if slope is not None and slope < -SLOPE_FLAT_THRESHOLD:
        return "Declining"
    return "Stable"


def analyze_series(points):
    df = pd.DataFrame(points)
    if df.empty or "trends_score" not in df:
        return None
    df = df.dropna(subset=["trends_score"])
    if df.empty:
        return None

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    window = df["trends_score"].tail(ROLLING_WINDOW)
    rolling_mean = window.mean()
    rolling_std = window.std(ddof=0)
    latest_value = float(df["trends_score"].iloc[-1])

    z_score = None
    if len(df) >= 3 and rolling_std and not np.isnan(rolling_std):
        z_score = round(float((latest_value - rolling_mean) / rolling_std), 2)

    slope = None
    recent = df.tail(SLOPE_WINDOW)
    if len(recent) >= 3:
        x = np.arange(len(recent))
        slope = round(float(np.polyfit(x, recent["trends_score"], 1)[0]), 2)

    return {
        "status": classify(z_score, slope),
        "latest_value": latest_value,
        "rolling_mean": None if pd.isna(rolling_mean) else round(float(rolling_mean), 2),
        "rolling_std": None if pd.isna(rolling_std) else round(float(rolling_std), 2),
        "z_score": z_score,
        "slope_7d": slope,
        "data_points": int(len(df)),
    }


def main():
    keywords = load_keywords()
    data = load_timeseries()

    results = {}
    for kw in keywords:
        points = data.get("series", {}).get(kw, [])
        analysis = analyze_series(points)
        results[kw] = analysis if analysis is not None else {"status": "No data", "data_points": 0}

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "keywords": results,
    }

    with open(DATA_DIR / "trend_status.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    spikes = [kw for kw, r in results.items() if r.get("status") == "Spike"]
    print(f"[detect_anomalies] classified {len(results)} keywords, {len(spikes)} spike(s): {spikes}")


if __name__ == "__main__":
    main()
