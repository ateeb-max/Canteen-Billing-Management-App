export interface Customer {
  id: number;
  name: string;
  phone: string;
  color: string;
  createdAt: string;
}
export interface MenuItem {
  id: number;
  name: string;
  category: string;
  pricePaise: number;
  illustration: string;
  popular: boolean;
  active: boolean;
}
export interface EntryLine {
  id: number;
  entryId: string;
  itemId: number;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
}
export interface Entry {
  id: string;
  customerId: number;
  totalPaise: number;
  note: string;
  createdAt: string;
  lines: EntryLine[];
}
export interface Payment {
  id: string;
  customerId: number;
  month: string;
  amountPaise: number;
  method: string;
  createdAt: string;
}
export interface Bill {
  id: number;
  customerId: number;
  month: string;
  createdAt: string;
}
export interface ShopSettings {
  id: number;
  name: string;
  owner: string;
  phone: string;
  address: string;
}
export interface CanteenData {
  customers: Customer[];
  items: MenuItem[];
  entries: Entry[];
  payments: Payment[];
  bills: Bill[];
  settings: ShopSettings;
}
export interface MonthlyBill {
  customer: Customer;
  entries: Entry[];
  payments: Payment[];
  total: number;
  paid: number;
  due: number;
  status: "Paid" | "Part-paid" | "Unpaid";
  generated: boolean;
}
export type View = "overview" | "new-entry" | "customers" | "monthly-bills" | "rate-list" | "entries";
export interface MutationResult { id?: string | number; count?: number }
