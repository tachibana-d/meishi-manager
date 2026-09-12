"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AccountButton() {
  const client = supabase;
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (client) client.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  if (!client) return null;
  if (!email) return <Link href="/login" className="text-sm text-blue-600 font-medium">ログイン</Link>;
  return <button type="button" onClick={() => client.auth.signOut()} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"><LogOut size={14} />ログアウト</button>;
}
