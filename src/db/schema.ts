import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  slug: text("slug").unique(),
  title: text("title").notNull().default("untitled"),
  content: text("content").notNull(),
  passwordHash: text("password_hash"),
  salt: text("salt"),
  iv: text("iv"),
  encrypted: boolean("encrypted").notNull().default(false),
  editKeyHash: text("edit_key_hash").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const noteVersions = pgTable("note_versions", {
  id: text("id").primaryKey(),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  encrypted: boolean("encrypted").notNull().default(false),
  salt: text("salt"),
  iv: text("iv"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
