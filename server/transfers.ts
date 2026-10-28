import { db } from "./db";
import { bankAccounts, balanceHistory, transfers, type InsertTransfer } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";

export class TransferError extends Error {}

export async function getTransfers(userId: string) {
  return db.select().from(transfers).where(eq(transfers.userId, userId)).orderBy(desc(transfers.date));
}

/**
 * Moves money between two of the user's accounts in one database transaction:
 * debits the source, credits the destination, and records balance history for
 * both. When the accounts use different currencies and no destination amount
 * is given, it is converted through each account's stored USD rate.
 */
export async function createTransfer(userId: string, input: InsertTransfer) {
  return db.transaction(async (tx) => {
    const owned = (id: number) =>
      tx.select().from(bankAccounts).where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
    const [from] = await owned(input.fromAccountId);
    const [to] = await owned(input.toAccountId);
    if (!from || !to) throw new TransferError("Account not found");

    const fromRate = Number(from.exchangeRateToUsd) || 1;
    const toRate = Number(to.exchangeRateToUsd) || 1;
    const toAmount = input.toAmount ?? (from.currency === to.currency ? input.amount : (input.amount * fromRate) / toRate);

    const move = async (account: typeof from, delta: number) => {
      const prev = Number(account.balance);
      const next = prev + delta;
      await tx.update(bankAccounts)
        .set({ balance: next.toFixed(2), lastUpdated: new Date() })
        .where(eq(bankAccounts.id, account.id));
      await tx.insert(balanceHistory).values({
        bankAccountId: account.id,
        previousBalance: prev.toFixed(2),
        newBalance: next.toFixed(2),
      });
    };
    await move(from, -input.amount);
    await move(to, toAmount);

    const [row] = await tx.insert(transfers).values({
      userId,
      fromAccountId: from.id,
      toAccountId: to.id,
      amount: input.amount.toFixed(2),
      toAmount: toAmount.toFixed(2),
      date: input.date,
      notes: input.notes,
    }).returning();
    return row;
  });
}
