import { db } from "@/db";
import { notes, noteVersions } from "@/db/schema";
import { nanoid } from "nanoid";

export type SaveNoteInput = {
  id: string;
  slug: string;
  title: string;
  content: string;
  passwordHash?: string | null;
  salt?: string | null;
  iv?: string | null;
  encrypted: boolean;
  editKeyHash: string;
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
    editKeyHash: input.editKeyHash,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // save initial version
  await db().insert(noteVersions).values({
    id: nanoid(12),
    noteId: input.id,
    version: 1,
    title: input.title,
    content: input.content,
    encrypted: input.encrypted,
    salt: input.salt ?? null,
    iv: input.iv ?? null,
    createdAt: new Date(),
  });

  return input.id;
}
