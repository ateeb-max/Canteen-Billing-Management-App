"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Hash, Search, UserRound, ReceiptText, ShieldCheck, TriangleAlert } from "lucide-react";
import { useCanteen } from "./canteen-context";
import { Modal, Spinner } from "./ui";
import { customerCode, itemCode } from "@/lib/format";
import type { Customer, MenuItem } from "@/lib/types";

export function Dialogs() {
  const { dialog, closeDialog } = useCanteen();
  if (!dialog) return null;
  if (dialog.kind === "customer") return <CustomerDialog key={dialog.customer?.id ?? "new"} customer={dialog.customer} onSaved={dialog.onSaved} />;
  if (dialog.kind === "item") return <ItemDialog key={dialog.item?.id ?? "new"} item={dialog.item} />;
  if (dialog.kind === "settings") return <SettingsDialog />;
  return <Modal title="A simpler way to run your canteen" subtitle="Three small steps. Everything taken care of." onClose={closeDialog}><div className="modal-body help-steps"><div className="help-step"><span className="help-step-icon tone-orange"><UserRound size={23} /></span><div><span className="eyebrow">STEP 01</span><h3>Find your customer</h3><p>Search a name or customer ID, like C001. New customer? Add their name and we’ll assign an ID.</p></div></div><div className="help-step"><span className="help-step-icon tone-sage"><Search size={23} /></span><div><span className="eyebrow">STEP 02</span><h3>Add what they had</h3><p>Tap an item, or type its serial number and press Enter. Set the quantity, then save the entry.</p></div></div><div className="help-step"><span className="help-step-icon tone-purple"><ReceiptText size={23} /></span><div><span className="eyebrow">STEP 03</span><h3>One month. One simple bill.</h3><p>Open Monthly bills, choose a month, and print or download a customer’s bill. Record payments as they come in.</p></div></div><div className="keyboard-guide"><span><kbd>N</kbd> New entry</span><span><kbd>/</kbd> Search items</span><span><kbd>Esc</kbd> Close dialog</span></div><p className="demo-note"><ShieldCheck size={16} />Pre-feeded rate list is loaded in PKR. All customer records and monthly bills start fresh from your real entries.</p></div><div className="modal-footer"><button className="button button-primary" onClick={closeDialog}>Got it, let’s get started <ArrowRight size={16} /></button></div></Modal>;
}
function CustomerDialog({ customer, onSaved }: { customer?: Customer; onSaved?: (id: number) => void }) {
  const { mutate, notify, closeDialog } = useCanteen();
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try {
      const result = await mutate("save-customer", { id: customer?.id, name, phone });
      notify(customer ? "Customer details updated." : `${name.trim()} added as ${customerCode(result.id as number)}.`);
      onSaved?.(result.id as number); closeDialog();
    } catch {} finally { setPending(false); }
  }
  return <Modal title={customer ? "Edit customer" : "A new face at the canteen"} subtitle={customer ? `Update the details for ${customerCode(customer.id)}.` : "Just a name to get started. We’ll take care of the ID."} onClose={closeDialog}><form onSubmit={submit}><div className="modal-body form-stack"><div className="field"><label htmlFor="customer-name">Customer name <span>*</span></label><input id="customer-name" autoFocus autoComplete="name" placeholder="e.g. Tariq Mehmood" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></div><div className="field"><label htmlFor="customer-phone">Phone number <span className="optional">Optional</span></label><input id="customer-phone" type="tel" autoComplete="tel" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={25} /></div><div className="info-strip"><Hash size={17} /><span>{customer ? `Customer ID: ${customerCode(customer.id)}. This stays the same.` : "A unique customer ID will be created automatically."}</span></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={closeDialog}>Cancel</button><button className="button button-primary" disabled={pending}>{pending ? <Spinner /> : <Check size={16} />}{customer ? "Save changes" : "Add customer"}</button></div></form></Modal>;
}
function ItemDialog({ item }: { item?: MenuItem }) {
  const { mutate, notify, closeDialog } = useCanteen();
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.pricePaise / 100) : "");
  const [category, setCategory] = useState(item?.category ?? "Drinks");
  const [popular, setPopular] = useState(item?.popular ?? false);
  const [active, setActive] = useState(item?.active ?? true);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try { await mutate("save-item", { id: item?.id, name, pricePaise: Math.round(Number(price) * 100), category, popular, active }); notify(item ? "Rate list updated. Previous entries keep their original prices." : `${name.trim()} added to the rate list.`); closeDialog(); } catch {} finally { setPending(false); }
  }
  return <Modal title={item ? `Edit item #${itemCode(item.id)}` : "Add to your rate list"} subtitle="Simple prices. Quicker entries." onClose={closeDialog}><form onSubmit={submit}><div className="modal-body form-stack"><div className="field"><label htmlFor="item-name">Item name <span>*</span></label><input id="item-name" autoFocus placeholder="e.g. Masala tea" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div><div className="form-grid"><div className="field"><label htmlFor="item-price">Price (PKR) <span>*</span></label><input id="item-price" type="number" min="0.01" max="10000" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required /></div><div className="field"><label htmlFor="item-category">Category</label><select id="item-category" value={category} onChange={(e) => setCategory(e.target.value)}><option>Drinks</option><option>Snacks</option><option>Meals</option></select></div></div><label className="checkbox-field"><input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /><span><strong>Show in Popular items</strong><small>Keep your everyday favourites one tap away.</small></span></label>{item && <label className="checkbox-field"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><strong>Available at the counter</strong><small>Turn off to hide this item without losing old records.</small></span></label>}<div className="info-strip"><ShieldCheck size={17} /><span>Price changes only apply to new entries.</span></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={closeDialog}>Cancel</button><button className="button button-primary" disabled={pending}>{pending ? <Spinner /> : <Check size={16} />}{item ? "Save changes" : "Add item"}</button></div></form></Modal>;
}
function SettingsDialog() {
  const { data, mutate, notify, closeDialog } = useCanteen();
  const [form, setForm] = useState(data.settings);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const update = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try { await mutate("save-settings", { ...form }); notify("Your canteen details have been updated."); closeDialog(); } catch {} finally { setPending(false); }
  }
  async function reset() {
    setPending(true);
    try { await mutate("reset-records", { confirmation }); notify("A fresh start. Your rate list and canteen details are kept."); closeDialog(); } catch {} finally { setPending(false); }
  }
  return <Modal title="Your canteen, your details" subtitle="These details also appear on customer bills." onClose={closeDialog}><form onSubmit={submit}><div className="modal-body form-stack"><div className="field"><label htmlFor="shop-name">Canteen name</label><input id="shop-name" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={80} /></div><div className="form-grid"><div className="field"><label htmlFor="owner-name">Owner name</label><input id="owner-name" value={form.owner} onChange={(e) => update("owner", e.target.value)} required maxLength={80} /></div><div className="field"><label htmlFor="shop-phone">Phone number</label><input id="shop-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={25} /></div></div><div className="field"><label htmlFor="shop-address">Address</label><textarea id="shop-address" rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={200} /></div><details className="danger-zone"><summary><TriangleAlert size={15} /> Start fresh / clear records</summary><p>This permanently removes all customers, entries, payments, and bills. Your rate list and canteen details stay. This cannot be undone.</p><div className="reset-controls"><input aria-label="Type RESET to confirm" placeholder="Type RESET to confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /><button type="button" className="button button-danger" disabled={confirmation !== "RESET" || pending} onClick={reset}>Clear records</button></div></details></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={closeDialog}>Cancel</button><button className="button button-primary" disabled={pending}>{pending ? <Spinner /> : <Check size={16} />}Save details</button></div></form></Modal>;
}
