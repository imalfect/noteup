import { NextRequest, NextResponse } from "next/server";
import { slugAvailable } from "@/db/functions/slugAvailable";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (!/^[A-Za-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be alphanumeric with dashes" },
      { status: 400 }
    );
  }

  const available = await slugAvailable(slug);
  return NextResponse.json({ available });
}
