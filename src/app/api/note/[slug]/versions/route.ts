import { NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "@/db/functions/getNoteBySlug";
import { getNoteVersions } from "@/db/functions/getNoteVersions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const note = await getNoteBySlug(slug);
  if (!note) {
    return NextResponse.json({ error: "note not found" }, { status: 404 });
  }

  const versions = await getNoteVersions(note.id);

  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      title: v.title,
      createdAt: v.createdAt,
    })),
  });
}
