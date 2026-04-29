import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, desc } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPreferences(id: string, prefs: { currency?: string; language?: string; theme?: string }): Promise<User | undefined>;
  updatePrivacySettings(id: string, prefs: {
    anonymousAnalytics?: boolean;
    shareDataToImproveAi?: boolean;
    productUpdatesEmail?: boolean;
    marketingCommunications?: boolean;
    dataRetentionYears?: number | null;
  }): Promise<User | undefined>;
  ensureAdminByEmail(email: string): Promise<void>;
  getAllUsers(): Promise<Omit<User, "password">[]>;
  adminUpdateUser(id: string, data: Partial<Pick<User, "firstName" | "lastName" | "email" | "phone" | "country" | "isActive" | "isAdmin">>): Promise<User | undefined>;
  adminDeleteUser(id: string): Promise<void>;
  setUserActive(id: string, isActive: boolean): Promise<User | undefined>;
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

  async updatePrivacySettings(id: string, prefs: {
    anonymousAnalytics?: boolean;
    shareDataToImproveAi?: boolean;
    productUpdatesEmail?: boolean;
    marketingCommunications?: boolean;
    dataRetentionYears?: number | null;
  }): Promise<User | undefined> {
    const updates: any = { updatedAt: new Date() };
    const allowed = ["anonymousAnalytics", "shareDataToImproveAi", "productUpdatesEmail", "marketingCommunications", "dataRetentionYears"] as const;
    for (const key of allowed) {
      if (prefs[key] !== undefined) updates[key] = prefs[key];
    }
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async ensureAdminByEmail(email: string): Promise<void> {
    await db.update(users).set({ isAdmin: true }).where(eq(users.email, email));
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    const all = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        country: users.country,
        currency: users.currency,
        language: users.language,
        theme: users.theme,
        profileImageUrl: users.profileImageUrl,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return all;
  }

  async adminUpdateUser(id: string, data: Partial<Pick<User, "firstName" | "lastName" | "email" | "phone" | "country" | "isActive" | "isAdmin">>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async adminDeleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async setUserActive(id: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
