"""Count NewsAPI articles mentioning each tracked keyword today and append the
count to data/timeseries.json as a secondary trend signal.
"""
import os
import sys
from datetime import datetime, timezone

import requests

from lib import load_keywords, load_timeseries, save_timeseries, upsert_daily_point

NEWSAPI_URL = "https://newsapi.org/v2/everything"


def fetch_count(api_key, keyword, date_str):
    # NewsAPI doesn't support Thai as a `language` filter, so we search without
    # one and rely on the keyword itself (often Thai or a brand name) to scope results.
    params = {
        "q": keyword,
        "from": date_str,
        "to": date_str,
        "pageSize": 1,
        "apiKey": api_key,
    }
    resp = requests.get(NEWSAPI_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json().get("totalResults", 0)


def main():
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        print("[collect_news] NEWSAPI_KEY not set, skipping", file=sys.stderr)
        return

    keywords = load_keywords()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = load_timeseries()

    updated = 0
    for kw in keywords:
        try:
            count = fetch_count(api_key, kw, today)
            upsert_daily_point(data, kw, today, news_count=count)
            updated += 1
        except requests.RequestException as exc:
            print(f"[collect_news] failed for '{kw}': {exc}", file=sys.stderr)

    save_timeseries(data)
    print(f"[collect_news] updated {updated}/{len(keywords)} keywords for {today}")


if __name__ == "__main__":
    main()
