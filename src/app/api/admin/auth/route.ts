import { NextRequest, NextResponse } from "next/server";

/** Lightweight auth check — no DB, works without Supabase configured. */
export async function POST(req: NextRequest) {
  const body = await req.json() as { key?: string };
  const valid = body.key === (process.env.ADMIN_KEY ?? "alynaf-admin");
  if (!valid) return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
