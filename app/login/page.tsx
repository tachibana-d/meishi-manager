"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("");
    if (!supabase) return setMessage("Supabaseの環境変数が未設定です。");
    const result = register ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setMessage(result.error.message);
    if (register && !result.data.session) return setMessage("確認メールを送信しました。メール内のリンクを開いてください。");
    router.push("/");
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"><Link href="/" className="text-sm text-slate-400">← 名刺管理</Link><h1 className="text-2xl font-bold text-slate-800 mt-6 mb-1">{register ? "新規登録" : "ログイン"}</h1><p className="text-sm text-slate-500 mb-6">端末間で名刺を共有できます。</p><form onSubmit={submit} className="space-y-4"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メールアドレス" className="w-full px-3 py-2.5 border rounded-lg" /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード（6文字以上）" className="w-full px-3 py-2.5 border rounded-lg" />{message && <p className="text-sm text-red-500">{message}</p>}<button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold">{register ? "登録する" : "ログイン"}</button></form><button type="button" onClick={() => setRegister(!register)} className="w-full mt-4 text-sm text-blue-600">{register ? "ログインへ戻る" : "新規登録はこちら"}</button></div></main>;
}
