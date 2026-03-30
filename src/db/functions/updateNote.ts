import { db } from "@/db";
import { notes, noteVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type UpdateNoteInput = {
  slug: string;
  title: string;
  content: string;
  salt?: string | null;
  iv?: string | null;
  encrypted: boolean;
};

export async function updateNote(slug: string, input: UpdateNoteInput) {
  const [note] = await db()
    .select()
    .from(notes)
    .where(eq(notes.slug, slug))
    .limit(1);

  if (!note) return null;

  const newVersion = note.version + 1;

  // save new version to history
  await db().insert(noteVersions).values({
    id: nanoid(12),
    noteId: note.id,
    version: newVersion,
    title: input.title,
    content: input.content,
    encrypted: input.encrypted,
    salt: input.salt ?? null,
    iv: input.iv ?? null,
    createdAt: new Date(),
  });

  // update the main note
  await db()
    .update(notes)
    .set({
      title: input.title,
      content: input.content,
      encrypted: input.encrypted,
      salt: input.salt ?? null,
      iv: input.iv ?? null,
      version: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(notes.slug, slug));

  return { version: newVersion, noteId: note.id };
}
