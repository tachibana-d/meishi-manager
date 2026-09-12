"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { migrateLocalCards } from "@/lib/cloudStorage";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) await migrateLocalCards().catch(() => undefined);
      setLoggedIn(Boolean(data.user)); setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="py-24 text-center text-slate-400">読み込み中...</div>;
  if (!supabase) return <div className="py-24 text-center text-slate-500">Supabaseの設定が必要です。</div>;
  if (!loggedIn) return (
    <div className="py-24 text-center">
      <p className="text-slate-500 mb-4">名刺を管理するにはログインしてください。</p>
      <Link href="/login" className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">ログイン / 新規登録</Link>
    </div>
  );
  return <>{children}</>;
}
