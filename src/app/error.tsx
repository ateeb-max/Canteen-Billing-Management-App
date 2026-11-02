"use client";
import { Soup, RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="app-error"><span className="brand-icon"><Soup size={30} /></span><h1>Let’s give that another try.</h1><p>We couldn’t load your canteen records just now. Your saved entries are still safe.</p><button className="button button-primary" onClick={reset}><RotateCcw size={16} />Try again</button></main>;
}
