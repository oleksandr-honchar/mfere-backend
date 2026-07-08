# MFERE Backend

Full-stack demo backend built on real MFERE (Multi-Factor Equity Research Engine) data.

## Stack
- Next.js 15 (App Router) + TypeScript
- Drizzle ORM + Supabase (Postgres)
- Data: 5 tables synced from a local medallion-architecture warehouse (dim_company, fact_prices, fact_fundamentals, fact_macro, factors — 47 equity factors across momentum, value, quality, growth, macro categories)

## API
- `GET /api/companies?limit=&offset=` — paginated company list
- `GET /api/companies/[ticker]/factors` — latest factor history for a ticker