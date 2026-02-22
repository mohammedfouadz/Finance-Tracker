import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPreferences(id: string, prefs: { currency?: string; language?: string; theme?: string }): Promise<User | undefined>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPreferences(id: string, prefs: { currency?: string; language?: string; theme?: string }): Promise<User | undefined> {
    const updates: any = { updatedAt: new Date() };
    if (prefs.currency !== undefined) updates.currency = prefs.currency;
    if (prefs.language !== undefined) updates.language = prefs.language;
    if (prefs.theme !== undefined) updates.theme = prefs.theme;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
