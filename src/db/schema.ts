import { pgTable, serial, text, integer, boolean, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  color: text("color").notNull().default("peach"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  pricePaise: integer("price_paise").notNull(),
  illustration: text("illustration").notNull().default("meal"),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  totalPaise: integer("total_paise").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entryItems = pgTable("entry_items", {
  id: serial("id").primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => menuItems.id),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPricePaise: integer("unit_price_paise").notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  month: text("month").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  method: text("method").notNull().default("Cash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  month: text("month").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("bill_customer_month_unique").on(table.customerId, table.month)]);

export const shopSettings = pgTable("shop_settings", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull().default("Canteen Counter"),
  owner: text("owner").notNull().default("Shop Manager"),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
});
