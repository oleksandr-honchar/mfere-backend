import { db } from "@/db";
import { dimCompany, factPrices } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase();

  const company = await db
    .select({ companyId: dimCompany.companyId, companyName: dimCompany.companyName })
    .from(dimCompany)
    .where(eq(dimCompany.ticker, tickerUpper))
    .limit(1);

  if (company.length === 0) {
    return NextResponse.json({ error: "ticker not found" }, { status: 404 });
  }

  // Хронологічний порядок (asc) — на відміну від factors, бо графіку потрібна timeline зліва направо
  // ~376 днів на компанію за оцінкою раніше — весь діапазон влізає в один запит без пагінації API
  const rows = await db
    .select()
    .from(factPrices)
    .where(eq(factPrices.companyId, company[0].companyId))
    .orderBy(asc(factPrices.tradeDate));

  return NextResponse.json({
    ticker: tickerUpper,
    company_name: company[0].companyName,
    data: rows,
  });
}