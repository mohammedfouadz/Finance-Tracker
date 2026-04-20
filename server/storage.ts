import { db } from "./db";
import { 
  categories, transactions, goals, budgets,
  assets, bankAccounts, balanceHistory, investments, debts, debtPayments, goalContributions,
  zakatSettings, zakatSnapshots,
  type InsertCategory, type UpdateCategoryRequest,
  type InsertTransaction, type UpdateTransactionRequest,
  type InsertGoal, type UpdateGoalRequest,
  type InsertBudget, type UpdateBudgetRequest,
  type InsertAsset, type UpdateAssetRequest,
  type InsertBankAccount, type UpdateBankAccountRequest,
  type InsertInvestment, type UpdateInvestmentRequest,
  type InsertDebt, type UpdateDebtRequest,
  type InsertDebtPayment,
  type InsertGoalContribution,
  type InsertZakatSettings, type UpdateZakatSettingsRequest,
  type InsertZakatSnapshot,
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
  deduplicateCategories(): Promise<number>;

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

  // Assets
  getAssets(userId: string): Promise<typeof assets.$inferSelect[]>;
  createAsset(asset: InsertAsset): Promise<typeof assets.$inferSelect>;
  updateAsset(id: number, updates: UpdateAssetRequest): Promise<typeof assets.$inferSelect>;
  deleteAsset(id: number): Promise<void>;

  // Bank Accounts
  getBankAccounts(userId: string): Promise<typeof bankAccounts.$inferSelect[]>;
  createBankAccount(account: InsertBankAccount): Promise<typeof bankAccounts.$inferSelect>;
  updateBankAccount(id: number, updates: UpdateBankAccountRequest): Promise<typeof bankAccounts.$inferSelect>;
  deleteBankAccount(id: number): Promise<void>;
  getBalanceHistory(bankAccountId: number): Promise<typeof balanceHistory.$inferSelect[]>;

  // Investments
  getInvestments(userId: string): Promise<typeof investments.$inferSelect[]>;
  createInvestment(investment: InsertInvestment): Promise<typeof investments.$inferSelect>;
  updateInvestment(id: number, updates: UpdateInvestmentRequest): Promise<typeof investments.$inferSelect>;
  deleteInvestment(id: number): Promise<void>;

  // Debts
  getDebts(userId: string): Promise<typeof debts.$inferSelect[]>;
  createDebt(debt: InsertDebt): Promise<typeof debts.$inferSelect>;
  updateDebt(id: number, updates: UpdateDebtRequest): Promise<typeof debts.$inferSelect>;
  deleteDebt(id: number): Promise<void>;
  getDebtPayments(debtId: number): Promise<typeof debtPayments.$inferSelect[]>;
  createDebtPayment(payment: InsertDebtPayment): Promise<typeof debtPayments.$inferSelect>;

  // Goal Contributions
  getGoalContributions(goalId: number): Promise<typeof goalContributions.$inferSelect[]>;
  createGoalContribution(contribution: InsertGoalContribution): Promise<typeof goalContributions.$inferSelect>;

  // Zakat
  getZakatSettings(userId: string): Promise<typeof zakatSettings.$inferSelect | undefined>;
  upsertZakatSettings(userId: string, data: UpdateZakatSettingsRequest): Promise<typeof zakatSettings.$inferSelect>;
  getZakatSnapshots(userId: string): Promise<typeof zakatSnapshots.$inferSelect[]>;
  createZakatSnapshot(snapshot: InsertZakatSnapshot): Promise<typeof zakatSnapshots.$inferSelect>;
  deleteZakatSnapshot(id: number): Promise<void>;
  updateInvestmentZakatMethod(id: number, zakatMethod: string): Promise<void>;
  updateBankAccountZakatable(id: number, isZakatable: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
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
    const rows = await db.select().from(categories).where(
      or(
        eq(categories.userId, userId),
        eq(categories.isSystem, true)
      )
    );
    // Deduplicate by name+type, keeping lowest id (first inserted)
    const seen = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      const key = `${row.name.toLowerCase()}|${row.type}`;
      const existing = seen.get(key);
      if (!existing || row.id < existing.id) {
        seen.set(key, row);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.id - b.id);
  }

  async deduplicateCategories() {
    const rows = await db.select().from(categories);
    const seen = new Map<string, number>(); // key -> keep id
    const toDelete: number[] = [];
    for (const row of rows) {
      const key = `${row.name.toLowerCase()}|${row.type}`;
      const keepId = seen.get(key);
      if (keepId === undefined) {
        seen.set(key, row.id);
      } else {
        // keep the lower id, delete the higher
        if (row.id < keepId) {
          toDelete.push(keepId);
          seen.set(key, row.id);
        } else {
          toDelete.push(row.id);
        }
      }
    }
    for (const id of toDelete) {
      await db.delete(categories).where(eq(categories.id, id));
    }
    return toDelete.length;
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

  // Assets
  async getAssets(userId: string) {
    return await db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
  }

  async createAsset(asset: InsertAsset) {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, updates: UpdateAssetRequest) {
    const [updated] = await db.update(assets).set(updates).where(eq(assets.id, id)).returning();
    return updated;
  }

  async deleteAsset(id: number) {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Bank Accounts
  async getBankAccounts(userId: string) {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId)).orderBy(desc(bankAccounts.createdAt));
  }

  async createBankAccount(account: InsertBankAccount) {
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }

  async updateBankAccount(id: number, updates: UpdateBankAccountRequest) {
    if (updates.balance !== undefined) {
      const [existing] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
      if (existing && existing.balance !== updates.balance) {
        await db.insert(balanceHistory).values({
          bankAccountId: id,
          previousBalance: existing.balance,
          newBalance: updates.balance,
        });
      }
    }
    const [updated] = await db.update(bankAccounts).set({ ...updates, lastUpdated: new Date() }).where(eq(bankAccounts.id, id)).returning();
    return updated;
  }

  async deleteBankAccount(id: number) {
    await db.delete(balanceHistory).where(eq(balanceHistory.bankAccountId, id));
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async getBalanceHistory(bankAccountId: number) {
    return await db.select().from(balanceHistory).where(eq(balanceHistory.bankAccountId, bankAccountId)).orderBy(desc(balanceHistory.changedAt));
  }

  // Investments
  async getInvestments(userId: string) {
    return await db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt));
  }

  async createInvestment(investment: InsertInvestment) {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: number, updates: UpdateInvestmentRequest) {
    const [updated] = await db.update(investments).set(updates).where(eq(investments.id, id)).returning();
    return updated;
  }

  async deleteInvestment(id: number) {
    await db.delete(investments).where(eq(investments.id, id));
  }

  // Debts
  async getDebts(userId: string) {
    return await db.select().from(debts).where(eq(debts.userId, userId)).orderBy(desc(debts.createdAt));
  }

  async createDebt(debt: InsertDebt) {
    const [newDebt] = await db.insert(debts).values(debt).returning();
    return newDebt;
  }

  async updateDebt(id: number, updates: UpdateDebtRequest) {
    const [updated] = await db.update(debts).set(updates).where(eq(debts.id, id)).returning();
    return updated;
  }

  async deleteDebt(id: number) {
    await db.delete(debtPayments).where(eq(debtPayments.debtId, id));
    await db.delete(debts).where(eq(debts.id, id));
  }

  async getDebtPayments(debtId: number) {
    return await db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId)).orderBy(desc(debtPayments.paymentDate));
  }

  async createDebtPayment(payment: InsertDebtPayment) {
    const [newPayment] = await db.insert(debtPayments).values(payment).returning();
    await db.update(debts).set({
      remainingAmount: sql`${debts.remainingAmount}::numeric - ${payment.amount}::numeric`,
    }).where(eq(debts.id, payment.debtId));
    return newPayment;
  }

  // Goal Contributions
  async getGoalContributions(goalId: number) {
    return await db.select().from(goalContributions).where(eq(goalContributions.goalId, goalId)).orderBy(desc(goalContributions.contributionDate));
  }

  async createGoalContribution(contribution: InsertGoalContribution) {
    const [newContribution] = await db.insert(goalContributions).values(contribution).returning();
    await db.update(goals).set({
      currentAmount: sql`${goals.currentAmount}::numeric + ${contribution.amount}::numeric`,
    }).where(eq(goals.id, contribution.goalId));
    return newContribution;
  }

  // Zakat
  async getZakatSettings(userId: string) {
    const [settings] = await db.select().from(zakatSettings).where(eq(zakatSettings.userId, userId));
    return settings;
  }

  async upsertZakatSettings(userId: string, data: UpdateZakatSettingsRequest) {
    const existing = await this.getZakatSettings(userId);
    if (existing) {
      const [updated] = await db.update(zakatSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(zakatSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(zakatSettings)
        .values({ userId, ...data } as InsertZakatSettings)
        .returning();
      return created;
    }
  }

  async getZakatSnapshots(userId: string) {
    return await db.select().from(zakatSnapshots)
      .where(eq(zakatSnapshots.userId, userId))
      .orderBy(desc(zakatSnapshots.createdAt));
  }

  async createZakatSnapshot(snapshot: InsertZakatSnapshot) {
    const [created] = await db.insert(zakatSnapshots).values(snapshot).returning();
    return created;
  }

  async deleteZakatSnapshot(id: number) {
    await db.delete(zakatSnapshots).where(eq(zakatSnapshots.id, id));
  }

  async updateInvestmentZakatMethod(id: number, zakatMethod: string) {
    await db.update(investments).set({ zakatMethod }).where(eq(investments.id, id));
  }

  async updateBankAccountZakatable(id: number, isZakatable: boolean) {
    await db.update(bankAccounts).set({ isZakatable }).where(eq(bankAccounts.id, id));
  }
}

export const storage = new DatabaseStorage();
