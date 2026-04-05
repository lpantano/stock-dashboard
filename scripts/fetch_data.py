"""Fetch S&P 500 daily data via yfinance and write public/data/sp500.json."""
import json
import sys
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

TICKER = "^GSPC"
START_YEAR = 2021
OUT_PATH = Path(__file__).parent.parent / "public" / "data" / "sp500.json"


def fetch_csv() -> pd.DataFrame:
    # Fetch from Dec 2020 so we have the yearOpen for 2021
    df = yf.download(TICKER, start=f"{START_YEAR - 1}-12-01", auto_adjust=True, progress=False)
    if df.empty:
        raise RuntimeError("yfinance returned no data")
    df = df.reset_index()
    # Flatten MultiIndex columns (yfinance returns (field, ticker) MultiIndex)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0].lower() for c in df.columns]
    else:
        df.columns = [c.lower() for c in df.columns]
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


def build_year_data(df: pd.DataFrame, year: int, prev_year_close: float) -> dict:
    mask = df["date"].dt.year == year
    year_df = df[mask].copy()

    bars = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "open": round(float(row["open"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "close": round(float(row["close"]), 2),
            "volume": int(row["volume"]) if pd.notna(row["volume"]) else 0,
        }
        for _, row in year_df.iterrows()
    ]

    current_year = date.today().year
    is_complete = year < current_year

    if is_complete and len(bars) > 0:
        year_close = bars[-1]["close"]
        pct_change = round((year_close - prev_year_close) / prev_year_close * 100, 2)
    else:
        year_close = None
        pct_change = None

    return {
        "year": year,
        "yearOpen": round(prev_year_close, 2),
        "yearClose": year_close,
        "pctChange": pct_change,
        "bars": bars,
    }


def main() -> None:
    print("Fetching S&P 500 data from stooq.com...")
    try:
        df = fetch_csv()
    except Exception as e:
        print(f"ERROR: fetch failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"  Fetched {len(df)} rows from {df['date'].min().date()} to {df['date'].max().date()}")

    # Need Dec close of 2020 as yearOpen for 2021
    first_needed = date(START_YEAR - 1, 12, 1)
    df = df[df["date"].dt.date >= first_needed].copy()

    years_data = []
    current_year = date.today().year

    for year in range(START_YEAR, current_year + 1):
        # prev year close = last close in year-1
        prev_mask = df["date"].dt.year == (year - 1)
        prev_df = df[prev_mask]
        if prev_df.empty:
            print(f"ERROR: no data for {year - 1} to use as yearOpen for {year}", file=sys.stderr)
            sys.exit(1)
        prev_close = float(prev_df.iloc[-1]["close"])
        year_data = build_year_data(df, year, prev_close)
        years_data.append(year_data)
        print(f"  {year}: {len(year_data['bars'])} bars, open={year_data['yearOpen']}, "
              f"close={year_data['yearClose']}, pct={year_data['pctChange']}")

    payload = {
        "lastUpdated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "years": years_data,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Written to {OUT_PATH}")


if __name__ == "__main__":
    main()
