# Trend Detection Dashboard

Detects which Thai tech/gadget keywords are genuinely *trending* (not just holding a
steady high level) using rolling z-score anomaly detection on Google Trends interest,
with a Claude-generated explanation for each detected spike.

Tracks the same niche as the [KOL Influence & Engagement Scoring Model](https://github.com/brightza234/kol-influence-scoring-model)
project (Thai tech/gadget YouTubers) for portfolio continuity, but focuses on
**automation**: a GitHub Actions workflow collects one data point per keyword per day,
with no manual step required.

## How it works

1. **Collection** (`scripts/collect_trends.py`, `scripts/collect_news.py`) — every day,
   GitHub Actions pulls each keyword's Google Trends interest score (via `pytrends`) and
   NewsAPI article count, and appends them to [`data/timeseries.json`](data/timeseries.json).
2. **Anomaly detection** (`scripts/detect_anomalies.py`) — for each keyword, computes a
   14-day rolling mean/std and a z-score for today's value:

   ```
   z = (value_today - rolling_mean) / rolling_std
   ```

   `z > 2` is flagged as a **Spike**. Combined with a 7-day linear slope, each keyword is
   labeled **Rising / Stable / Declining / Spike** in [`data/trend_status.json`](data/trend_status.json).
3. **AI explanation** (`scripts/explain_trend.py`) — for any keyword flagged as a Spike,
   asks Claude for a short, honest explanation of the likely cause.
4. **Dashboard** (Next.js, this app) — reads the two JSON files directly from the repo and
   renders a leaderboard plus a per-keyword trend chart with anomaly points highlighted.

## Why z-score first

A z-score threshold is simple and easy to explain to a non-technical reader, which
matters for a portfolio piece. An EWMA control chart (catches gradual ramps, less
sensitive to single-day noise) and STL decomposition (splits trend/seasonal/residual
before flagging anomalies) are documented as follow-ups in
[`../PROJECT_PLAN_TREND_DETECTION.md`](../PROJECT_PLAN_TREND_DETECTION.md) but not
implemented yet — STL in particular needs more accumulated history than a few weeks of
daily collection can provide before its seasonal component is meaningful.

## Limitations

- **Short history.** Data only starts accumulating once the GitHub Actions workflow is
  live, so early on there isn't enough history for the rolling stats to be reliable —
  the dashboard shows "Insufficient data" / "No data" until each keyword has enough points.
- **Google Trends is a relative index (0-100)**, not absolute search volume — comparing
  raw scores across keywords is not apples-to-apples, only each keyword's own trend over
  time is meaningful.
- **`pytrends` is an unofficial scraper**, not an official Google API, and can get
  rate-limited. Collection failures are logged and skipped rather than aborting the run;
  a manual CSV export from trends.google.com is the fallback for a live demo if needed.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running the data pipeline locally

```bash
pip install -r requirements.txt
cp .env.example .env
# fill in NEWSAPI_KEY and ANTHROPIC_API_KEY in .env, then:
python scripts/collect_trends.py
python scripts/collect_news.py
python scripts/detect_anomalies.py
python scripts/explain_trend.py
```

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `NEWSAPI_KEY` | `collect_news.py` | Free tier at newsapi.org |
| `ANTHROPIC_API_KEY` | `explain_trend.py` | Only called for keywords flagged as Spike |

`pytrends` needs no API key. Set both as **GitHub Actions repo secrets** so the daily
workflow ([`.github/workflows/collect.yml`](.github/workflows/collect.yml)) can use them,
and as Vercel project env vars if you want the dashboard build itself to reference them
(it currently doesn't — it only reads the committed JSON files).

## Tracked keywords

See [`config/keywords.json`](config/keywords.json) — 15 Thai tech/gadget product and
category terms chosen to overlap with the KOL scoring project's niche.
