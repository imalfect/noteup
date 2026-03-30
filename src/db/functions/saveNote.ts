import { db } from "@/db";
import { notes } from "@/db/schema";

export type SaveNoteInput = {
  id: string;
  slug: string;
  title: string;
  content: string;
  passwordHash?: string | null;
  salt?: string | null;
  iv?: string | null;
  encrypted: boolean;
};

export async function saveNote(input: SaveNoteInput) {
  await db().insert(notes).values({
    id: input.id,
    slug: input.slug,
    title: input.title,
    content: input.content,
    passwordHash: input.passwordHash ?? null,
    salt: input.salt ?? null,
    iv: input.iv ?? null,
    encrypted: input.encrypted,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return input.id;
}
