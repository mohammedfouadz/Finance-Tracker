import { db } from "./db";
import { 
  categories, transactions, goals, budgets,
  type InsertCategory, type UpdateCategoryRequest,
  type InsertTransaction, type UpdateTransactionRequest,
  type InsertGoal, type UpdateGoalRequest,
  type InsertBudget, type UpdateBudgetRequest,
  type TransactionQueryParams
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, or } from "drizzle-orm";
import { IAuthStorage, authStorage } from "./replit_integrations/auth/storage";
import { IChatStorage, chatStorage } from "./replit_integrations/chat/storage";

export interface IStorage extends IAuthStorage, IChatStorage {
  // Categories
  getCategories(userId: string): Promise<typeof categories.$inferSelect[]>;
  getCategory(id: number): Promise<typeof categories.$inferSelect | undefined>;
  createCategory(category: InsertCategory): Promise<typeof categories.$inferSelect>;
  updateCategory(id: number, updates: UpdateCategoryRequest): Promise<typeof categories.$inferSelect>;
  deleteCategory(id: number): Promise<void>;

  // Transactions
  getTransactions(userId: string, params?: TransactionQueryParams): Promise<typeof transactions.$inferSelect[]>;
  getTransaction(id: number): Promise<typeof transactions.$inferSelect | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<typeof transactions.$inferSelect>;
  updateTransaction(id: number, updates: UpdateTransactionRequest): Promise<typeof transactions.$inferSelect>;
  deleteTransaction(id: number): Promise<void>;

  // Goals
  getGoals(userId: string): Promise<typeof goals.$inferSelect[]>;
  getGoal(id: number): Promise<typeof goals.$inferSelect | undefined>;
  createGoal(goal: InsertGoal): Promise<typeof goals.$inferSelect>;
  updateGoal(id: number, updates: UpdateGoalRequest): Promise<typeof goals.$inferSelect>;
  deleteGoal(id: number): Promise<void>;

  // Budgets
  getBudgets(userId: string, month: number, year: number): Promise<typeof budgets.$inferSelect[]>;
  createBudget(budget: InsertBudget): Promise<typeof budgets.$inferSelect>;
  updateBudget(id: number, updates: UpdateBudgetRequest): Promise<typeof budgets.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  // Inherit methods from auth and chat storage
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;
  getConversation = chatStorage.getConversation;
  getAllConversations = chatStorage.getAllConversations;
  createConversation = chatStorage.createConversation;
  deleteConversation = chatStorage.deleteConversation;
  getMessagesByConversation = chatStorage.getMessagesByConversation;
  createMessage = chatStorage.createMessage;

  // Categories
  async getCategories(userId: string) {
    return await db.select().from(categories).where(
      or(
        eq(categories.userId, userId),
        eq(categories.isSystem, true)
      )
    );
  }

  async getCategory(id: number) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: UpdateCategoryRequest) {
    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number) {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Transactions
  async getTransactions(userId: string, params?: TransactionQueryParams) {
    let query = db.select().from(transactions).where(eq(transactions.userId, userId));

    if (params) {
      if (params.startDate) {
        query.where(gte(transactions.date, new Date(params.startDate)));
      }
      if (params.endDate) {
        query.where(lte(transactions.date, new Date(params.endDate)));
      }
      if (params.categoryId) {
        query.where(eq(transactions.categoryId, params.categoryId));
      }
      // Implement search if needed
    }

    return await query.orderBy(desc(transactions.date));
  }

  async getTransaction(id: number) {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction) {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, updates: UpdateTransactionRequest) {
    const [updated] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number) {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Goals
  async getGoals(userId: string) {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number) {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal) {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: UpdateGoalRequest) {
    const [updated] = await db.update(goals).set(updates).where(eq(goals.id, id)).returning();
    return updated;
  }

  async deleteGoal(id: number) {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Budgets
  async getBudgets(userId: string, month: number, year: number) {
    return await db.select().from(budgets)
      .where(and(
        eq(budgets.userId, userId),
        eq(budgets.month, month),
        eq(budgets.year, year)
      ));
  }

  async createBudget(budget: InsertBudget) {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, updates: UpdateBudgetRequest) {
    const [updated] = await db.update(budgets).set(updates).where(eq(budgets.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
