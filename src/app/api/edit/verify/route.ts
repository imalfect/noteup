import { NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "@/db/functions/getNoteBySlug";
import { hashEditKey } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const { slug, editKey } = await req.json();

    if (!slug || !editKey) {
      return NextResponse.json(
        { error: "slug and edit key required" },
        { status: 400 }
      );
    }

    const note = await getNoteBySlug(slug);
    if (!note) {
      return NextResponse.json(
        { error: "note not found" },
        { status: 404 }
      );
    }

    const hash = hashEditKey(editKey);
    if (hash !== note.editKeyHash) {
      return NextResponse.json(
        { error: "invalid edit key" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: note.id,
      slug: note.slug,
      title: note.title,
      content: note.content,
      encrypted: note.encrypted,
      salt: note.salt,
      iv: note.iv,
      version: note.version,
    });
  } catch (error) {
    console.error("verify error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
