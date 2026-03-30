import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  slug: text("slug").unique(),
  title: text("title").notNull().default("untitled"),
  content: text("content").notNull(),
  passwordHash: text("password_hash"),
  salt: text("salt"),
  iv: text("iv"),
  encrypted: boolean("encrypted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
