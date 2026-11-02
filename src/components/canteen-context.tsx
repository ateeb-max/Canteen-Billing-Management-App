"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import type { CanteenData, Customer, MenuItem, MutationResult } from "@/lib/types";

export type DialogState = { kind: "customer"; customer?: Customer; onSaved?: (id: number) => void } | { kind: "item"; item?: MenuItem } | { kind: "settings" } | { kind: "help" } | null;
interface ContextValue {
  data: CanteenData;
  mutate: (action: string, payload: Record<string, unknown>) => Promise<MutationResult>;
  notify: (message: string, error?: boolean) => void;
  dialog: DialogState;
  closeDialog: () => void;
  openCustomer: (customer?: Customer, onSaved?: (id: number) => void) => void;
  openItem: (item?: MenuItem) => void;
  openSettings: () => void;
  openHelp: () => void;
}
const CanteenContext = createContext<ContextValue | null>(null);
export function CanteenProvider({ initialData, children }: { initialData: CanteenData; children: ReactNode }) {
  const [data, setData] = useState(initialData);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setData(initialData); }, [initialData]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notify = useCallback((message: string, error = false) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  const mutate = useCallback(async (action: string, payload: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/canteen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Couldn't save your changes.");
      setData(body.data as CanteenData);
      return body.result as MutationResult;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Something went wrong. Please try again.", true);
      throw error;
    }
  }, [notify]);
  return <CanteenContext.Provider value={{ data, mutate, notify, dialog, closeDialog: () => setDialog(null), openCustomer: (customer, onSaved) => setDialog({ kind: "customer", customer, onSaved }), openItem: (item) => setDialog({ kind: "item", item }), openSettings: () => setDialog({ kind: "settings" }), openHelp: () => setDialog({ kind: "help" }) }}>{children}{toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role={toast.error ? "alert" : "status"}>{toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={16} /></button></div>}</CanteenContext.Provider>;
}
export function useCanteen() {
  const context = useContext(CanteenContext);
  if (!context) throw new Error("CanteenProvider is required");
  return context;
}
