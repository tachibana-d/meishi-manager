"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, User, Building2, Phone, Mail, Tag, Grid, List, X } from "lucide-react";
import type { BusinessCard } from "@/lib/types";
import { getCards } from "@/lib/storage";

export default function CardList() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const load = useCallback(() => setCards(getCards()), []);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags))).sort();

  const filtered = cards.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.nameKana.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchesTag = !activeTag || c.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });

  return (
    <>
      <div className="flex flex-col gap-3 pb-24 sm:pb-6">
        {/* 検索・操作バー */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前・会社名・メールで検索..."
              className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* グリッド/リスト切替 */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="グリッド表示"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="リスト表示"
            >
              <List size={16} />
            </button>
          </div>
          {/* デスクトップ用追加ボタン */}
          <Link
            href="/cards/new"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            <Plus size={16} />
            追加
          </Link>
        </div>

        {/* タグフィルター */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setActiveTag("")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                !activeTag
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 active:bg-slate-50"
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  activeTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 active:bg-slate-50"
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* 件数 */}
        <p className="text-xs text-slate-400">
          {filtered.length} 件{query || activeTag ? "（絞り込み中）" : ""}
        </p>

        {/* カード一覧 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <User className="text-slate-400" size={28} />
            </div>
            <p className="text-slate-500 font-medium">名刺がありません</p>
            <p className="text-slate-400 text-sm mt-1">「＋」ボタンから登録してください</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((card) => (
              <GridCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((card) => (
              <ListCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* モバイル用 FAB */}
      <Link
        href="/cards/new"
        className="sm:hidden fixed bottom-6 right-4 z-20 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg active:bg-blue-700 transition-colors"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        aria-label="名刺を追加"
      >
        <Plus size={24} />
      </Link>
    </>
  );
}

function GridCard({ card }: { card: BusinessCard }) {
  return (
    <Link href={`/cards/${card.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden active:border-blue-300 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
        {card.cardImage ? (
          <div className="w-full aspect-[1.75/1] relative bg-slate-50">
            <Image src={card.cardImage} alt="名刺" fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          </div>
        ) : (
          <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
            <Building2 className="text-slate-300" size={32} />
          </div>
        )}
        <div className="p-4">
          <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{card.name}</p>
          {card.nameKana && <p className="text-xs text-slate-400 mt-0.5">{card.nameKana}</p>}
          <p className="text-sm text-slate-500 mt-1 truncate">{card.company}</p>
          {card.title && <p className="text-xs text-slate-400 truncate">{card.title}</p>}
          {card.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {card.tags.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">
                  {t}
                </span>
              ))}
              {card.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-xs">
                  +{card.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ListCard({ card }: { card: BusinessCard }) {
  return (
    <Link href={`/cards/${card.id}`}>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 active:border-blue-300 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
          {card.photo ? (
            <Image src={card.photo} alt={card.name} width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <User className="text-blue-400" size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {card.name}
            </p>
            {card.nameKana && <span className="text-xs text-slate-400 truncate hidden sm:inline">{card.nameKana}</span>}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {[card.company, card.department, card.title].filter(Boolean).join(" · ")}
          </p>
          {card.tags.length > 0 && (
            <div className="flex gap-1 mt-1 sm:hidden">
              {card.tags.slice(0, 2).map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-400 shrink-0">
          {card.email && <Mail size={14} />}
          {card.phone && <Phone size={14} />}
          {card.tags.length > 0 && (
            <div className="flex gap-1">
              {card.tags.slice(0, 2).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
