import type { Express } from "express";
import { authStorage } from "./storage";
import { isAdmin } from "./replitAuth";
import { db } from "../../db";
import { transactions, categories, bankAccounts, investments, assets, debts, goals } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";

const ADMIN_EMAIL = "mohammedfalzaq@gmail.com";

export function registerAdminRoutes(app: Express): void {
  // ── Overview stats ──────────────────────────────────────────────────────────
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const allUsers = await authStorage.getAllUsers();
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newThisWeek = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= startOfWeek).length;
      const newThisMonth = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= startOfMonth).length;

      const currencyCount: Record<string, number> = {};
      const languageCount: Record<string, number> = {};
      const themeCount: Record<string, number> = {};
      allUsers.forEach(u => {
        const cur = u.currency || "USD";
        currencyCount[cur] = (currencyCount[cur] || 0) + 1;
        const lang = u.language || "en";
        languageCount[lang] = (languageCount[lang] || 0) + 1;
        const theme = u.theme || "light";
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });

      const topCurrencies = Object.entries(currencyCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([currency, count]) => ({ currency, count }));
      const topLanguages = Object.entries(languageCount).sort((a, b) => b[1] - a[1]).map(([language, count]) => ({ language, count }));
      const topThemes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]).map(([theme, count]) => ({ theme, count }));

      res.json({ totalUsers: allUsers.length, activeUsers: allUsers.filter(u => u.isActive !== false).length, newThisWeek, newThisMonth, topCurrencies, topLanguages, topThemes });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ── User growth chart (last 30 days) ────────────────────────────────────────
  app.get("/api/admin/stats/growth", isAdmin, async (req, res) => {
    try {
      const allUsers = await authStorage.getAllUsers();
      const now = new Date();
      const days = 30;
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - days);

      const baseCount = allUsers.filter(u => !u.createdAt || new Date(u.createdAt) < cutoff).length;
      const result = [];
      let cumulative = baseCount;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const newCount = allUsers.filter(u => {
          if (!u.createdAt) return false;
          return new Date(u.createdAt).toISOString().split("T")[0] === dateStr;
        }).length;
        cumulative += newCount;
        result.push({ date: dateStr, newUsers: newCount, total: cumulative });
      }
      res.json(result);
    } catch (error) {
      console.error("Admin growth error:", error);
      res.status(500).json({ message: "Failed to fetch growth data" });
    }
  });

  // ── Users list with tx counts ────────────────────────────────────────────────
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await authStorage.getAllUsers();

      const txRows = await db.select({ userId: transactions.userId, cnt: count() }).from(transactions).groupBy(transactions.userId);
      const txMap: Record<string, number> = {};
      txRows.forEach(r => { txMap[r.userId] = Number(r.cnt); });

      const usersWithStats = allUsers.map(u => ({ ...u, txCount: txMap[u.id] || 0 }));
      res.json(usersWithStats);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ── User detail with full financial data ─────────────────────────────────────
  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await authStorage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;

      const [userTx, userCats, userBanks, userInv, userAss, userDebts, userGoals] = await Promise.all([
        db.select().from(transactions).where(eq(transactions.userId, id)).orderBy(desc(transactions.createdAt)),
        db.select().from(categories).where(eq(categories.userId, id)),
        db.select().from(bankAccounts).where(eq(bankAccounts.userId, id)),
        db.select().from(investments).where(eq(investments.userId, id)),
        db.select().from(assets).where(eq(assets.userId, id)),
        db.select().from(debts).where(eq(debts.userId, id)),
        db.select().from(goals).where(eq(goals.userId, id)),
      ]);

      const incomeCatIds = new Set(userCats.filter(c => c.type === "income").map(c => c.id));
      const bankTotal = userBanks.reduce((s, a) => s + Number(a.balance) * Number(a.exchangeRateToUsd), 0);
      const invTotal = userInv.filter(i => i.status === "active").reduce((s, i) => s + Number(i.currentValue) * Number(i.exchangeRateToUsd), 0);
      const assTotal = userAss.filter(a => a.status === "owned").reduce((s, a) => s + Number(a.currentValue) * Number(a.exchangeRateToUsd), 0);
      const debtTotal = userDebts.filter(d => d.status === "active").reduce((s, d) => s + Number(d.remainingAmount) * Number(d.exchangeRateToUsd), 0);
      const netWorth = bankTotal + invTotal + assTotal - debtTotal;

      const totalIncome = userTx.filter(t => t.categoryId && incomeCatIds.has(t.categoryId)).reduce((s, t) => s + Number(t.amount) * Number(t.exchangeRateToUsd), 0);
      const totalExpenses = userTx.filter(t => t.categoryId && !incomeCatIds.has(t.categoryId)).reduce((s, t) => s + Number(t.amount) * Number(t.exchangeRateToUsd), 0);

      res.json({
        user: safeUser,
        transactions: userTx,
        categories: userCats,
        bankAccounts: userBanks,
        investments: userInv,
        assets: userAss,
        debts: userDebts,
        goals: userGoals,
        summary: {
          netWorth,
          totalIncome,
          totalExpenses,
          bankCount: userBanks.length,
          investmentCount: userInv.filter(i => i.status === "active").length,
          assetCount: userAss.filter(a => a.status === "owned").length,
          debtCount: userDebts.filter(d => d.status === "active").length,
          goalCount: userGoals.filter(g => g.status === "active").length,
          txCount: userTx.length,
        },
      });
    } catch (error) {
      console.error("Admin get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ── Update user ──────────────────────────────────────────────────────────────
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
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      console.error("Admin update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ── Delete user ──────────────────────────────────────────────────────────────
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const target = await authStorage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.email === ADMIN_EMAIL) return res.status(403).json({ message: "Cannot delete the primary admin account" });
      await authStorage.adminDeleteUser(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ── Suspend / Reactivate ─────────────────────────────────────────────────────
  app.post("/api/admin/users/:id/suspend", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const target = await authStorage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.email === ADMIN_EMAIL) return res.status(403).json({ message: "Cannot suspend the primary admin account" });
      const user = await authStorage.setUserActive(id, false);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Admin suspend error:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:id/reactivate", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await authStorage.setUserActive(id, true);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Admin reactivate error:", error);
      res.status(500).json({ message: "Failed to reactivate user" });
    }
  });

  // ── Legacy status toggle ─────────────────────────────────────────────────────
  app.put("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be a boolean" });
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
