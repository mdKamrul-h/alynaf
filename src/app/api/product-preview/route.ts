import { NextRequest, NextResponse } from "next/server";
import { fetchProductPreview } from "@/lib/product-preview";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const preview = await fetchProductPreview(url);
    return NextResponse.json({ preview });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}