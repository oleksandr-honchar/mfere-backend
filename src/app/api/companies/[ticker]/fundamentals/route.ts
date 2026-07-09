import { db } from "@/db";
import { dimCompany, factFundamentals } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Фіксований список концептів з реальних даних — не вигадуємо, підтверджено запитом
const VALID_CONCEPTS = [
  "shares", "revenues", "net_income", "eps_basic", "op_income",
  "tax_expense", "ocf", "equity", "assets", "eps_shares", "cash",
  "cost_of_revenue", "liabilities", "capex", "da", "interest_expense",
  "inventory", "long_term_debt", "debt_current",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase();

  const { searchParams } = new URL(req.url);
  const concept = searchParams.get("concept") ?? "revenues";

  if (!VALID_CONCEPTS.includes(concept)) {
    return NextResponse.json(
      { error: `invalid concept, must be one of: ${VALID_CONCEPTS.join(", ")}` },
      { status: 400 }
    );
  }

  const company = await db
    .select({ companyId: dimCompany.companyId, companyName: dimCompany.companyName })
    .from(dimCompany)
    .where(eq(dimCompany.ticker, tickerUpper))
    .limit(1);

  if (company.length === 0) {
    return NextResponse.json({ error: "ticker not found" }, { status: 404 });
  }

  // period_end asc — хронологія для графіка; filing_date лишаємо в даних,
  // бо це PIT-поле (коли значення стало відомим ринку, не період, за який воно рахується)
  const rows = await db
    .select()
    .from(factFundamentals)
    .where(
      and(
        eq(factFundamentals.companyId, company[0].companyId),
        eq(factFundamentals.concept, concept)
      )
    )
    .orderBy(asc(factFundamentals.periodEnd));

  return NextResponse.json({
    ticker: tickerUpper,
    company_name: company[0].companyName,
    concept,
    data: rows,
  });
}