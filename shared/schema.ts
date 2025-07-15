import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  aiAnalysis: text("ai_analysis"), // JSON string storing AI analysis results
  createdAt: text("created_at").notNull(),
  processedAt: text("processed_at"),
  fileContent: text("file_content"), // Store file content for analysis
  // Encryption fields
  encryptedContent: text("encrypted_content"), // Encrypted file content
  encryptionIv: text("encryption_iv"), // Initialization vector for encryption
  encryptionMetadata: text("encryption_metadata"), // JSON string with encryption details
  contentHash: text("content_hash"), // SHA-256 hash for integrity verification
  encryptedFileMetadata: text("encrypted_file_metadata"), // Encrypted file metadata
  isEncrypted: boolean("is_encrypted").notNull().default(false), // Flag to indicate encryption status
  // Personal information redaction fields
  redactionSummary: text("redaction_summary"),
  redactedItemsCount: integer("redacted_items_count").default(0)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobSchema = createInsertSchema(jobs);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
