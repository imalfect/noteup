import { db } from "@/db";
import { noteVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getNoteVersions(noteId: string) {
  return db()
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.version));
}

export async function getNoteVersion(noteId: string, version: number) {
  const [v] = await db()
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.version))
    .limit(1)
    .offset(0);

  // actually query by version number
  const results = await db()
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId));

  return results.find((r) => r.version === version) ?? null;
}
