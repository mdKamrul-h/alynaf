import { NextRequest, NextResponse } from "next/server";
import { getAiSettings, saveAiSettings } from "@/lib/ai-settings";

function requireAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ settings: getAiSettings() });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  try {
    const settings = saveAiSettings(body);
    return NextResponse.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
