import { db } from "@/db";
import { dimCompany, factors } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase();

  const { searchParams } = new URL(req.url);
  const pageSize = 12;
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const offset = (page - 1) * pageSize;
  
  // 1. Знаходимо company_id за тікером
  const company = await db
    .select({ companyId: dimCompany.companyId, companyName: dimCompany.companyName })
    .from(dimCompany)
    .where(eq(dimCompany.ticker, tickerUpper))
    .limit(1);

  if (company.length === 0) {
    return NextResponse.json({ error: "ticker not found" }, { status: 404 });
  }

    // Загальна кількість дат для цієї компанії — потрібна фронту, щоб знати кількість сторінок
  const totalResult = await db
    .select({ count: sql<string>`count(*)` })
    .from(factors)
    .where(eq(factors.companyId, company[0].companyId));

  const total = Number(totalResult[0].count);


  // 2. Тягнемо всі факторні записи для цієї компанії, найновіші перші
  const rows = await db
    .select()
    .from(factors)
    .where(eq(factors.companyId, company[0].companyId))
    .orderBy(desc(factors.date))
    .limit(pageSize)
    .offset(offset);

  return NextResponse.json({
    ticker: tickerUpper,
    company_name: company[0].companyName,
    data: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}