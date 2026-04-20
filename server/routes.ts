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

  // AI Smart Report — 24-hour server-side cache
  const reportCache = new Map<string, { data: unknown; timestamp: number }>();
  const REPORT_CACHE_TTL = 24 * 60 * 60 * 1000;

  app.post("/api/ai/report", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { language = "en", forceRefresh = false } = req.body as { language?: string; forceRefresh?: boolean };

      const cached = reportCache.get(userId);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < REPORT_CACHE_TTL) {
        return res.json({ ...cached.data, fromCache: true, cachedAt: new Date(cached.timestamp).toISOString() });
      }

      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
      const prevYear = curMonth === 1 ? curYear - 1 : curYear;

      const startOfCurMonth = new Date(curYear, curMonth - 1, 1).toISOString();
      const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1).toISOString();
      const endOfPrevMonth = new Date(curYear, curMonth - 1, 0, 23, 59, 59).toISOString();

      const [curTx, prevTx, categories, goals, investments, assets, bankAccounts, debts] = await Promise.all([
        storage.getTransactions(userId, { startDate: startOfCurMonth }),
        storage.getTransactions(userId, { startDate: startOfPrevMonth, endDate: endOfPrevMonth }),
        storage.getCategories(userId),
        storage.getGoals(userId),
        storage.getInvestments(userId),
        storage.getAssets(userId),
        storage.getBankAccounts(userId),
        storage.getDebts(userId),
      ]);

      const curBudgets = await storage.getBudgets(userId, curMonth, curYear);
      const prevBudgets = await storage.getBudgets(userId, prevMonth, prevYear);

      const systemPrompt = `You are an expert bilingual (Arabic/English) personal finance AI analyst for FinTrack app.
Analyze the user's complete financial data and return a detailed JSON report.
The user's preferred language is "${language}". Prioritize that language in your summaries but include both.

Current month: ${now.toLocaleString("en", { month: "long", year: "numeric" })}

STRICT JSON RESPONSE FORMAT (no extra text, valid JSON only):
{
  "monthlyAnalysis": {
    "summaryEn": "3-4 sentence English summary of overall financial health this month",
    "summaryAr": "3-4 sentence Arabic summary of overall financial health this month",
    "totalIncome": <number>,
    "totalExpenses": <number>,
    "prevMonthIncome": <number>,
    "prevMonthExpenses": <number>,
    "savingsRate": <percentage 0-100>,
    "biggestExpenseCategory": "<category name>",
    "biggestExpenseAmount": <number>,
    "incomeChange": <percentage change from prev month, can be negative>,
    "expenseChange": <percentage change from prev month, can be negative>
  },
  "spendingInsights": [
    {
      "type": "success|warning|danger",
      "messageEn": "specific English insight with numbers",
      "messageAr": "specific Arabic insight with numbers",
      "icon": "trending-up|trending-down|alert|check|target|piggy-bank"
    }
  ],
  "aiAdvice": [
    {
      "titleEn": "short English title",
      "titleAr": "short Arabic title",
      "descriptionEn": "specific actionable English advice with numbers from the data",
      "descriptionAr": "specific actionable Arabic advice with numbers",
      "category": "savings|investment|spending|debt|goals",
      "potentialSavings": <number or null>
    }
  ],
  "forecast": {
    "nextMonthTotalExpenses": <predicted number based on trends>,
    "confidence": "high|medium|low",
    "messageEn": "brief English forecast explanation",
    "messageAr": "brief Arabic forecast explanation",
    "categoryForecasts": [
      { "name": "<category>", "currentAmount": <number>, "forecastAmount": <number>, "trend": "up|down|stable" }
    ]
  },
  "zakatReminder": {
    "applicable": <boolean, true if total wealth > 5800 USD equivalent>,
    "totalWealth": <sum of bank accounts + investments + assets - debts>,
    "zakatAmount": <totalWealth * 0.025 if applicable>,
    "messageEn": "English zakat message",
    "messageAr": "Arabic zakat message"
  }
}

Generate 4-6 spending insights, 3-5 advice items, and 3-6 category forecasts.
Make insights specific to the actual data — use real numbers and category names.
If data is limited, still provide meaningful analysis based on what's available.`;

      const userContent = `FINANCIAL DATA:
Current Month Transactions: ${JSON.stringify(curTx.map(t => ({ amount: t.amount, type: t.type, description: t.description, date: t.date, categoryId: t.categoryId })))}
Previous Month Transactions: ${JSON.stringify(prevTx.map(t => ({ amount: t.amount, type: t.type, description: t.description, date: t.date, categoryId: t.categoryId })))}
Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
Current Month Budgets: ${JSON.stringify(curBudgets)}
Previous Month Budgets: ${JSON.stringify(prevBudgets)}
Goals: ${JSON.stringify(goals.map(g => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline })))}
Investments: ${JSON.stringify(investments.map(i => ({ name: i.name, type: i.type, currentValue: i.currentValue, purchasePrice: i.purchasePrice })))}
Assets: ${JSON.stringify(assets.map(a => ({ name: a.name, type: a.type, value: a.value })))}
Bank Accounts: ${JSON.stringify(bankAccounts.map(b => ({ name: b.name, balance: b.balance, currency: b.currency })))}
Debts: ${JSON.stringify(debts.map(d => ({ name: d.name, type: d.type, totalAmount: d.totalAmount, remainingAmount: d.remainingAmount })))}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000,
      });

      const reportData = JSON.parse(response.choices[0].message.content || "{}");
      const result = { ...reportData, fromCache: false, generatedAt: new Date().toISOString() };
      reportCache.set(userId, { data: result, timestamp: Date.now() });
      return res.json(result);
    } catch (error) {
      console.error("AI Report Error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // AI Chat endpoint — conversational assistant with full financial context
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, history = [] } = req.body as { message: string; history: { role: string; content: string }[] };
      const userId = getUserId(req);
      const [transactions, goals, accounts, debts, investments, assets, categories] = await Promise.all([
        storage.getTransactions(userId, { startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() }),
        storage.getGoals(userId),
        storage.getBankAccounts(userId),
        storage.getDebts(userId),
        storage.getInvestments(userId),
        storage.getAssets(userId),
        storage.getCategories(userId),
      ]);
      const now = new Date();
      const systemPrompt = `You are Wealthly AI, a friendly and knowledgeable personal finance assistant. 
Today is ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

The user's financial snapshot:
- Bank accounts: ${JSON.stringify(accounts)}
- Investments: ${JSON.stringify(investments)}
- Assets: ${JSON.stringify(assets)}
- Debts: ${JSON.stringify(debts)}
- Goals: ${JSON.stringify(goals)}
- Recent transactions (90 days): ${JSON.stringify(transactions.slice(0, 50))}
- Categories: ${JSON.stringify(categories)}

Be conversational, warm, and specific. Use actual numbers from their data. Keep responses concise (2-4 sentences unless a detailed breakdown is asked for). If they ask for a calculation, show your work briefly.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-10).map((h: any) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user" as const, content: message },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages,
        max_tokens: 500,
      });
      res.json({ reply: response.choices[0].message.content || "I couldn't process that. Try rephrasing your question." });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ reply: "I'm having trouble connecting right now. Please try again in a moment." });
    }
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
