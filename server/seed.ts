import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const systemCategories = [
  { name: "Salary", type: "income", color: "#22c55e", icon: "Wallet", isSystem: true, userId: "system" },
  { name: "Freelance", type: "income", color: "#4ade80", icon: "Briefcase", isSystem: true, userId: "system" },
  { name: "Investments", type: "income", color: "#3b82f6", icon: "TrendingUp", isSystem: true, userId: "system" },
  { name: "Housing", type: "expense", color: "#ef4444", icon: "Home", isSystem: true, userId: "system" },
  { name: "Food & Groceries", type: "expense", color: "#f97316", icon: "Utensils", isSystem: true, userId: "system" },
  { name: "Transportation", type: "expense", color: "#eab308", icon: "Car", isSystem: true, userId: "system" },
  { name: "Utilities", type: "expense", color: "#84cc16", icon: "Zap", isSystem: true, userId: "system" },
  { name: "Healthcare", type: "expense", color: "#06b6d4", icon: "Heart", isSystem: true, userId: "system" },
  { name: "Savings", type: "expense", color: "#8b5cf6", icon: "PiggyBank", isSystem: true, userId: "system" },
  { name: "Emergency Fund", type: "expense", color: "#d946ef", icon: "Shield", isSystem: true, userId: "system" },
  { name: "Entertainment", type: "expense", color: "#f43f5e", icon: "Film", isSystem: true, userId: "system" },
  { name: "Shopping", type: "expense", color: "#ec4899", icon: "ShoppingBag", isSystem: true, userId: "system" },
  { name: "Travel", type: "expense", color: "#0ea5e9", icon: "Plane", isSystem: true, userId: "system" },
];

export async function seedCategories() {
  const existing = await db.select().from(categories).where(eq(categories.isSystem, true));
  if (existing.length > 0) {
    return;
  }
  console.log("Seeding system categories...");
  for (const category of systemCategories) {
    await db.insert(categories).values(category);
  }
  console.log("System categories seeded.");
}

if (process.argv[1] === import.meta.filename) {
  seedCategories().catch(console.error).finally(() => process.exit());
}
