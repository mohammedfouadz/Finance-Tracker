import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth and Chat models
export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Linked to auth.users.id
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income', 'expense'
  parentId: integer("parent_id"), // For subcategories
  allocationPercentage: numeric("allocation_percentage"), // 0-100
  allocationAmount: numeric("allocation_amount"), // Fixed amount
  color: text("color").notNull().default("#000000"),
  priority: integer("priority").default(0),
  isSystem: boolean("is_system").default(false), // Prevent deletion of default categories
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // e.g., 'monthly', 'weekly'
  receiptUrl: text("receipt_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").default("0"),
  deadline: timestamp("deadline"),
  priority: integer("priority").default(0),
  status: text("status").default("active"), // 'active', 'completed', 'paused'
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  amount: numeric("amount").notNull(),
  spent: numeric("spent").default("0"),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: text("location"),
  purchaseDate: timestamp("purchase_date").notNull(),
  purchasePrice: numeric("purchase_price").notNull(),
  currentValue: numeric("current_value").notNull(),
  status: text("status").notNull().default("owned"),
  monthlyIncome: numeric("monthly_income"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(),
  accountNumber: text("account_number").notNull(),
  currency: text("currency").notNull().default("SAR"),
  balance: numeric("balance").notNull().default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const balanceHistory = pgTable("balance_history", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").notNull().references(() => bankAccounts.id),
  previousBalance: numeric("previous_balance").notNull(),
  newBalance: numeric("new_balance").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  quantity: numeric("quantity"),
  purchasePrice: numeric("purchase_price").notNull(),
  unitPriceAtPurchase: numeric("unit_price_at_purchase"),
  currentValue: numeric("current_value").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  platform: text("platform"),
  status: text("status").notNull().default("active"),
  sellDate: timestamp("sell_date"),
  sellPrice: numeric("sell_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  creditorName: text("creditor_name").notNull(),
  originalAmount: numeric("original_amount").notNull(),
  remainingAmount: numeric("remaining_amount").notNull(),
  currency: text("currency").notNull().default("SAR"),
  reason: text("reason").notNull(),
  dateTaken: timestamp("date_taken").notNull(),
  dueDate: timestamp("due_date"),
  interestRate: numeric("interest_rate"),
  status: text("status").notNull().default("active"),
  paymentPlan: text("payment_plan"),
  installmentAmount: numeric("installment_amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const debtPayments = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").notNull().references(() => debts.id),
  amount: numeric("amount").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  notes: text("notes"),
});

export const goalContributions = pgTable("goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  amount: numeric("amount").notNull(),
  contributionDate: timestamp("contribution_date").notNull(),
  notes: text("notes"),
});

// === RELATIONS ===

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "subcategories",
  }),
  children: many(categories, {
    relationName: "subcategories",
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const goalsRelations = relations(goals, ({ }) => ({}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, spent: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, createdAt: true });
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true });
export const insertDebtPaymentSchema = createInsertSchema(debtPayments).omit({ id: true });
export const insertGoalContributionSchema = createInsertSchema(goalContributions).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BalanceHistoryEntry = typeof balanceHistory.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = z.infer<typeof insertDebtPaymentSchema>;
export type GoalContribution = typeof goalContributions.$inferSelect;
export type InsertGoalContribution = z.infer<typeof insertGoalContributionSchema>;

// Request types
export type CreateCategoryRequest = InsertCategory;
export type UpdateCategoryRequest = Partial<InsertCategory>;
export type CreateTransactionRequest = InsertTransaction;
export type UpdateTransactionRequest = Partial<InsertTransaction>;
export type CreateGoalRequest = InsertGoal;
export type UpdateGoalRequest = Partial<InsertGoal>;
export type CreateBudgetRequest = InsertBudget;
export type UpdateBudgetRequest = Partial<InsertBudget>;
export type UpdateAssetRequest = Partial<InsertAsset>;
export type UpdateBankAccountRequest = Partial<InsertBankAccount>;
export type UpdateInvestmentRequest = Partial<InsertInvestment>;
export type UpdateDebtRequest = Partial<InsertDebt>;

// Response types
export type CategoryResponse = Category & { children?: Category[] };
export type TransactionResponse = Transaction & { categoryName?: string, categoryColor?: string };
export type GoalResponse = Goal;
export type BudgetResponse = Budget & { categoryName?: string, categoryColor?: string };

// Query Params
export interface TransactionQueryParams {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BudgetQueryParams {
  month: number;
  year: number;
}
