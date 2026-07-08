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