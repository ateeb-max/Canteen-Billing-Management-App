import Link from "next/link";
import { ArrowLeft, Soup } from "lucide-react";
export default function NotFound() {
  return <main className="app-error"><span className="brand-icon"><Soup size={30} /></span><h1>A little off the menu.</h1><p>This page doesn’t exist. Let’s head back to your canteen.</p><Link href="/" className="button button-primary"><ArrowLeft size={16} />Back to overview</Link></main>;
}
