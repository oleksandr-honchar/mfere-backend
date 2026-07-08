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