import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function slugAvailable(slug: string): Promise<boolean> {
  const result = await db()
    .select({ id: notes.id })
    .from(notes)
    .where(eq(notes.slug, slug))
    .limit(1);
  return result.length === 0;
}
