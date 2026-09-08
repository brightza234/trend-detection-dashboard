"""Fetch today's Google Trends interest-over-time score for each tracked keyword
and append it to data/timeseries.json.

pytrends is an unofficial scraper and gets rate-limited occasionally -- a failed
batch is logged and skipped rather than aborting the whole run, so other keywords
still get collected.
"""
import sys
import time
from datetime import datetime, timezone

from pytrends.request import TrendReq

from lib import load_keywords, load_timeseries, save_timeseries, upsert_daily_point

BATCH_SIZE = 5  # pytrends caps build_payload at 5 keywords per request
REQUEST_DELAY_SECONDS = 2


def fetch_batch(pytrends, batch):
    pytrends.build_payload(batch, timeframe="now 7-d", geo="TH")
    df = pytrends.interest_over_time()
    if df.empty:
        return {}
    latest = df.iloc[-1]
    return {kw: int(latest[kw]) for kw in batch if kw in latest}


def main():
    keywords = load_keywords()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = load_timeseries()
    pytrends = TrendReq(hl="th-TH", tz=420)

    scores = {}
    for i in range(0, len(keywords), BATCH_SIZE):
        batch = keywords[i : i + BATCH_SIZE]
        try:
            scores.update(fetch_batch(pytrends, batch))
        except Exception as exc:  # pytrends raises assorted errors on rate limit/blocking
            print(f"[collect_trends] failed batch {batch}: {exc}", file=sys.stderr)
        time.sleep(REQUEST_DELAY_SECONDS)

    for kw in keywords:
        if kw in scores:
            upsert_daily_point(data, kw, today, trends_score=scores[kw])
        else:
            print(f"[collect_trends] no trends score for '{kw}' today", file=sys.stderr)

    save_timeseries(data)
    print(f"[collect_trends] updated {len(scores)}/{len(keywords)} keywords for {today}")


if __name__ == "__main__":
    main()
