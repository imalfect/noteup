import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getNoteById(id: string) {
  const result = await db()
    .select()
    .from(notes)
    .where(eq(notes.id, id))
    .limit(1);
  return result[0] ?? null;
}
