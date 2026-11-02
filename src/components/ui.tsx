"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Inbox, LoaderCircle, type LucideIcon } from "lucide-react";
import { initials } from "@/lib/format";

export function Avatar({ name, color = "peach", small = false }: { name: string; color?: string; small?: boolean }) {
  return <span className={`avatar avatar-${color}${small ? " avatar-small" : ""}`}>{initials(name)}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`}><span />{status}</span>;
}
export function PageHeading({ title, subtitle, actions, eyebrow }: { title: string; subtitle: string; actions?: ReactNode; eyebrow?: string }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
export function StatCard({ label, value, caption, icon: Icon, tone = "orange", positive = false }: { label: string; value: string | number; caption: ReactNode; icon: LucideIcon; tone?: string; positive?: boolean }) {
  return <section className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon tone-${tone}`}><Icon size={19} strokeWidth={1.7} /></div></div><strong className="stat-value">{value}</strong><div className={`stat-caption${positive ? " positive" : ""}`}>{caption}</div></section>;
}
export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon ?? <Inbox size={28} strokeWidth={1.4} />}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Spinner() { return <LoaderCircle className="spin" size={17} />; }

export function Modal({ title, subtitle, onClose, children, wide = false, className = "" }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    setMounted(true);
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab" && panel.current) {
        const elements = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea, [tabindex="0"]'));
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    const timeout = setTimeout(() => { if (!panel.current?.contains(document.activeElement)) panel.current?.focus(); }, 30);
    return () => { clearTimeout(timeout); document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", handler); previous?.focus(); };
  }, []);
  if (!mounted) return null;
  return createPortal(<div className={`modal-backdrop ${className}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={panel} tabIndex={-1} className={`modal-panel${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}><header className="modal-header"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></header>{children}</div></div>, document.body);
}

export function FoodArt({ kind, className = "" }: { kind: string; className?: string }) {
  const stroke = "#805c3e";
  return <svg viewBox="0 0 64 56" fill="none" aria-hidden="true" className={`food-art ${className}`} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === "tea" ? <><ellipse cx="30" cy="46" rx="24" ry="4" fill="#f4e5d5" stroke="none" /><path d="M16 22h28v12c0 9-6 12-14 12s-14-3-14-12V22Z" fill="#eeb57f" /><path d="M44 25h5a6 6 0 0 1 0 12h-6" /><ellipse cx="30" cy="22" rx="14" ry="3" fill="#fff2dc" /><ellipse cx="30" cy="22" rx="10" ry="1.5" fill="#ad7348" stroke="none" /><path d="M25 15c-5-5 5-6 0-11M35 14c-4-4 4-5 1-9" stroke="#beac97" /><path d="M20 28v6c0 4 2 6 5 7" stroke="#ffdfbb" strokeWidth="3" /></> :
    kind === "coffee" ? <><ellipse cx="31" cy="47" rx="18" ry="3" fill="#ede0d1" stroke="none" /><path d="m18 17 3 28h21l3-28" fill="#d6ae85" /><path d="m20 28 2 15h19l2-15" fill="#f7e2c5" stroke="none" /><path d="m22 35 1 8h17l1-8" fill="#b17f56" stroke="none" /><ellipse cx="31.5" cy="17" rx="13.5" ry="3.6" fill="#fff0d7" /><path d="M25 16c3-2 10-2 13 0M28 10c-4-4 4-4 1-8M36 10c-3-3 3-4 1-7" stroke="#b79a7e" /><path d="m25 24 1 15" stroke="white" strokeOpacity=".7" strokeWidth="2" /></> :
    kind === "samosa" ? <><ellipse cx="31" cy="46" rx="25" ry="4" fill="#eee5d4" stroke="none" /><path d="m12 42 12-27c1-2 3-3 5-1l19 27c1 2-1 4-3 4H15c-3 0-4-1-3-3Z" fill="#f4c476" /><path d="m28 14 2 25 18 3M13 41l17-2" stroke="#c39146" /><path d="m33 20 14-10c2-1 4 0 4 2l7 29c1 3-2 4-4 4h-7" fill="#f8d79a" /><path d="m48 12-1 23 9 7M21 29l2-2m-5 10 2-3m17-5 2 3m-2 4 1 2m12-13 1 3" stroke="#c28e43" /></> :
    kind === "poha" ? <><ellipse cx="32" cy="47" rx="23" ry="3" fill="#ece7da" stroke="none" /><path d="M10 28c2 12 8 18 22 18s21-6 23-18" fill="#e8d7bc" /><ellipse cx="32.5" cy="28" rx="22.5" ry="8" fill="#fff5dc" /><path d="M16 29c-1-6 8-12 17-12s18 5 18 12c-8 6-27 6-35 0Z" fill="#f3cf6a" stroke="#d4ab50" /><path d="m22 24 4 1m2-5 3 3m5-3 2 3m5 2 3 1m-11 4 3-2m-17 2 4 1" stroke="#e8b84f" strokeWidth="2" /><circle cx="24" cy="29" r="2" fill="#80976c" stroke="none" /><circle cx="38" cy="24" r="2" fill="#80976c" stroke="none" /><circle cx="44" cy="29" r="1.5" fill="#a76742" stroke="none" /><path d="m33 17 2-6 5 2-3 5" fill="#89a07d" stroke="#718c65" /></> :
    kind === "water" ? <><ellipse cx="32" cy="49" rx="15" ry="3" fill="#e1e9ea" stroke="none" /><path d="M27 9h10v7l6 7v22c0 4-22 4-22 0V23l6-7V9Z" fill="#d9eaf0" stroke="#7296a4" /><path d="M21 29h22v12H21z" fill="#f3f8f7" stroke="#7296a4" /><path d="M26 5h12v6H26z" fill="#9bbccc" stroke="#7296a4" /><path d="M33 31c-1 3-4 4-4 6a3 3 0 0 0 6 0c0-2-2-4-2-6Z" fill="#91bdca" stroke="none" /><path d="M25 25v-2l5-6M25 44h13" stroke="white" strokeWidth="2" /></> :
    kind === "dosa" ? <><ellipse cx="32" cy="34" rx="27" ry="16" fill="#e8eadd" stroke="#9fa78f" /><path d="m12 32 34-17c5-2 11 7 7 10L20 43c-6 1-12-7-8-11Z" fill="#e8bc79" /><path d="m16 33 30-15M20 38l30-17" stroke="#d4a162" /><path d="M12 32c6-3 12 7 8 11" /><ellipse cx="48" cy="39" rx="6" ry="4" fill="#e3ac75" /><ellipse cx="36" cy="43" rx="6" ry="4" fill="#f5efdd" /></> :
    kind === "idli" ? <><ellipse cx="31" cy="34" rx="26" ry="16" fill="#dde4d7" stroke="#99a890" /><ellipse cx="23" cy="27" rx="11" ry="7" fill="#fffaf0" stroke="#d0c7b4" /><ellipse cx="38" cy="28" rx="11" ry="7" fill="#fffaf0" stroke="#d0c7b4" /><ellipse cx="29" cy="38" rx="11" ry="7" fill="#fffaf0" stroke="#d0c7b4" /><circle cx="47" cy="39" r="6" fill="#dfaa70" stroke="#af865e" /><path d="m19 26 3-1m14 2 3-1m-14 11 4-1" stroke="#e1d8c7" /></> :
    kind === "biscuit" ? <><ellipse cx="32" cy="46" rx="23" ry="3" fill="#efe4d6" stroke="none" /><rect x="10" y="20" width="27" height="25" rx="4" fill="#e9c187" /><rect x="25" y="11" width="27" height="25" rx="4" fill="#f3d29e" transform="rotate(10 38 24)" /><path d="m32 18 12 2m-13 5 12 2m-24 1h8m-8 7h8" stroke="#bd965c" strokeDasharray="1 5" strokeWidth="2" /></> :
    <><ellipse cx="32" cy="33" rx="27" ry="19" fill="#e3e8dc" stroke="#9aa88c" /><ellipse cx="32" cy="33" rx="23" ry="15" stroke="#bbc5ac" /><circle cx="24" cy="36" r="10" fill="#e9c18c" stroke="#b9925f" /><path d="m20 32 3 1m2 5 2-1m-8 3 2-1m4-10 1 2" stroke="#bf9259" /><circle cx="43" cy="34" r="6" fill="#e9bb7d" stroke="#b49265" /><circle cx="35" cy="23" r="6" fill="#f4dfb4" stroke="#b49265" /><circle cx="46" cy="24" r="4" fill="#d5debd" stroke="#91a076" /><path d="m40 34 2-1m-9-10 3 1" stroke="#b58b50" /></>}
  </svg>;
}

export function ReceiptArt() {
  return <svg className="receipt-art" viewBox="0 0 120 130" fill="none" aria-hidden="true"><circle cx="66" cy="68" r="48" fill="#f2dec7" /><g transform="rotate(12 62 65)"><path d="M32 18h57v92l-7-4-7 4-7-4-7 4-7-4-7 4-7-4-8 4V18Z" fill="#fffdf8" stroke="#b58d66" strokeWidth="1.4" /><path d="M44 34h33M44 45h22M44 65h16m9 0h8M44 76h16m9 0h8M44 89h33" stroke="#c4ae94" strokeWidth="2" strokeLinecap="round" /><circle cx="81" cy="92" r="15" fill="#d6e4d0" stroke="#7d9671" /><path d="m74 92 5 5 9-10" stroke="#6f8965" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g><path d="m18 38-6-1m11-9-2-5m77 49 6 1m-9 10 4 4" stroke="#bb996e" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
