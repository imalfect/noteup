import { getNoteBySlug } from "@/db/functions/getNoteBySlug";
import { notFound } from "next/navigation";
import { NoteViewer } from "@/components/note-viewer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return { title: "not found — noteup" };
  return {
    title: `${note.title} — noteup`,
    description: note.encrypted
      ? "encrypted note"
      : note.content.slice(0, 160),
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <NoteViewer
      note={{
        id: note.id,
        slug: note.slug!,
        title: note.title,
        content: note.content,
        encrypted: note.encrypted,
        salt: note.salt,
        iv: note.iv,
        createdAt: note.createdAt.toISOString(),
      }}
    />
  );
}
