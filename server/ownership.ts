import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db } from "./db";
import {
  categories, transactions, goals, budgets, assets, bankAccounts, investments,
  debts, debtPayments, goalContributions, zakatSnapshots,
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Every record a user can change by id must belong to them (spec BR-01:
 * financial data is only reachable by its owner). These lookups return the
 * owning user id of a record, following the parent for child records.
 */
const ownerOf = {
  category: async (id: number) => (await db.select({ u: categories.userId }).from(categories).where(eq(categories.id, id)))[0]?.u,
  transaction: async (id: number) => (await db.select({ u: transactions.userId }).from(transactions).where(eq(transactions.id, id)))[0]?.u,
  goal: async (id: number) => (await db.select({ u: goals.userId }).from(goals).where(eq(goals.id, id)))[0]?.u,
  budget: async (id: number) => (await db.select({ u: budgets.userId }).from(budgets).where(eq(budgets.id, id)))[0]?.u,
  asset: async (id: number) => (await db.select({ u: assets.userId }).from(assets).where(eq(assets.id, id)))[0]?.u,
  bankAccount: async (id: number) => (await db.select({ u: bankAccounts.userId }).from(bankAccounts).where(eq(bankAccounts.id, id)))[0]?.u,
  investment: async (id: number) => (await db.select({ u: investments.userId }).from(investments).where(eq(investments.id, id)))[0]?.u,
  debt: async (id: number) => (await db.select({ u: debts.userId }).from(debts).where(eq(debts.id, id)))[0]?.u,
  zakatSnapshot: async (id: number) => (await db.select({ u: zakatSnapshots.userId }).from(zakatSnapshots).where(eq(zakatSnapshots.id, id)))[0]?.u,
  debtPayment: async (id: number) => {
    const [row] = await db.select({ debtId: debtPayments.debtId }).from(debtPayments).where(eq(debtPayments.id, id));
    return row ? ownerOf.debt(row.debtId) : undefined;
  },
  goalContribution: async (id: number) => {
    const [row] = await db.select({ goalId: goalContributions.goalId }).from(goalContributions).where(eq(goalContributions.id, id));
    return row ? ownerOf.goal(row.goalId) : undefined;
  },
};

export type OwnedKind = keyof typeof ownerOf;

/**
 * Express middleware: responds 404 unless the record named by `req.params[param]`
 * belongs to the signed-in user. 404 rather than 403 so ids of other users'
 * records are not confirmed to exist.
 */
export function requireOwner(kind: OwnedKind, getUserId: (req: Request) => string, param = "id"): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params[param]);
      if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ message: "Not found" });
      const owner = await ownerOf[kind](id);
      if (!owner || owner !== getUserId(req)) return res.status(404).json({ message: "Not found" });
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Drops fields a client must never set on update, such as moving a record to another user. */
export function withoutOwnerFields<T extends Record<string, any>>(body: T): Omit<T, "userId" | "id"> {
  const { userId: _u, id: _i, ...rest } = body ?? ({} as T);
  return rest;
}
