import { NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "@/db/functions/getNoteBySlug";
import { getNoteVersion } from "@/db/functions/getNoteVersions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; version: string }> }
) {
  const { slug, version: versionStr } = await params;
  const version = parseInt(versionStr, 10);

  if (isNaN(version)) {
    return NextResponse.json({ error: "invalid version" }, { status: 400 });
  }

  const note = await getNoteBySlug(slug);
  if (!note) {
    return NextResponse.json({ error: "note not found" }, { status: 404 });
  }

  const v = await getNoteVersion(note.id, version);
  if (!v) {
    return NextResponse.json({ error: "version not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: v.id,
    version: v.version,
    title: v.title,
    content: v.content,
    encrypted: v.encrypted,
    salt: v.salt,
    iv: v.iv,
    createdAt: v.createdAt,
  });
}
