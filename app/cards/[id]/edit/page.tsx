"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCard } from "@/lib/storage";
import type { BusinessCard } from "@/lib/types";
import CardForm from "@/components/ui/CardForm";
import { use } from "react";

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<BusinessCard | null>(null);

  useEffect(() => {
    setCard(getCard(id));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href={`/cards/${id}`} className="text-slate-400 hover:text-slate-600 active:text-slate-800 transition-colors p-1 -ml-1 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-slate-800">名刺を編集</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        {card ? (
          <CardForm initialData={card} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-slate-400">読み込み中...</p>
          </div>
        )}
      </main>
    </div>
  );
}
