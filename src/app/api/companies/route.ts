import { db } from "@/db";
import { dimCompany } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { asc, or, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);
  const q = searchParams.get("q")?.trim();

  // Пошук по ticker АБО company_name, регістронезалежний (ilike)
  // Без q — звичайний список як раніше, з q — фільтр застосовується в БД
  const whereClause = q
    ? or(
        ilike(dimCompany.ticker, `%${q}%`),
        ilike(dimCompany.companyName, `%${q}%`)
      )
    : undefined;
    
  const companies = await db
    .select()
    .from(dimCompany)
    .where(whereClause)
    .orderBy(asc(dimCompany.ticker))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: companies, limit, offset, q: q ?? null });
}