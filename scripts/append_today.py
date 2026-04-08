"""Fetch today's S&P 500 bar and append it to public/data/sp500.json."""
import json
import sys
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

OUT_PATH = Path(__file__).parent.parent / "public" / "data" / "sp500.json"


def fetch_today() -> dict | None:
    """Return the most recent OHLCV bar dict, or None if no data available."""
    df = yf.download("^GSPC", period="5d", auto_adjust=True, progress=False)
    if df.empty:
        return None
    df = df.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0].lower() for c in df.columns]
    else:
        df.columns = [c.lower() for c in df.columns]
    df["date"] = pd.to_datetime(df["date"]).dt.date
    latest = df.iloc[-1]
    return {
        "date": str(latest["date"]),
        "open": round(float(latest["open"]), 2),
        "high": round(float(latest["high"]), 2),
        "low": round(float(latest["low"]), 2),
        "close": round(float(latest["close"]), 2),
        "volume": int(latest["volume"]) if pd.notna(latest["volume"]) else 0,
    }


def main() -> None:
    with open(OUT_PATH) as f:
        data = json.load(f)

    bar = fetch_today()
    if bar is None:
        print("No data returned (market closed or rate limited). Exiting.")
        sys.exit(0)

    print(f"Fetched bar: {bar}")

    current_year = date.today().year
    year_entry = next((y for y in data["years"] if y["year"] == current_year), None)

    if year_entry is None:
        # New year — bootstrap from last year's final close
        prev_entry = next((y for y in data["years"] if y["year"] == current_year - 1), None)
        if prev_entry is None:
            print("ERROR: no previous year entry found", file=sys.stderr)
            sys.exit(1)
        year_entry = {
            "year": current_year,
            "yearOpen": prev_entry["yearClose"],
            "yearClose": None,
            "pctChange": None,
            "bars": [],
        }
        data["years"].append(year_entry)

    # Idempotent: skip if date already present
    existing_dates = {b["date"] for b in year_entry["bars"]}
    if bar["date"] in existing_dates:
        print(f"Bar for {bar['date']} already present. Nothing to do.")
        sys.exit(0)

    year_entry["bars"].append(bar)
    year_entry["bars"].sort(key=lambda b: b["date"])

    data["lastUpdated"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(OUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Appended {bar['date']} to {OUT_PATH}")


if __name__ == "__main__":
    main()
