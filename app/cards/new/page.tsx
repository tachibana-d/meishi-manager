import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CardForm from "@/components/ui/CardForm";

export default function NewCardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 active:text-slate-800 transition-colors p-1 -ml-1 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-slate-800">名刺を追加</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <CardForm />
      </main>
    </div>
  );
}
