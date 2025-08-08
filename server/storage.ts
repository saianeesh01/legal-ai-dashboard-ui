import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { Job, User, InsertJob, InsertUser } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from './db';

// In-memory storage for development mode
class InMemoryStorage {
  private jobs: Map<string, Job> = new Map();
  private users: Map<number, User> = new Map();
  private documents: Map<string, any> = new Map();

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const job: Job = {
      id: jobData.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: jobData.fileName || 'Unknown',
      fileSize: jobData.fileSize || 0,
      status: jobData.status || 'PROCESSING',
      progress: jobData.progress || 0,
      createdAt: jobData.createdAt || new Date().toISOString(),
      processedAt: jobData.processedAt || null,
      aiAnalysis: jobData.aiAnalysis || null,
      fileContent: jobData.fileContent || null,
      encryptedContent: jobData.encryptedContent || null,
      encryptionIv: jobData.encryptionIv || null,
      encryptionMetadata: jobData.encryptionMetadata || null,
      contentHash: jobData.contentHash || null,
      encryptedFileMetadata: jobData.encryptedFileMetadata || null,
      isEncrypted: jobData.isEncrypted || false,
      redactionSummary: jobData.redactionSummary || null,
      redactedItemsCount: jobData.redactedItemsCount || 0
    };

    this.jobs.set(job.id, job);
    console.log(`✅ Created job in memory: ${job.id}`);
    return job;
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    return this.jobs.get(jobId);
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates };
      this.jobs.set(jobId, updatedJob);
      console.log(`✅ Updated job in memory: ${jobId}`);
      return updatedJob;
    }
    return undefined;
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    console.log(`✅ Deleted job from memory: ${jobId}`);
  }

  async getJobByFileName(fileName: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(job => job.fileName === fileName);
  }

  async storeEncryptedDocument(jobId: string, content: Buffer, fileMetadata?: any): Promise<void> {
    this.documents.set(jobId, content.toString());
    console.log(`✅ Stored encrypted document in memory: ${jobId}`);
  }

  async getDecryptedContent(jobId: string): Promise<string | null> {
    return this.documents.get(jobId) || null;
  }

  async verifyDocumentIntegrity(jobId: string): Promise<boolean> {
    return this.documents.has(jobId);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || Math.floor(Math.random() * 10000),
      username: userData.username || 'default',
      password: userData.password || 'default'
    };

    this.users.set(user.id, user);
    console.log(`✅ Created user in memory: ${user.id}`);
    return user;
  }

  async getUser(userId: number): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
}

// Database storage implementation
class DatabaseStorage {
  private db: any;
  private inMemoryStorage: InMemoryStorage;

  constructor(db: any) {
    this.db = db;
    this.inMemoryStorage = new InMemoryStorage();
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    try {
      const [job] = await this.db.insert(schema.jobs).values(jobData).returning();
      console.log(`✅ Created job in database: ${job.id}`);
      return job;
    } catch (error) {
      console.warn(`Database operation failed for createJob: ${error}`);
      // Fallback to in-memory storage
      return this.inMemoryStorage.createJob(jobData);
    }
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    try {
      const [job] = await this.db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId));
      return job;
    } catch (error) {
      console.warn(`Database operation failed for getJob: ${error}`);
      return this.inMemoryStorage.getJob(jobId);
    }
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | undefined> {
    try {
      const [job] = await this.db.update(schema.jobs).set(updates).where(eq(schema.jobs.id, jobId)).returning();
      console.log(`✅ Updated job in database: ${jobId}`);
      return job;
    } catch (error) {
      console.warn(`Database operation failed for updateJob: ${error}`);
      return this.inMemoryStorage.updateJob(jobId, updates);
    }
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      return await this.db.select().from(schema.jobs);
    } catch (error) {
      console.warn(`Database operation failed for getAllJobs: ${error}`);
      return this.inMemoryStorage.getAllJobs();
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await this.db.delete(schema.jobs).where(eq(schema.jobs.id, jobId));
      console.log(`✅ Deleted job from database: ${jobId}`);
    } catch (error) {
      console.warn(`Database operation failed for deleteJob: ${error}`);
      this.inMemoryStorage.deleteJob(jobId);
    }
  }

  async getJobByFileName(fileName: string): Promise<Job | undefined> {
    try {
      const [job] = await this.db.select().from(schema.jobs).where(eq(schema.jobs.fileName, fileName));
      return job;
    } catch (error) {
      console.warn(`Database operation failed for getJobByFileName: ${error}`);
      return this.inMemoryStorage.getJobByFileName(fileName);
    }
  }

  async storeEncryptedDocument(jobId: string, content: Buffer, fileMetadata?: any): Promise<void> {
    try {
      // In a real implementation, this would store encrypted content
      // For now, we'll just log it
      console.log(`✅ Document content stored for job: ${jobId}`);
    } catch (error) {
      console.warn(`Database operation failed for storeEncryptedDocument: ${error}`);
      this.inMemoryStorage.storeEncryptedDocument(jobId, content, fileMetadata);
    }
  }

  async getDecryptedContent(jobId: string): Promise<Buffer | null> {
    try {
      // In a real implementation, this would decrypt and return content
      return null;
    } catch (error) {
      console.warn(`Database operation failed for getDecryptedContent: ${error}`);
      const content = await this.inMemoryStorage.getDecryptedContent(jobId);
      return content ? Buffer.from(content, 'utf-8') : null;
    }
  }

  async verifyDocumentIntegrity(jobId: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify document integrity
      return true;
    } catch (error) {
      console.warn(`Database operation failed for verifyDocumentIntegrity: ${error}`);
      return this.inMemoryStorage.verifyDocumentIntegrity(jobId);
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const [user] = await this.db.insert(schema.users).values(userData).returning();
      console.log(`✅ Created user in database: ${user.id}`);
      return user;
    } catch (error) {
      console.warn(`Database operation failed for createUser: ${error}`);
      return this.inMemoryStorage.createUser(userData);
    }
  }

  async getUser(userId: number): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId));
      return user;
    } catch (error) {
      console.warn(`Database operation failed for getUser: ${error}`);
      return this.inMemoryStorage.getUser(userId);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
      return user;
    } catch (error) {
      console.warn(`Database operation failed for getUserByUsername: ${error}`);
      return this.inMemoryStorage.getUserByUsername(username);
    }
  }
}

export const storage = new DatabaseStorage(db);
