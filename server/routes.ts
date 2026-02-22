import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Chat/AI Routes (for "Financial Coach")
  registerChatRoutes(app);

  // === PROTECTED API ROUTES ===

  // Categories
  app.get(api.categories.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const categories = await storage.getCategories(userId);
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
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
    const userId = (req.user as any).claims.sub;
    const params = req.query as any; // Cast query params
    const transactions = await storage.getTransactions(userId, params);
    res.json(transactions);
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
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
    const userId = (req.user as any).claims.sub;
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
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

  // AI Insights Endpoint
  app.post(api.ai.insights.path, isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Fetch user's financial context (last 30 days transactions, current goals)
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
