import type { CanteenData, MonthlyBill } from "./types";

export const money = (paise: number) => {
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
  return `PKR ${formatted}`;
};
export const customerCode = (id: number) => `C${String(id).padStart(3, "0")}`;
export const itemCode = (id: number) => String(id).padStart(2, "0");
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
export function dayKey(date: string | Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}
export const currentMonth = () => dayKey().slice(0, 7);
export const monthOf = (date: string) => dayKey(date).slice(0, 7);
export const monthLabel = (month: string, short = false) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-IN", { month: short ? "short" : "long", year: "numeric" });
export const displayDate = (date: string, includeYear = false) => new Date(date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", ...(includeYear ? { year: "numeric" as const } : {}) });
export const displayTime = (date: string) => new Date(date).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
export function monthlyBills(data: CanteenData, month: string): MonthlyBill[] {
  return data.customers.map((customer) => {
    const entries = data.entries.filter((entry) => entry.customerId === customer.id && monthOf(entry.createdAt) === month);
    const payments = data.payments.filter((payment) => payment.customerId === customer.id && payment.month === month);
    const total = entries.reduce((sum, entry) => sum + entry.totalPaise, 0);
    const paid = payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
    const due = Math.max(0, total - paid);
    return { customer, entries, payments, total, paid, due, status: due === 0 ? "Paid" as const : paid > 0 ? "Part-paid" as const : "Unpaid" as const, generated: data.bills.some((bill) => bill.customerId === customer.id && bill.month === month) };
  }).filter((bill) => bill.entries.length > 0);
}
export function customerBalance(data: CanteenData, id: number) {
  return Math.max(0, data.entries.filter((e) => e.customerId === id).reduce((sum, e) => sum + e.totalPaise, 0) - data.payments.filter((p) => p.customerId === id).reduce((sum, p) => sum + p.amountPaise, 0));
}
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    let text = String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const content = "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
