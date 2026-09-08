"""For every keyword detect_anomalies.py classified as a Spike, ask Claude for a
short, honest explanation of the likely cause and store it back into
data/trend_status.json under `ai_explanation`.
"""
import json
import os
import sys

import anthropic

from lib import DATA_DIR

MODEL = "claude-sonnet-5"


def build_prompt(keyword, analysis):
    return (
        f"The Thai-market search keyword '{keyword}' just spiked in Google Trends interest "
        f"(z-score {analysis.get('z_score')}, latest value {analysis.get('latest_value')} vs "
        f"a {analysis.get('rolling_mean')} rolling average). "
        "In 2-3 sentences, give your best explanation for why this spike is happening -- "
        "e.g. a product launch, event, or news story. If you aren't confident, say so "
        "explicitly instead of guessing."
    )


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[explain_trend] ANTHROPIC_API_KEY not set, skipping", file=sys.stderr)
        return

    status_path = DATA_DIR / "trend_status.json"
    with open(status_path, encoding="utf-8") as f:
        status = json.load(f)

    client = anthropic.Anthropic(api_key=api_key)
    spikes = {kw: a for kw, a in status["keywords"].items() if a.get("status") == "Spike"}

    for kw, analysis in spikes.items():
        try:
            message = client.messages.create(
                model=MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": build_prompt(kw, analysis)}],
            )
            analysis["ai_explanation"] = message.content[0].text
        except Exception as exc:
            print(f"[explain_trend] failed for '{kw}': {exc}", file=sys.stderr)

    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)

    print(f"[explain_trend] explained {len(spikes)} spike(s)")


if __name__ == "__main__":
    main()
