"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CalendarRange, ChevronDown, ChevronRight, ChevronsUpDown, ClipboardList, CloudCheck, Coins, HelpCircle, LayoutGrid, Menu, NotebookPen, Plus, ReceiptText, Settings2, ShieldCheck, Soup, SquarePlus, TrendingDown, TrendingUp, UsersRound, Wallet, X } from "lucide-react";
import { CanteenProvider, useCanteen } from "./canteen-context";
import { Avatar, EmptyState, PageHeading, ReceiptArt, StatCard } from "./ui";
import { QuickEntry } from "./counter";
import { Dialogs } from "./dialogs";
import { BillsView } from "./billing";
import { CustomersView, EntriesView, EntryDetails, RateListView } from "./records";
import { customerBalance, customerCode, dayKey, displayDate, displayTime, money, monthLabel, monthOf } from "@/lib/format";
import type { CanteenData, Entry, View } from "@/lib/types";

const navigation = [
  { view: "overview", label: "Overview", href: "/", icon: LayoutGrid },
  { view: "new-entry", label: "New entry", href: "/new-entry", icon: SquarePlus },
  { view: "customers", label: "Customers", href: "/customers", icon: UsersRound },
  { view: "monthly-bills", label: "Monthly bills", href: "/monthly-bills", icon: ReceiptText },
  { view: "rate-list", label: "Rate list", href: "/rate-list", icon: ClipboardList },
] as const;
const titles: Record<View, string> = { overview: "Overview", "new-entry": "New entry", customers: "Customers", "monthly-bills": "Monthly bills", "rate-list": "Rate list", entries: "Entry history" };

export default function CanteenApp({ initialData, view }: { initialData: CanteenData; view: View }) {
  return <CanteenProvider initialData={initialData}><AppShell view={view} /></CanteenProvider>;
}
function AppShell({ view }: { view: View }) {
  const { data, openHelp, openSettings } = useCanteen();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  useEffect(() => { setMobileOpen(false); }, [view]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('[role="dialog"]')) return;
      if (event.key.toLowerCase() === "n") { event.preventDefault(); router.push("/new-entry"); }
      if (event.key === "/") {
        const input = document.querySelector<HTMLInputElement>("[data-item-search]");
        if (input) { event.preventDefault(); input.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);
  return <div className="app-shell">{mobileOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}<aside className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}><Link className="brand" href="/" aria-label="Canteen home"><span className="brand-icon"><Soup size={27} strokeWidth={1.7} /></span><div><span className="brand-name">canteen<span>.</span></span><span className="brand-tagline">Every day, made easy.</span></div></Link><button className="mobile-sidebar-close icon-button" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={19} /></button><div className="navigation-label">WORKSPACE</div><nav className="main-nav" aria-label="Main navigation">{navigation.map(({ view: navView, label, href, icon: Icon }) => <Link key={navView} href={href} className={`nav-item${view === navView ? " active" : ""}`} aria-current={view === navView ? "page" : undefined}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{navView === "new-entry" && <kbd>N</kbd>}{navView === "customers" && <span className="nav-count">{data.customers.length}</span>}</Link>)}</nav><div className="nav-divider" /><Link href="/entries" className={`nav-item${view === "entries" ? " active" : ""}`} aria-current={view === "entries" ? "page" : undefined}><NotebookPen size={19} strokeWidth={1.7} /><span>Entry history</span></Link><div className="sidebar-bottom"><div className="help-card"><span className="help-card-icon"><HelpCircle size={21} strokeWidth={1.6} /></span><h3>A little help?</h3><p>Simple steps to get you going.</p><button onClick={openHelp}>Show me how <ArrowRight size={14} /></button></div><button className="nav-item settings-link" onClick={openSettings}><Settings2 size={19} strokeWidth={1.7} /><span>Settings</span></button><button className="shop-profile" onClick={openSettings} aria-label="Edit canteen details"><span className="shop-avatar"><Soup size={21} strokeWidth={1.6} /></span><span><strong>{data.settings.name}</strong><small>Owner account</small></span><ChevronsUpDown size={15} /></button></div><span className="sidebar-version">A little simpler. Every single day.</span></aside><div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button><span className="breadcrumb-home">Your workspace</span><ChevronRight size={14} /><span className="breadcrumb-current">{titles[view]}</span></div><div className="topbar-right"><span className="open-status"><span />Canteen is open</span><span className="topbar-divider" /><button className="topbar-help icon-button" onClick={openHelp} aria-label="How to use Canteen"><HelpCircle size={19} strokeWidth={1.6} /></button><button className="owner-button" onClick={openSettings} aria-label="Owner account"><Avatar name={data.settings.owner} color="peach" small /></button></div></header><main className="main-content">{view === "overview" ? <Dashboard /> : view === "new-entry" ? <NewEntryView /> : view === "customers" ? <CustomersView /> : view === "monthly-bills" ? <BillsView /> : view === "rate-list" ? <RateListView /> : <EntriesView />}<footer className="workspace-footer"><span><CloudCheck size={15} strokeWidth={1.5} />Your records, safe and in one place.</span><span>Made for the everyday.<span className="footer-flower">✳</span></span></footer></main></div><Dialogs /></div>;
}

function Dashboard() {
  const { data } = useCanteen();
  const [date, setDate] = useState(dayKey());
  const today = dayKey();
  const daily = data.entries.filter((entry) => dayKey(entry.createdAt) === date);
  const dailySales = daily.reduce((sum, entry) => sum + entry.totalPaise, 0);
  const previousDate = new Date(`${date}T12:00:00Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const previousSales = data.entries.filter((entry) => dayKey(entry.createdAt) === dayKey(previousDate)).reduce((sum, entry) => sum + entry.totalPaise, 0);
  const percentage = previousSales ? Math.round((dailySales - previousSales) / previousSales * 100) : 0;
  const monthly = data.entries.filter((entry) => monthOf(entry.createdAt) === date.slice(0, 7));
  const outstanding = data.customers.reduce((sum, customer) => sum + customerBalance(data, customer.id), 0);
  const outstandingCustomers = data.customers.filter((customer) => customerBalance(data, customer.id) > 0).length;
  return <><PageHeading title="Your canteen, at a glance." subtitle="Less paperwork. More time for your customers." actions={<><label className="overview-date"><CalendarDays size={16} /><span>{date === today ? "Today, " : ""}{displayDate(`${date}T12:00:00Z`)}</span><ChevronDown size={14} /><input aria-label="Dashboard date" type="date" value={date} onChange={(e) => { if (e.target.value) setDate(e.target.value); }} max={today} /></label><Link className="button button-primary" href="/new-entry"><Plus size={17} />New entry</Link></>} /><div className="stats-grid"><StatCard label={date === today ? "Today’s sales" : "Sales this day"} value={money(dailySales)} icon={Coins} tone="orange" caption={previousSales ? <><span className={`trend ${percentage < 0 ? "trend-down" : ""}`}>{percentage >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{percentage > 0 ? "+" : ""}{percentage}%</span><span>vs. previous day</span></> : <><span className="small-dot" />A fresh start to the day</>} /><StatCard label={date === today ? "Entries today" : "Entries this day"} value={daily.length.toString().padStart(2, "0")} icon={NotebookPen} tone="sage" caption={<><strong>{new Set(daily.map((entry) => entry.customerId)).size} customers</strong> served with a smile</>} /><StatCard label="This month’s total" value={money(monthly.reduce((sum, entry) => sum + entry.totalPaise, 0))} icon={CalendarRange} tone="purple" caption={<>{monthLabel(date.slice(0, 7))}<span className="caption-dot">·</span>{monthly.length} entries</>} /><StatCard label="Pending payments" value={money(outstanding)} icon={Wallet} tone="sand" caption={<><span className="amber-dot" />Across {outstandingCustomers} customer accounts</>} /></div><div className="dashboard-grid"><QuickEntry /><div className="dashboard-side"><RecentEntries entries={daily} isToday={date === today} /><BillingCallout /></div></div></>;
}

function RecentEntries({ entries, isToday = true }: { entries: Entry[]; isToday?: boolean }) {
  const { data } = useCanteen();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  return <><section className="card recent-entries"><div className="card-heading"><div><h2>Recent entries</h2><p>The little things, all accounted for.</p></div><span className="today-badge"><span />{isToday ? "Today" : "Selected day"}</span></div><div className="activity-list">{entries.slice(0, 5).map((entry) => { const customer = data.customers.find((row) => row.id === entry.customerId)!; return <button key={entry.id} className="activity-row" onClick={() => setSelectedEntry(entry.id)}><Avatar name={customer.name} color={customer.color} /><div className="activity-info"><strong>{customer.name}</strong><span>{customerCode(customer.id)}<span className="activity-separator">·</span>{entry.lines.map((line) => `${line.itemName} ×${line.quantity}`).join(", ")}</span></div><div className="activity-amount"><strong>{money(entry.totalPaise)}</strong><time>{displayTime(entry.createdAt)}</time></div></button>; })}{entries.length === 0 && <EmptyState title="Ready for your first entry" description="Every new entry will show up right here." icon={<NotebookPen size={25} />} />}</div><Link href="/entries" className="card-bottom-link">View all entries <ArrowRight size={15} /></Link></section>{selectedEntry && <EntryDetails entryId={selectedEntry} onClose={() => setSelectedEntry(null)} />}</>;
}
function BillingCallout() {
  return <section className="billing-callout"><div className="callout-copy"><span className="callout-eyebrow"><span>✦</span> THE MONTH-END, SORTED</span><h2>A month’s entries.<br />One simple bill.</h2><p>We’ll do the adding up.</p><Link href="/monthly-bills">Go to monthly bills <ArrowRight size={15} /></Link></div><ReceiptArt /></section>;
}
function NewEntryView() {
  const { data } = useCanteen();
  const today = data.entries.filter((entry) => dayKey(entry.createdAt) === dayKey());
  return <><PageHeading title="One more happy customer." subtitle="Choose a customer. Add their items. You’re done." actions={<Link className="button button-secondary" href="/entries"><NotebookPen size={16} />View entry history</Link>} /><div className="new-entry-tip"><ShieldCheck size={17} /><span>No payment needed at the counter. Every entry goes straight to the customer’s monthly bill.</span><kbd>Ctrl + Enter</kbd><span className="tip-shortcut">to save</span></div><div className="dashboard-grid new-entry-grid"><QuickEntry expanded /><div className="dashboard-side"><RecentEntries entries={today} /><BillingCallout /></div></div></>;
}
