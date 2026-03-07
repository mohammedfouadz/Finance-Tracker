import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, registerAdminRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub || (req.session as any)?.userId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerChatRoutes(app);

  await authStorage.ensureAdminByEmail("mohammedfalzaq@gmail.com");

  // Categories
  app.get(api.categories.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const categories = await storage.getCategories(userId);
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const input = api.categories.create.input.parse({ ...req.body, userId });
    const category = await storage.createCategory(input);
    res.status(201).json(category);
  });

  app.put(api.categories.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const input = api.categories.update.input.parse(req.body);
    const updated = await storage.updateCategory(id, input);
    res.json(updated);
  });

  app.delete(api.categories.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.status(204).send();
  });

  // Transactions
  app.get(api.transactions.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const params = req.query as any;
    const transactions = await storage.getTransactions(userId, params);
    res.json(transactions);
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const body = { ...req.body, userId };
    if (body.date && typeof body.date === "string") body.date = new Date(body.date);
    const input = api.transactions.create.input.parse(body);
    const transaction = await storage.createTransaction(input);
    res.status(201).json(transaction);
  });

  app.put(api.transactions.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.date && typeof body.date === "string") body.date = new Date(body.date);
    const input = api.transactions.update.input.parse(body);
    const updated = await storage.updateTransaction(id, input);
    res.json(updated);
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTransaction(id);
    res.status(204).send();
  });

  // Goals
  app.get(api.goals.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const body = { ...req.body, userId };
    if (body.deadline && typeof body.deadline === "string") body.deadline = new Date(body.deadline);
    const input = api.goals.create.input.parse(body);
    const goal = await storage.createGoal(input);
    res.status(201).json(goal);
  });

  app.put(api.goals.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.deadline && typeof body.deadline === "string") body.deadline = new Date(body.deadline);
    const input = api.goals.update.input.parse(body);
    const updated = await storage.updateGoal(id, input);
    res.json(updated);
  });

  app.delete(api.goals.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteGoal(id);
    res.status(204).send();
  });

  // Assets
  app.get(api.assets.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    res.json(await storage.getAssets(userId));
  });
  app.post(api.assets.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const body = { ...req.body, userId };
    if (body.purchaseDate && typeof body.purchaseDate === "string") body.purchaseDate = new Date(body.purchaseDate);
    const input = api.assets.create.input.parse(body);
    res.status(201).json(await storage.createAsset(input));
  });
  app.put(api.assets.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.purchaseDate && typeof body.purchaseDate === "string") body.purchaseDate = new Date(body.purchaseDate);
    res.json(await storage.updateAsset(id, api.assets.update.input.parse(body)));
  });
  app.delete(api.assets.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteAsset(parseInt(req.params.id));
    res.status(204).send();
  });

  // Bank Accounts
  app.get(api.bankAccounts.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    res.json(await storage.getBankAccounts(userId));
  });
  app.post(api.bankAccounts.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const input = api.bankAccounts.create.input.parse({ ...req.body, userId });
    res.status(201).json(await storage.createBankAccount(input));
  });
  app.put(api.bankAccounts.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    res.json(await storage.updateBankAccount(id, api.bankAccounts.update.input.parse(req.body)));
  });
  app.delete(api.bankAccounts.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteBankAccount(parseInt(req.params.id));
    res.status(204).send();
  });
  app.get(api.bankAccounts.history.path, isAuthenticated, async (req, res) => {
    res.json(await storage.getBalanceHistory(parseInt(req.params.id)));
  });

  // Investments
  app.get(api.investments.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    res.json(await storage.getInvestments(userId));
  });
  app.post(api.investments.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const body = { ...req.body, userId };
    if (body.purchaseDate && typeof body.purchaseDate === "string") body.purchaseDate = new Date(body.purchaseDate);
    if (body.sellDate && typeof body.sellDate === "string") body.sellDate = new Date(body.sellDate);
    const input = api.investments.create.input.parse(body);
    res.status(201).json(await storage.createInvestment(input));
  });
  app.put(api.investments.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.purchaseDate && typeof body.purchaseDate === "string") body.purchaseDate = new Date(body.purchaseDate);
    if (body.sellDate && typeof body.sellDate === "string") body.sellDate = new Date(body.sellDate);
    res.json(await storage.updateInvestment(id, api.investments.update.input.parse(body)));
  });
  app.delete(api.investments.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteInvestment(parseInt(req.params.id));
    res.status(204).send();
  });

  // Debts
  app.get(api.debts.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    res.json(await storage.getDebts(userId));
  });
  app.post(api.debts.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const body = { ...req.body, userId };
    if (body.dateTaken && typeof body.dateTaken === "string") body.dateTaken = new Date(body.dateTaken);
    if (body.dueDate && typeof body.dueDate === "string") body.dueDate = new Date(body.dueDate);
    const input = api.debts.create.input.parse(body);
    res.status(201).json(await storage.createDebt(input));
  });
  app.put(api.debts.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.dateTaken && typeof body.dateTaken === "string") body.dateTaken = new Date(body.dateTaken);
    if (body.dueDate && typeof body.dueDate === "string") body.dueDate = new Date(body.dueDate);
    res.json(await storage.updateDebt(id, api.debts.update.input.parse(body)));
  });
  app.delete(api.debts.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteDebt(parseInt(req.params.id));
    res.status(204).send();
  });
  app.get(api.debts.payments.path, isAuthenticated, async (req, res) => {
    res.json(await storage.getDebtPayments(parseInt(req.params.id)));
  });
  app.post(api.debts.createPayment.path, isAuthenticated, async (req, res) => {
    const body = { ...req.body, debtId: parseInt(req.params.id) };
    if (body.paymentDate && typeof body.paymentDate === "string") body.paymentDate = new Date(body.paymentDate);
    const input = api.debts.createPayment.input.parse(body);
    res.status(201).json(await storage.createDebtPayment(input));
  });

  // Budgets
  app.get(api.budgets.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    res.json(await storage.getBudgets(userId, month, year));
  });
  app.post(api.budgets.create.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const input = api.budgets.create.input.parse({ ...req.body, userId });
    res.status(201).json(await storage.createBudget(input));
  });
  app.put(api.budgets.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    res.json(await storage.updateBudget(id, req.body));
  });

  // Goal Contributions
  app.get(api.goalContributions.list.path, isAuthenticated, async (req, res) => {
    res.json(await storage.getGoalContributions(parseInt(req.params.id)));
  });
  app.post(api.goalContributions.create.path, isAuthenticated, async (req, res) => {
    const body = { ...req.body, goalId: parseInt(req.params.id) };
    if (body.contributionDate && typeof body.contributionDate === "string") body.contributionDate = new Date(body.contributionDate);
    const input = api.goalContributions.create.input.parse(body);
    res.status(201).json(await storage.createGoalContribution(input));
  });

  // Zakat
  app.get("/api/zakat/settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const settings = await storage.getZakatSettings(userId);
    res.json(settings || null);
  });

  app.put("/api/zakat/settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const settings = await storage.upsertZakatSettings(userId, req.body);
    res.json(settings);
  });

  app.get("/api/zakat/snapshots", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    res.json(await storage.getZakatSnapshots(userId));
  });

  app.post("/api/zakat/snapshots", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const snapshot = await storage.createZakatSnapshot({ ...req.body, userId });
    res.status(201).json(snapshot);
  });

  app.delete("/api/zakat/snapshots/:id", isAuthenticated, async (req, res) => {
    await storage.deleteZakatSnapshot(parseInt(req.params.id));
    res.status(204).send();
  });

  app.patch("/api/investments/:id/zakat", isAuthenticated, async (req, res) => {
    await storage.updateInvestmentZakatMethod(parseInt(req.params.id), req.body.zakatMethod);
    res.json({ ok: true });
  });

  app.patch("/api/bank-accounts/:id/zakat", isAuthenticated, async (req, res) => {
    await storage.updateBankAccountZakatable(parseInt(req.params.id), req.body.isZakatable);
    res.json({ ok: true });
  });

  // Try to fetch live gold/silver prices from a free public API
  app.get("/api/zakat/prices", isAuthenticated, async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const r = await fetch("https://api.metals.live/v1/spot/gold,silver", { signal: controller.signal });
      clearTimeout(timeout);
      if (r.ok) {
        const data = await r.json() as any[];
        const gold = data.find((d: any) => d.gold !== undefined);
        const silver = data.find((d: any) => d.silver !== undefined);
        // metals.live returns price per troy ounce; 1 troy oz = 31.1035 g
        const TROY_OZ_TO_GRAMS = 31.1035;
        res.json({
          goldPricePerGram: gold ? +(gold.gold / TROY_OZ_TO_GRAMS).toFixed(4) : null,
          silverPricePerGram: silver ? +(silver.silver / TROY_OZ_TO_GRAMS).toFixed(4) : null,
          source: "metals.live",
        });
        return;
      }
    } catch {
      // Fall through to manual fallback
    }
    res.json({ goldPricePerGram: null, silverPricePerGram: null, source: "manual" });
  });

  // AI Insights
  app.post(api.ai.insights.path, isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = getUserId(req);
      const transactions = await storage.getTransactions(userId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      const goals = await storage.getGoals(userId);
      const context = `
        User Financial Data:
        Transactions (Last 30 days): ${JSON.stringify(transactions)}
        Goals: ${JSON.stringify(goals)}
        User Query: ${query || "Provide general financial insights and recommendations based on my recent activity."}
      `;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are a helpful personal finance assistant. Analyze the user's financial data and provide 1 main insight and 3 actionable recommendations. Return JSON." },
          { role: "user", content: context }
        ],
        response_format: { type: "json_object" }
      });
      const content = JSON.parse(response.choices[0].message.content || "{}");
      res.json({
        insight: content.insight || "Your spending is within normal ranges.",
        recommendations: content.recommendations || ["Track your daily expenses.", "Review your subscription services.", "Set a monthly savings goal."]
      });
    } catch (error) {
      console.error("AI Insights Error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  return httpServer;
}
