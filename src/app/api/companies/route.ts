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