import { NextRequest, NextResponse } from "next/server";
import { saveNote } from "@/db/functions/saveNote";
import { slugAvailable } from "@/db/functions/slugAvailable";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, title, content, salt, iv, encrypted } = body;

    if (!id || !slug || !content) {
      return NextResponse.json(
        { error: "missing required fields" },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "slug must be alphanumeric with dashes" },
        { status: 400 }
      );
    }

    const available = await slugAvailable(slug);
    if (!available) {
      return NextResponse.json(
        { error: "slug is already taken" },
        { status: 409 }
      );
    }

    await saveNote({
      id,
      slug,
      title: title || "untitled",
      content,
      salt: salt || null,
      iv: iv || null,
      encrypted: encrypted || false,
    });

    return NextResponse.json({ id, slug });
  } catch (error) {
    console.error("publish error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
