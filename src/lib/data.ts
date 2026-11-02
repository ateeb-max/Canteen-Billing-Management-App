import { asc, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, menuItems, entries, entryItems, payments, bills, shopSettings } from "@/db/schema";
import type { CanteenData } from "@/lib/types";

let seedPromise: Promise<void> | undefined;

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(791423)`);

    // Ensure pre-fed rate list of items exists
    const existingItems = await tx.select().from(menuItems).limit(1);
    if (!existingItems.length) {
      await tx.insert(menuItems).values([
        { name: "Chai (Tea)", category: "Drinks", pricePaise: 5000, illustration: "tea", popular: true },
        { name: "Special Coffee", category: "Drinks", pricePaise: 12000, illustration: "coffee", popular: true },
        { name: "Samosa", category: "Snacks", pricePaise: 4000, illustration: "samosa", popular: true },
        { name: "Paratha", category: "Meals", pricePaise: 6000, illustration: "thali", popular: true },
        { name: "Daal Chawal Plate", category: "Meals", pricePaise: 18000, illustration: "thali", popular: true },
        { name: "Mineral Water", category: "Drinks", pricePaise: 6000, illustration: "water", popular: true },
        { name: "Egg Roll / Shami Roll", category: "Snacks", pricePaise: 10000, illustration: "samosa", popular: false },
        { name: "Chicken Biryani", category: "Meals", pricePaise: 25000, illustration: "thali", popular: false },
        { name: "Cold Drink", category: "Drinks", pricePaise: 8000, illustration: "water", popular: false },
        { name: "Lassi", category: "Drinks", pricePaise: 9000, illustration: "water", popular: false },
        { name: "Biscuits / Bakery Pack", category: "Snacks", pricePaise: 5000, illustration: "biscuit", popular: false },
        { name: "Poha / Snacks", category: "Snacks", pricePaise: 6000, illustration: "poha", popular: false },
      ]);
    }

    // Ensure shop profile setting exists
    const existingSettings = await tx.select().from(shopSettings).limit(1);
    if (!existingSettings.length) {
      await tx.insert(shopSettings).values({
        id: 1,
        name: "Canteen Counter",
        owner: "Shop Manager",
        phone: "",
        address: "Main Market / Street Counter",
      });
    }
  });
}

export async function ensureSeeded() {
  seedPromise ??= seed().catch((error) => {
    seedPromise = undefined;
    throw error;
  });
  await seedPromise;
}

export async function getData(): Promise<CanteenData> {
  await ensureSeeded();
  const [customerRows, itemRows, entryRows, lineRows, paymentRows, billRows, settingsRows] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.id)),
    db.select().from(menuItems).orderBy(asc(menuItems.id)),
    db.select().from(entries).orderBy(desc(entries.createdAt)),
    db.select().from(entryItems).orderBy(asc(entryItems.id)),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(bills),
    db.select().from(shopSettings).limit(1),
  ]);
  const lineMap = new Map<string, typeof lineRows>();
  for (const line of lineRows) {
    const existing = lineMap.get(line.entryId) ?? [];
    existing.push(line);
    lineMap.set(line.entryId, existing);
  }
  return {
    customers: customerRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    items: itemRows,
    entries: entryRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), lines: lineMap.get(row.id) ?? [] })),
    payments: paymentRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    bills: billRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    settings: settingsRows[0] ?? {
      id: 1,
      name: "Canteen Counter",
      owner: "Shop Manager",
      phone: "",
      address: "",
    },
  };
}
