## Крок 1: ініціалізація репозиторію

```bash
npx create-next-app@latest mfere-backend \
  --typescript \
  --app \
  --tailwind \
  --eslint \
  --src-dir \
  --import-alias "@/*"

cd mfere-backend
```

Що обрано і чому:

--app — App Router, бо вакансія прямо каже Next.js API Routes в app/api;

--typescript — обов'язкова вимога;

--tailwind — з "must-have" (Tailwind + shadcn/ui);

--src-dir — тримає код окремо від конфігів, зручніше під app/api + майбутній Drizzle db/ каталог.

Перевірка, що сервер піднявся:
```bash
npm run dev
```

## Крок 2а: створення таблиць у Supabase (схема demo)

Спрощена версія без FK/індексів (для demo-бекенду референційна цілісність не критична, а порядок імпорту це знімає повністю):
```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE demo.dim_company (
  company_id integer NOT NULL,
  cik character varying,
  ticker character varying,
  company_name text,
  exchange character varying,
  gics_sector character varying,
  gics_industry character varying,
  CONSTRAINT dim_company_pkey PRIMARY KEY (company_id)
);
CREATE TABLE demo.fact_prices (
  price_id bigint,
  company_id integer,
  trade_date date,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  adj_close numeric,
  volume numeric
);
CREATE TABLE demo.fact_fundamentals (
  company_id integer,
  concept text,
  period_end date,
  filing_date date,
  value numeric,
  unit text,
  source_tag text,
  policy text,
  form text
);
CREATE TABLE demo.fact_macro (
  series_id character varying,
  date date,
  value numeric
);
CREATE TABLE demo.factors (
  company_id bigint,
  date timestamp without time zone,
  mom_1m double precision,
  mom_3m double precision,
  mom_6m double precision,
  mom_12m double precision,
  mom_skip1m double precision,
  mom_acc double precision,
  rev_1w double precision,
  vol_3m double precision,
  vol_12m double precision,
  down_vol double precision,
  beta double precision,
  idio_vol double precision,
  max_drawdown double precision,
  earnings_yield double precision,
  book_to_price double precision,
  sales_to_price double precision,
  cf_to_price double precision,
  fcf_yield double precision,
  ev_ebitda double precision,
  ebitda_yield double precision,
  roe double precision,
  roa double precision,
  gross_margin double precision,
  op_margin double precision,
  profit_stability double precision,
  debt_to_equity double precision,
  int_coverage double precision,
  rev_growth double precision,
  eps_growth double precision,
  asset_growth double precision,
  capex_growth double precision,
  opinc_growth double precision,
  sales_acc double precision,
  capex_ratio double precision,
  inventory_growth double precision,
  accruals double precision,
  turnover double precision,
  dollar_vol double precision,
  illiq double precision,
  vol_vol double precision,
  term_spread double precision,
  credit_spread double precision,
  cpi_growth double precision,
  unrate double precision,
  nfci double precision,
  gdp_growth double precision,
  target_return_60d double precision
);
```

## Крок 2б: перенесення даних (pipe, без файлів)

```bash
export SUPABASE_PW="supabase_password"
export LOCAL="postgresql://mfere_admin:password_123@host.docker.internal:5432/mfere_prod"
export SUPA="postgresql://postgres.ieoysjtuwoukrmfopaoh:${SUPABASE_PW}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```

```bash
# dim_company — довідник, повністю
docker run --rm -i \
  -e LOCAL="$LOCAL" \
  -e SUPA="$SUPA" \
  postgres:16 bash -c '
    psql "$LOCAL" -c "\copy (SELECT company_id, cik, ticker, company_name, exchange, gics_sector, gics_industry FROM dw.dim_company) TO STDOUT WITH CSV HEADER" \
      | psql "$SUPA" -c "\copy demo.dim_company FROM STDIN WITH CSV HEADER"
  '
```

```bash
# fact_prices
docker run --rm -i -e LOCAL="$LOCAL" -e SUPA="$SUPA" \
  --add-host=host.docker.internal:host-gateway \
  postgres:16 bash -c '
    psql "$LOCAL" -c "\copy (SELECT price_id, company_id, trade_date, open, high, low, close, adj_close, volume FROM dw.fact_prices WHERE trade_date >= '"'"'2025-01-01'"'"') TO STDOUT WITH CSV HEADER" \
      | psql "$SUPA" -c "\copy demo.fact_prices FROM STDIN WITH CSV HEADER"
  '
```
```bash
# fact_fundamentals
docker run --rm -i -e LOCAL="$LOCAL" -e SUPA="$SUPA" \
  --add-host=host.docker.internal:host-gateway \
  postgres:16 bash -c '
    psql "$LOCAL" -c "\copy (SELECT company_id, concept, period_end, filing_date, value, unit, source_tag, policy, form FROM dw.fact_fundamentals WHERE filing_date >= '"'"'2025-01-01'"'"') TO STDOUT WITH CSV HEADER" \
      | psql "$SUPA" -c "\copy demo.fact_fundamentals FROM STDIN WITH CSV HEADER"
  '
```
```bash
# fact_macro
docker run --rm -i -e LOCAL="$LOCAL" -e SUPA="$SUPA" \
  --add-host=host.docker.internal:host-gateway \
  postgres:16 bash -c '
    psql "$LOCAL" -c "\copy (SELECT series_id, date, value FROM dw.fact_macro WHERE date >= '"'"'2025-01-01'"'"') TO STDOUT WITH CSV HEADER" \
      | psql "$SUPA" -c "\copy demo.fact_macro FROM STDIN WITH CSV HEADER"
  '
```
```bash
docker run --rm -i -e LOCAL="$LOCAL" -e SUPA="$SUPA" \
  --add-host=host.docker.internal:host-gateway \
  postgres:16 bash -c '
    psql "$LOCAL" -c "\copy (SELECT * FROM analytics.factor_dataset WHERE \"date\" >= '"'"'2025-01-01'"'"') TO STDOUT WITH CSV HEADER" \
      | psql "$SUPA" -c "\copy demo.factors FROM STDIN WITH CSV HEADER"
  '
```

## Крок 3: Drizzle schema + підключення до Supabase

Встановлення залежностей:
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```
.env.local (не комітити, додай у .gitignore якщо ще нема):
```
DATABASE_URL="postgresql://postgres.ieoysjtuwoukrmfopaoh:${SUPABASE_PW}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```
src/db/schema.ts — під реальні 5 таблиць, схема demo:
```typescript
import {
  pgSchema,
  bigint,
  integer,
  varchar,
  text,
  date,
  timestamp,
  doublePrecision,
  numeric,
} from "drizzle-orm/pg-core";

// Усі таблиці живуть у Supabase-схемі "demo", а не в "public"
export const demoSchema = pgSchema("demo");

export const dimCompany = demoSchema.table("dim_company", {
  companyId: integer("company_id").primaryKey(),
  cik: varchar("cik", { length: 20 }),
  ticker: varchar("ticker", { length: 20 }),
  companyName: text("company_name"),
  exchange: varchar("exchange", { length: 20 }),
  gicsSector: varchar("gics_sector", { length: 80 }),
  gicsIndustry: varchar("gics_industry", { length: 120 }),
});

export const factPrices = demoSchema.table("fact_prices", {
  priceId: bigint("price_id", { mode: "number" }),
  companyId: integer("company_id"),
  tradeDate: date("trade_date"),
  open: numeric("open", { precision: 18, scale: 6 }),
  high: numeric("high", { precision: 18, scale: 6 }),
  low: numeric("low", { precision: 18, scale: 6 }),
  close: numeric("close", { precision: 18, scale: 6 }),
  adjClose: numeric("adj_close", { precision: 18, scale: 6 }),
  volume: numeric("volume", { precision: 20, scale: 0 }),
});

export const factFundamentals = demoSchema.table("fact_fundamentals", {
  companyId: integer("company_id"),
  concept: text("concept"),
  periodEnd: date("period_end"),
  filingDate: date("filing_date"),
  value: numeric("value"),
  unit: text("unit"),
  sourceTag: text("source_tag"),
  policy: text("policy"),
  form: text("form"),
});

export const factMacro = demoSchema.table("fact_macro", {
  seriesId: varchar("series_id", { length: 30 }),
  date: date("date"),
  value: numeric("value", { precision: 20, scale: 8 }),
});

// 47 факторів — double precision, як у джерелі (analytics.factor_dataset)
export const factors = demoSchema.table("factors", {
  companyId: bigint("company_id", { mode: "number" }),
  date: timestamp("date"),
  mom1m: doublePrecision("mom_1m"),
  mom3m: doublePrecision("mom_3m"),
  mom6m: doublePrecision("mom_6m"),
  mom12m: doublePrecision("mom_12m"),
  momSkip1m: doublePrecision("mom_skip1m"),
  momAcc: doublePrecision("mom_acc"),
  rev1w: doublePrecision("rev_1w"),
  vol3m: doublePrecision("vol_3m"),
  vol12m: doublePrecision("vol_12m"),
  downVol: doublePrecision("down_vol"),
  beta: doublePrecision("beta"),
  idioVol: doublePrecision("idio_vol"),
  maxDrawdown: doublePrecision("max_drawdown"),
  earningsYield: doublePrecision("earnings_yield"),
  bookToPrice: doublePrecision("book_to_price"),
  salesToPrice: doublePrecision("sales_to_price"),
  cfToPrice: doublePrecision("cf_to_price"),
  fcfYield: doublePrecision("fcf_yield"),
  evEbitda: doublePrecision("ev_ebitda"),
  ebitdaYield: doublePrecision("ebitda_yield"),
  roe: doublePrecision("roe"),
  roa: doublePrecision("roa"),
  grossMargin: doublePrecision("gross_margin"),
  opMargin: doublePrecision("op_margin"),
  profitStability: doublePrecision("profit_stability"),
  debtToEquity: doublePrecision("debt_to_equity"),
  intCoverage: doublePrecision("int_coverage"),
  revGrowth: doublePrecision("rev_growth"),
  epsGrowth: doublePrecision("eps_growth"),
  assetGrowth: doublePrecision("asset_growth"),
  capexGrowth: doublePrecision("capex_growth"),
  opincGrowth: doublePrecision("opinc_growth"),
  salesAcc: doublePrecision("sales_acc"),
  capexRatio: doublePrecision("capex_ratio"),
  inventoryGrowth: doublePrecision("inventory_growth"),
  accruals: doublePrecision("accruals"),
  turnover: doublePrecision("turnover"),
  dollarVol: doublePrecision("dollar_vol"),
  illiq: doublePrecision("illiq"),
  volVol: doublePrecision("vol_vol"),
  termSpread: doublePrecision("term_spread"),
  creditSpread: doublePrecision("credit_spread"),
  cpiGrowth: doublePrecision("cpi_growth"),
  unrate: doublePrecision("unrate"),
  nfci: doublePrecision("nfci"),
  gdpGrowth: doublePrecision("gdp_growth"),
  targetReturn60d: doublePrecision("target_return_60d"),
});
```
src/db/index.ts — клієнт з'єднання (Supabase вимагає TLS):
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare: false — обов'язково для transaction/session pooler режимів Supabase,
// інакше можуть падати prepared statements
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
```
Тестовий route — src/app/api/health/route.ts, щоб перевірити з'єднання без бізнес-логіки:
```typescript
import { db } from "@/db";
import { factors } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(factors);

    return NextResponse.json({
      status: "ok",
      factors_row_count: result[0].count,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}
```
Запуск і перевірка:
```bash
npm run dev
curl http://localhost:3000/api/health
```
Очікуваний результат — {"status":"ok","factors_row_count":75576}.


## Крок 4: реальні API routes
Замінюємо health-check на робочі ендпойнти. Два для початку:
src/app/api/companies/route.ts — список компаній з пагінацією:
```typescript
import { db } from "@/db";
import { dimCompany } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  const companies = await db
    .select()
    .from(dimCompany)
    .orderBy(asc(dimCompany.ticker))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: companies, limit, offset });
}
```
src/app/api/companies/[ticker]/factors/route.ts — фактори конкретної компанії за датою (найсвіжіші зверху):
```typescript
import { db } from "@/db";
import { dimCompany, factors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase();
  // 1. Знаходимо company_id за тікером
  const company = await db
    .select({ companyId: dimCompany.companyId, companyName: dimCompany.companyName })
    .from(dimCompany)
    .where(eq(dimCompany.ticker, tickerUpper))
    .limit(1);

  if (company.length === 0) {
    return NextResponse.json({ error: "ticker not found" }, { status: 404 });
  }

  // 2. Тягнемо всі факторні записи для цієї компанії, найновіші перші
  const rows = await db
    .select()
    .from(factors)
    .where(eq(factors.companyId, company[0].companyId))
    .orderBy(desc(factors.date))
    .limit(60); // ~ останні 60 торгових днів

  return NextResponse.json({
    ticker: tickerUpper,
    company_name: company[0].companyName,
    data: rows,
  });
}
```
Перевірка:
```bash
npm run dev
curl "http://localhost:3000/api/companies?limit=5"
curl "http://localhost:3000/api/companies/AAPL/factors"

```

## Крок 1: ініціалізація репозиторію

## Крок 1: ініціалізація репозиторію

