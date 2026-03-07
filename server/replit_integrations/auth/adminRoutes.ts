import type { Express } from "express";
import { authStorage } from "./storage";
import { isAdmin } from "./replitAuth";
import { db } from "../../db";
import { transactions, categories } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const ADMIN_EMAIL = "mohammedfalzaq@gmail.com";

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const allUsers = await authStorage.getAllUsers();

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newThisWeek = allUsers.filter(
        (u) => u.createdAt && new Date(u.createdAt) >= startOfWeek
      ).length;

      const newThisMonth = allUsers.filter(
        (u) => u.createdAt && new Date(u.createdAt) >= startOfMonth
      ).length;

      const currencyCount: Record<string, number> = {};
      const languageCount: Record<string, number> = {};
      const themeCount: Record<string, number> = {};

      allUsers.forEach((u) => {
        const cur = u.currency || "USD";
        currencyCount[cur] = (currencyCount[cur] || 0) + 1;
        const lang = u.language || "en";
        languageCount[lang] = (languageCount[lang] || 0) + 1;
        const theme = u.theme || "light";
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });

      const topCurrencies = Object.entries(currencyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([currency, count]) => ({ currency, count }));

      const topLanguages = Object.entries(languageCount)
        .sort((a, b) => b[1] - a[1])
        .map(([language, count]) => ({ language, count }));

      const topThemes = Object.entries(themeCount)
        .sort((a, b) => b[1] - a[1])
        .map(([theme, count]) => ({ theme, count }));

      res.json({
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u) => u.isActive !== false).length,
        newThisWeek,
        newThisMonth,
        topCurrencies,
        topLanguages,
        topThemes,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await authStorage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await authStorage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password, ...safeUser } = user;

      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, id))
        .orderBy(desc(transactions.createdAt));

      const userCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, id));

      res.json({ user: safeUser, transactions: userTransactions, categories: userCategories });
    } catch (error) {
      console.error("Admin get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
  });

  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;

      if (req.body.isAdmin !== undefined || req.body.isActive !== undefined) {
        const data: any = {};
        if (req.body.isAdmin !== undefined) data.isAdmin = req.body.isAdmin;
        if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
        const user = await authStorage.adminUpdateUser(id, data);
        if (!user) return res.status(404).json({ message: "User not found" });
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      }

      const data = updateUserSchema.parse(req.body);
      const user = await authStorage.adminUpdateUser(id, data);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Admin update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const target = await authStorage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.email === ADMIN_EMAIL) {
        return res.status(403).json({ message: "Cannot delete the primary admin account" });
      }
      await authStorage.adminDeleteUser(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      const user = await authStorage.setUserActive(id, isActive);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Admin set active error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
}
