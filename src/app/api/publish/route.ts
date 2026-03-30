import { NextRequest, NextResponse } from "next/server";
import { saveNote } from "@/db/functions/saveNote";
import { slugAvailable } from "@/db/functions/slugAvailable";
import { hashEditKey } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, title, content, salt, iv, encrypted, editKey } = body;

    if (!id || !slug || !content || !editKey) {
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

    const editKeyHash = hashEditKey(editKey);

    await saveNote({
      id,
      slug,
      title: title || "untitled",
      content,
      salt: salt || null,
      iv: iv || null,
      encrypted: encrypted || false,
      editKeyHash,
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
