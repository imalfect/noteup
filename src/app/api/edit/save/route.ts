import { NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "@/db/functions/getNoteBySlug";
import { updateNote } from "@/db/functions/updateNote";
import { hashEditKey } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const { slug, editKey, title, content, salt, iv, encrypted } =
      await req.json();

    if (!slug || !editKey || !content) {
      return NextResponse.json(
        { error: "missing required fields" },
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

    const result = await updateNote(slug, {
      slug,
      title: title || note.title,
      content,
      salt: salt ?? null,
      iv: iv ?? null,
      encrypted: encrypted ?? false,
    });

    if (!result) {
      return NextResponse.json(
        { error: "update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slug,
      version: result.version,
    });
  } catch (error) {
    console.error("edit save error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
