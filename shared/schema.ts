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
  data: jsonb("data").notNull(), // Stores pre-calculated insights
  createdAt: timestamp("created_at").defaultNow(),
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

// === EXPLICIT API CONTRACT TYPES ===

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

// Request types
export type CreateCategoryRequest = InsertCategory;
export type UpdateCategoryRequest = Partial<InsertCategory>;

export type CreateTransactionRequest = InsertTransaction;
export type UpdateTransactionRequest = Partial<InsertTransaction>;

export type CreateGoalRequest = InsertGoal;
export type UpdateGoalRequest = Partial<InsertGoal>;

export type CreateBudgetRequest = InsertBudget;
export type UpdateBudgetRequest = Partial<InsertBudget>;

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
