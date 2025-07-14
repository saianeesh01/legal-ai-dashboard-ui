import { users, jobs, type User, type InsertUser, type Job, type InsertJob } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
