import { notFound } from "next/navigation";
import CanteenApp from "@/components/canteen-app";
import { getData } from "@/lib/data";
import type { View } from "@/lib/types";

export const dynamic = "force-dynamic";
const views = ["new-entry", "customers", "monthly-bills", "rate-list", "entries"];

export default async function WorkspacePage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!views.includes(view)) notFound();
  const data = await getData();
  return <CanteenApp initialData={data} view={view as View} />;
}
