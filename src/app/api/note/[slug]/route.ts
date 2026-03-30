import { NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "@/db/functions/getNoteBySlug";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const note = await getNoteBySlug(slug);
  if (!note) {
    return NextResponse.json({ error: "note not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: note.id,
    slug: note.slug,
    title: note.title,
    content: note.content,
    encrypted: note.encrypted,
    salt: note.salt,
    iv: note.iv,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  });
}
