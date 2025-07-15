import { users, jobs, type User, type InsertUser, type Job, type InsertJob } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { DocumentEncryption, type EncryptedDocument } from "./encryption";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  updateJob(id: string, updates: Partial<Job>): Promise<void>;
  getAllJobs(): Promise<Job[]>;
  deleteJob(id: string): Promise<void>;
  getJobByFileName(fileName: string): Promise<Job | undefined>;
  // Encryption methods
  storeEncryptedDocument(jobId: string, content: Buffer, fileMetadata: any): Promise<void>;
  getDecryptedContent(jobId: string): Promise<Buffer | null>;
  verifyDocumentIntegrity(jobId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));
  }

  async deleteJob(id: string): Promise<void> {
    await db
      .delete(jobs)
      .where(eq(jobs.id, id));
  }

  async getJobByFileName(fileName: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.fileName, fileName));
    return job || undefined;
  }

  async storeEncryptedDocument(jobId: string, content: Buffer, fileMetadata: any): Promise<void> {
    try {
      // Encrypt the document content
      const encryptionResult = DocumentEncryption.encryptContent(content);
      
      // Generate content hash for integrity verification
      const contentHash = DocumentEncryption.generateContentHash(content);
      
      // Encrypt file metadata
      const encryptedFileMetadata = DocumentEncryption.encryptMetadata(fileMetadata);
      
      // Store encrypted data in database
      await db
        .update(jobs)
        .set({
          encryptedContent: encryptionResult.encryptedData,
          encryptionIv: encryptionResult.iv,
          encryptionMetadata: JSON.stringify(encryptionResult.metadata),
          contentHash: contentHash,
          encryptedFileMetadata: encryptedFileMetadata,
          isEncrypted: true
        })
        .where(eq(jobs.id, jobId));
      
      console.log(`Document encrypted and stored for job: ${jobId}`);
    } catch (error) {
      console.error('Failed to store encrypted document:', error);
      throw new Error('Document encryption and storage failed');
    }
  }

  async getDecryptedContent(jobId: string): Promise<Buffer | null> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      
      if (!job || !job.isEncrypted || !job.encryptedContent || !job.encryptionIv) {
        return null;
      }

      const encryptionMetadata = JSON.parse(job.encryptionMetadata || '{}');
      
      // Decrypt the content
      const decryptedContent = DocumentEncryption.decryptContent(
        job.encryptedContent,
        job.encryptionIv,
        encryptionMetadata
      );
      
      // Return as Buffer
      return Buffer.isBuffer(decryptedContent) ? decryptedContent : Buffer.from(decryptedContent, 'utf8');
    } catch (error) {
      console.error('Failed to decrypt document content:', error);
      throw new Error('Document decryption failed');
    }
  }

  async verifyDocumentIntegrity(jobId: string): Promise<boolean> {
    try {
      const decryptedContent = await this.getDecryptedContent(jobId);
      if (!decryptedContent) {
        return false;
      }

      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!job || !job.contentHash) {
        return false;
      }

      // Verify content integrity using stored hash
      return DocumentEncryption.verifyContentIntegrity(decryptedContent, job.contentHash);
    } catch (error) {
      console.error('Failed to verify document integrity:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
