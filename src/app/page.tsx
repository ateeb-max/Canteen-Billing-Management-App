import CanteenApp from "@/components/canteen-app";
import { getData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getData();
  return <CanteenApp initialData={data} view="overview" />;
}
