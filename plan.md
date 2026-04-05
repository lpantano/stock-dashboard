Good plan. Here's the architecture I'll use:

**Stack:**
- **Vite + React + TypeScript** — modern, fast, Netlify-compatible
- **Recharts** — composable charts, free Y-axis per chart
- **Data source:** [stooq.com](https://stooq.com) CSV (free, no API key needed) for S&P 500, NASDAQ, DJIA
- **GitHub Actions** — weekly `cron` job fetches fresh data, commits JSON to repo
- **Netlify** — auto-deploys on push

Let me build the full project structure:Now let me zip it all up:The project is complete. Here's the full structure and what to do next:

---

**Project structure:**
```
us-stock-dashboard/
├── .github/workflows/refresh-data.yml   ← weekly cron
├── scripts/fetchData.mjs                ← data fetcher (stooq.com)
├── src/
│   ├── data/                            ← indices.json lives here
│   ├── components/{YearChart,IndexPanel}.tsx
│   ├── hooks/useStockData.ts
│   ├── App.tsx · main.tsx · index.css · types.ts
├── netlify.toml
└── README.md
```

**To launch:**

```bash
# 1. Unzip, init git
git init && git add . && git commit -m "init"
gh repo create us-stock-dashboard --public --push

# 2. Fetch initial data (run locally)
npm install && npm run fetch-data
git add src/data/indices.json && git commit -m "add initial data" && git push

# 3. Netlify → New site from Git → pick repo → auto-detected config → Deploy

# 4. (Optional) Add Netlify build hook as GitHub secret NETLIFY_BUILD_HOOK
#    → add one line to the workflow to trigger rebuild after data commit
```

**Design choices:** dark editorial theme (Syne + DM Mono), grid of year cards per index, free Y-axis per year so small years aren't crushed by 2020 volatility, reference line at year open, tooltip with daily OHLC + % change.