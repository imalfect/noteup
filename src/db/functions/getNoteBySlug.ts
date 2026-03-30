import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getNoteBySlug(slug: string) {
  const result = await db()
    .select()
    .from(notes)
    .where(eq(notes.slug, slug))
    .limit(1);
  return result[0] ?? null;
}
