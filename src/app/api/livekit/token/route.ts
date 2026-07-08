import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // room — назва кімнати (наприклад, "portfolio-review-2026-07"),
  // identity — унікальний ідентифікатор учасника (email/username)
  const room = searchParams.get("room");
  const identity = searchParams.get("identity");

  if (!room || !identity) {
    return NextResponse.json(
      { error: "room and identity query params are required" },
      { status: 400 }
    );
  }

  // AccessToken підписує JWT ключем API_SECRET — сервер ніколи не віддає сам secret клієнту
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity }
  );

  // Права учасника: може заходити в кімнату, публікувати й підписуватись на потоки
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return NextResponse.json({
    token,
    url: process.env.LIVEKIT_URL,
  });
}