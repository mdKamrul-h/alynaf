import { NextRequest, NextResponse } from "next/server";
import { isWaConfigured } from "@/lib/wa";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ configured: isWaConfigured() });
}
