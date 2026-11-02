import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, menuItems, entries, entryItems, payments, bills, shopSettings } from "@/db/schema";
import { ensureSeeded, getData } from "@/lib/data";
import { monthOf } from "@/lib/format";
import type { MutationResult } from "@/lib/types";

export const dynamic = "force-dynamic";
class InputError extends Error {}
function text(value: unknown, label: string, required = true, max = 100) {
  if (typeof value !== "string") { if (!required && value == null) return ""; throw new InputError(`${label} is required.`); }
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new InputError(`Please enter a valid ${label.toLowerCase()} (up to ${max} characters).`);
  return result;
}
function integer(value: unknown, label: string, min = 1, max = 100_000_000) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new InputError(`Please enter a valid ${label.toLowerCase()}.`);
  return value;
}
function monthValue(value: unknown) {
  if (typeof value !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) throw new InputError("Please choose a valid month.");
  return value;
}
function phoneValue(value: unknown) {
  const phone = text(value, "Phone number", false, 25);
  if (phone && (!/^[+\d\s()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) throw new InputError("Please enter a valid phone number.");
  return phone;
}

export async function GET() {
  try { return NextResponse.json(await getData()); }
  catch (error) { console.error("Load canteen data:", error); return NextResponse.json({ error: "Couldn't load your records. Please try again." }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => { throw new InputError("The request could not be read."); });
    if (!body || typeof body !== "object" || !body.payload || typeof body.payload !== "object") throw new InputError("Invalid request.");
    await ensureSeeded();
    const p = body.payload as Record<string, unknown>;
    let result: MutationResult = {};
    switch (body.action) {
      case "save-customer": {
        const name = text(p.name, "Customer name", true, 80);
        const phone = phoneValue(p.phone);
        if (p.id) {
          const id = integer(p.id, "Customer ID");
          const updated = await db.update(customers).set({ name, phone }).where(eq(customers.id, id)).returning();
          if (!updated.length) throw new InputError("Customer not found.");
          result = { id };
        } else {
          const [customer] = await db.insert(customers).values({ name, phone, color: ["peach", "sage", "lavender", "blue", "rose"][Math.floor(Math.random() * 5)] }).returning();
          result = { id: customer.id };
        }
        break;
      }
      case "save-item": {
        const name = text(p.name, "Item name", true, 60);
        const category = text(p.category, "Category");
        if (!["Drinks", "Snacks", "Meals"].includes(category)) throw new InputError("Choose Drinks, Snacks, or Meals.");
        const pricePaise = integer(p.pricePaise, "Item price", 1, 1_000_000);
        const values = { name, category, pricePaise, popular: p.popular === true, active: p.active !== false };
        if (p.id) {
          const id = integer(p.id, "Item number");
          const updated = await db.update(menuItems).set(values).where(eq(menuItems.id, id)).returning();
          if (!updated.length) throw new InputError("Item not found.");
          result = { id };
        } else {
          const [item] = await db.insert(menuItems).values({ ...values, illustration: category === "Drinks" ? "tea" : category === "Snacks" ? "samosa" : "thali" }).returning();
          result = { id: item.id };
        }
        break;
      }
      case "create-entry": {
        const customerId = integer(p.customerId, "Customer ID");
        if (!(await db.select().from(customers).where(eq(customers.id, customerId)).limit(1)).length) throw new InputError("Please select an existing customer.");
        if (!Array.isArray(p.items) || !p.items.length || p.items.length > 50) throw new InputError("Add at least one item to your entry (up to 50).");
        const quantities = new Map<number, number>();
        for (const raw of p.items) {
          if (!raw || typeof raw !== "object") throw new InputError("Invalid item.");
          const itemId = integer(raw.itemId, "Item number");
          const quantity = integer(raw.quantity, "Quantity", 1, 999);
          quantities.set(itemId, integer((quantities.get(itemId) ?? 0) + quantity, "Quantity", 1, 999));
        }
        const products = await db.select().from(menuItems).where(and(inArray(menuItems.id, [...quantities.keys()]), eq(menuItems.active, true)));
        if (products.length !== quantities.size) throw new InputError("An item is unavailable. Please refresh your rate list.");
        const note = text(p.note, "Note", false, 300);
        result = await db.transaction(async (tx) => {
          const totalPaise = products.reduce((sum, item) => sum + item.pricePaise * quantities.get(item.id)!, 0);
          integer(totalPaise, "Entry total", 1, 2_000_000_000);
          const [entry] = await tx.insert(entries).values({ customerId, totalPaise, note }).returning();
          await tx.insert(entryItems).values(products.map((item) => ({ entryId: entry.id, itemId: item.id, itemName: item.name, quantity: quantities.get(item.id)!, unitPricePaise: item.pricePaise })));
          return { id: entry.id };
        });
        break;
      }
      case "record-payment": {
        const customerId = integer(p.customerId, "Customer ID");
        const month = monthValue(p.month);
        const amountPaise = integer(p.amountPaise, "Payment amount");
        const method = text(p.method, "Payment method");
        if (!["Cash", "Online transfer", "Bank transfer"].includes(method)) throw new InputError("Please choose a payment method.");
        result = await db.transaction(async (tx) => {
          await tx.execute(sql`select pg_advisory_xact_lock(28420, ${customerId})`);
          const charges = (await tx.select().from(entries).where(eq(entries.customerId, customerId))).filter((entry) => monthOf(entry.createdAt.toISOString()) === month).reduce((sum, entry) => sum + entry.totalPaise, 0);
          const paid = (await tx.select().from(payments).where(and(eq(payments.customerId, customerId), eq(payments.month, month)))).reduce((sum, payment) => sum + payment.amountPaise, 0);
          if (amountPaise > charges - paid) throw new InputError("Payment cannot be more than the outstanding bill.");
          const [payment] = await tx.insert(payments).values({ customerId, month, amountPaise, method }).returning();
          return { id: payment.id };
        });
        break;
      }
      case "generate-bills": {
        const month = monthValue(p.month);
        const monthlyEntries = (await db.select().from(entries)).filter((entry) => monthOf(entry.createdAt.toISOString()) === month);
        const customerIds = [...new Set(monthlyEntries.map((entry) => entry.customerId))];
        if (!customerIds.length) throw new InputError("There are no entries to bill for this month yet.");
        const generated = await db.insert(bills).values(customerIds.map((customerId) => ({ customerId, month }))).onConflictDoNothing().returning();
        result = { count: generated.length };
        break;
      }
      case "reset-records": {
        if (p.confirmation !== "RESET") throw new InputError("Type RESET to confirm clearing all records.");
        await db.transaction(async (tx) => {
          await tx.delete(bills);
          await tx.delete(payments);
          await tx.delete(entryItems);
          await tx.delete(entries);
          await tx.delete(customers);
        });
        break;
      }
      case "save-settings": {
        const name = text(p.name, "Canteen name", true, 80);
        const owner = text(p.owner, "Owner name", true, 80);
        const phone = phoneValue(p.phone);
        const address = text(p.address, "Address", false, 200);
        await db.update(shopSettings).set({ name, owner, phone, address }).where(eq(shopSettings.id, 1));
        break;
      }
      default: throw new InputError("That action is not available.");
    }
    return NextResponse.json({ result, data: await getData() });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Canteen mutation:", error);
    return NextResponse.json({ error: "Your changes couldn't be saved. Please try again." }, { status: 500 });
  }
}
