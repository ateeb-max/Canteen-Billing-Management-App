"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, CircleCheck, Download, FileCheck2, Printer, ReceiptText, Search, Wallet, X } from "lucide-react";
import { useCanteen } from "./canteen-context";
import { Avatar, EmptyState, Modal, PageHeading, Spinner, StatCard, StatusBadge } from "./ui";
import { currentMonth, customerCode, displayDate, downloadCSV, itemCode, money, monthLabel, monthlyBills } from "@/lib/format";
import type { MonthlyBill } from "@/lib/types";

export function BillsView() {
  const { data, mutate, notify } = useCanteen();
  const [month, setMonth] = useState(currentMonth());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All bills");
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const rows = useMemo(() => monthlyBills(data, month), [data, month]);
  const filtered = rows.filter((row) => `${row.customer.name} ${customerCode(row.customer.id)}`.toLowerCase().includes(query.toLowerCase()) && (status === "All bills" || row.status === status));
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const paid = rows.reduce((sum, row) => sum + row.paid, 0);
  const due = rows.reduce((sum, row) => sum + row.due, 0);
  async function generate() {
    setGenerating(true);
    try { const result = await mutate("generate-bills", { month }); notify(result.count ? `${result.count} monthly bills are ready to print or download.` : "All bills are already up to date."); } catch {} finally { setGenerating(false); }
  }
  function exportSummary() {
    downloadCSV(`Canteen-bills-${month}.csv`, [[data.settings.name, monthLabel(month)], ["Customer ID", "Customer", "Entries", "Bill total (PKR)", "Paid (PKR)", "Balance (PKR)", "Status"], ...filtered.map((row) => [customerCode(row.customer.id), row.customer.name, row.entries.length, row.total / 100, row.paid / 100, row.due / 100, row.status])]);
    notify("Your monthly summary has been downloaded.");
  }
  return <><PageHeading title="Every month, neatly settled." subtitle="All their entries. One simple bill. No calculator needed." actions={<><button className="button button-secondary" onClick={exportSummary} disabled={!filtered.length}><Download size={16} />Export summary</button><button className="button button-primary" onClick={generate} disabled={generating || !rows.length}>{generating ? <Spinner /> : <ReceiptText size={17} />}Generate bills</button></>} /><div className="stats-grid stats-three"><StatCard label="Total billed" value={money(total)} caption={`${rows.length} customer bills for ${monthLabel(month, true)}`} icon={ReceiptText} /><StatCard label="Payments received" value={money(paid)} caption={`${rows.filter((row) => row.status === "Paid").length} bills fully settled`} icon={CircleCheck} tone="sage" /><StatCard label="Still to collect" value={money(due)} caption={`From ${rows.filter((row) => row.due > 0).length} customers`} icon={Wallet} tone="purple" /></div><section className="card records-card"><div className="records-card-top"><div><h2>Monthly bills</h2><p>A clear picture of who owes what.</p></div><label className="month-picker"><CalendarDays size={17} /><span className="sr-only">Billing month</span><input aria-label="Billing month" type="month" value={month} min="2000-01" max="2099-12" onChange={(e) => { if (e.target.value) setMonth(e.target.value); }} /></label></div><div className="table-toolbar"><div className="filter-tabs">{["All bills", "Unpaid", "Part-paid", "Paid"].map((tab) => <button key={tab} className={status === tab ? "active" : ""} onClick={() => setStatus(tab)}>{tab}<span>{tab === "All bills" ? rows.length : rows.filter((row) => row.status === tab).length}</span></button>)}</div><div className="search-input table-search"><Search size={16} /><input aria-label="Search bills" placeholder="Search name or customer ID" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button className="input-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</div></div>{filtered.length ? <div className="table-scroll"><table className="data-table bills-table"><thead><tr><th>Customer</th><th>Entries</th><th>Bill total</th><th>Paid</th><th>Balance due</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((row) => <tr key={row.customer.id}><td><div className="table-person"><Avatar name={row.customer.name} color={row.customer.color} small /><div><strong>{row.customer.name}</strong><span>{customerCode(row.customer.id)} {row.generated && <FileCheck2 size={11} aria-label="Bill generated" />}</span></div></div></td><td className="muted">{row.entries.length}</td><td className="amount">{money(row.total)}</td><td className="muted">{money(row.paid)}</td><td className={`amount${row.due > 0 ? " due-amount" : ""}`}>{money(row.due)}</td><td><StatusBadge status={row.status} /></td><td><div className="table-actions"><button className="row-link" onClick={() => setInvoiceId(row.customer.id)}>View bill <ArrowRight size={14} /></button>{row.due > 0 && <button className="icon-button" title="Record a payment" aria-label={`Record payment for ${row.customer.name}`} onClick={() => setPaymentId(row.customer.id)}><Wallet size={16} /></button>}</div></td></tr>)}</tbody></table></div> : <EmptyState title={rows.length ? "No matching bills" : "A clean slate this month"} description={rows.length ? "Try a different name or bill status." : "Customer entries will automatically appear here as monthly bills."} icon={<ReceiptText size={29} />} action={!rows.length ? <Link href="/new-entry" className="button button-primary">Create an entry <ArrowRight size={15} /></Link> : undefined} />}<div className="table-footer"><span>Showing {filtered.length} of {rows.length} bills</span><span><span className="small-dot" />Amounts update as entries are added</span></div></section><div className="page-note"><FileCheck2 size={16} />Every bill is linked to a customer ID. Earlier entries always keep their original rate.</div>{invoiceId !== null && <InvoiceModal customerId={invoiceId} month={month} onClose={() => setInvoiceId(null)} />}{paymentId !== null && <PaymentDialog customerId={paymentId} month={month} onClose={() => setPaymentId(null)} />}</>;
}

export function PaymentDialog({ customerId, month, onClose }: { customerId: number; month: string; onClose: () => void }) {
  const { data, mutate, notify } = useCanteen();
  const bill = monthlyBills(data, month).find((row) => row.customer.id === customerId);
  const [amount, setAmount] = useState(String((bill?.due ?? 0) / 100));
  const [method, setMethod] = useState("Cash");
  const [pending, setPending] = useState(false);
  if (!bill) return null;
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try { await mutate("record-payment", { customerId, month, amountPaise: Math.round(Number(amount) * 100), method }); notify(`${money(Math.round(Number(amount) * 100))} payment recorded for ${bill!.customer.name}.`); onClose(); } catch {} finally { setPending(false); }
  }
  return <Modal title="One less thing to collect." subtitle={`Record a payment for ${monthLabel(month)}.`} onClose={onClose}><form onSubmit={submit}><div className="modal-body form-stack"><div className="payment-customer"><Avatar name={bill.customer.name} color={bill.customer.color} /><div><strong>{bill.customer.name}</strong><span>{customerCode(customerId)}</span></div><div className="payment-due"><span>Outstanding</span><strong>{money(bill.due)}</strong></div></div><div className="field"><label htmlFor="payment-amount">Amount received (PKR)</label><input id="payment-amount" type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" max={bill.due / 100} step="0.01" required /><p className="field-hint">You can record a full or partial payment.</p></div><div className="field"><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={method} onChange={(e) => setMethod(e.target.value)}><option>Cash</option><option>Online transfer</option><option>Bank transfer</option></select></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={pending || bill.due <= 0}>{pending ? <Spinner /> : <Check size={16} />}Record payment</button></div></form></Modal>;
}

function aggregateLines(bill: MonthlyBill) {
  const map = new Map<string, { itemId: number; name: string; quantity: number; price: number; total: number }>();
  for (const entry of bill.entries) for (const line of entry.lines) {
    const key = `${line.itemId}-${line.unitPricePaise}`;
    const current = map.get(key) ?? { itemId: line.itemId, name: line.itemName, quantity: 0, price: line.unitPricePaise, total: 0 };
    current.quantity += line.quantity;
    current.total += line.quantity * line.unitPricePaise;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => a.itemId - b.itemId);
}
export function InvoiceModal({ customerId, month, onClose }: { customerId: number; month: string; onClose: () => void }) {
  const { data, notify } = useCanteen();
  const [paying, setPaying] = useState(false);
  const bill = monthlyBills(data, month).find((row) => row.customer.id === customerId);
  if (!bill) return <Modal title="No bill for this month" subtitle={monthLabel(month)} onClose={onClose}><EmptyState title="No entries yet" description="Add a customer entry to start this month’s bill." /></Modal>;
  const lines = aggregateLines(bill);
  const billNumber = `SC-${month.replace("-", "")}-${customerCode(customerId)}`;
  function download() {
    downloadCSV(`${billNumber}.csv`, [[data.settings.name], ["Monthly bill", billNumber], ["Customer", bill!.customer.name, customerCode(customerId)], ["Period", monthLabel(month)], [], ["Serial", "Item", "Quantity", "Rate (PKR)", "Amount (PKR)"], ...lines.map((line) => [itemCode(line.itemId), line.name, line.quantity, line.price / 100, line.total / 100]), [], ["Total", bill!.total / 100], ["Paid", bill!.paid / 100], ["Balance due", bill!.due / 100], [], ["Payment date", "Method", "Amount (PKR)"], ...bill!.payments.map((payment) => [displayDate(payment.createdAt, true), payment.method, payment.amountPaise / 100])]);
    notify("Customer bill downloaded.");
  }
  if (paying) return <PaymentDialog customerId={customerId} month={month} onClose={() => setPaying(false)} />;
  return <Modal title="Monthly customer bill" subtitle="Everything in one place, down to the last cup of tea." onClose={onClose} wide className="invoice-modal"><div className="invoice-sheet"><div className="invoice-shop"><div><span className="invoice-eyebrow">MONTHLY STATEMENT</span><h2>{data.settings.name}</h2><p>{data.settings.address}</p>{data.settings.phone && <p>Phone: {data.settings.phone}</p>}</div><div className="invoice-number"><ReceiptText size={29} strokeWidth={1.3} /><strong>{billNumber}</strong><StatusBadge status={bill.status} /></div></div><div className="invoice-customer"><div><span className="invoice-eyebrow">BILLED TO</span><h3>{bill.customer.name}</h3><p>Customer ID: <strong>{customerCode(customerId)}</strong></p>{bill.customer.phone && <p>{bill.customer.phone}</p>}</div><div><span className="invoice-eyebrow">BILLING PERIOD</span><h3>{monthLabel(month)}</h3><p>{bill.entries.length} entries · {lines.reduce((sum, line) => sum + line.quantity, 0)} items</p></div></div><div className="table-scroll"><table className="data-table invoice-table"><thead><tr><th>No.</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{lines.map((line) => <tr key={`${line.itemId}-${line.price}`}><td>#{itemCode(line.itemId)}</td><td>{line.name}</td><td>{line.quantity}</td><td>{money(line.price)}</td><td className="amount">{money(line.total)}</td></tr>)}</tbody></table></div><div className="invoice-totals"><div><span>Bill total</span><strong>{money(bill.total)}</strong></div><div className="paid-total"><span>Payments received</span><strong>− {money(bill.paid)}</strong></div><div className="balance-total"><span>Balance due</span><strong>{money(bill.due)}</strong></div></div>{bill.payments.length > 0 && <section className="invoice-payment-history"><h4>Payment history</h4>{bill.payments.map((payment) => <div key={payment.id}><span><CircleCheck size={13} />{displayDate(payment.createdAt, true)} · {payment.method}</span><strong>{money(payment.amountPaise)}</strong></div>)}</section>}<details className="invoice-entry-details"><summary>View date-wise entries ({bill.entries.length})</summary><div className="invoice-entry-list">{[...bill.entries].reverse().map((entry) => <div key={entry.id}><span>{displayDate(entry.createdAt)}</span><p>{entry.lines.map((line) => `${line.itemName} × ${line.quantity}`).join(", ")}{entry.note && <small>{entry.note}</small>}</p><strong>{money(entry.totalPaise)}</strong></div>)}</div></details><p className="invoice-thanks">Good food. Familiar faces. Thank you for being one of them.</p></div><div className="modal-footer invoice-actions">{bill.due > 0 && <button className="button button-primary" onClick={() => setPaying(true)}><Wallet size={16} />Record payment</button>}<div className="invoice-export-actions"><button className="button button-secondary" onClick={download}><ArrowDownToLine size={16} />Download CSV</button><button className="button button-secondary" onClick={() => window.print()}><Printer size={16} />Print bill</button></div></div></Modal>;
}
