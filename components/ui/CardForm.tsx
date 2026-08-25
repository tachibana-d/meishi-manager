"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessCard, BusinessCardInput } from "@/lib/types";
import { saveCard, updateCard, getAllTags } from "@/lib/storage";
import TagInput from "./TagInput";
import PhotoUpload from "./PhotoUpload";

interface CardFormProps {
  initialData?: BusinessCard;
}

const emptyForm: BusinessCardInput = {
  name: "",
  nameKana: "",
  company: "",
  department: "",
  title: "",
  email: "",
  phone: "",
  mobile: "",
  address: "",
  website: "",
  photo: "",
  cardImage: "",
  tags: [],
  memo: "",
};

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400";

export default function CardForm({ initialData }: CardFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessCardInput>(
    initialData
      ? {
          name: initialData.name,
          nameKana: initialData.nameKana,
          company: initialData.company,
          department: initialData.department,
          title: initialData.title,
          email: initialData.email,
          phone: initialData.phone,
          mobile: initialData.mobile,
          address: initialData.address,
          website: initialData.website,
          photo: initialData.photo,
          cardImage: initialData.cardImage,
          tags: initialData.tags,
          memo: initialData.memo,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessCardInput, string>>>({});
  const allTags = getAllTags();

  function set<K extends keyof BusinessCardInput>(key: K, value: BusinessCardInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = "氏名は必須です";
    if (!form.company.trim()) newErrors.company = "会社名は必須です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (initialData) {
      updateCard(initialData.id, form);
      router.push(`/cards/${initialData.id}`);
    } else {
      const card = saveCard(form);
      router.push(`/cards/${card.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 名刺画像 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">名刺画像</h2>
        <PhotoUpload
          value={form.cardImage}
          onChange={(v) => set("cardImage", v)}
          label="名刺のスキャン・写真"
          aspectRatio="card"
        />
      </section>

      {/* 基本情報 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">基本情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="氏名" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="山田 太郎"
              className={inputCls}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </Field>
          <Field label="氏名（ふりがな）">
            <input
              type="text"
              value={form.nameKana}
              onChange={(e) => set("nameKana", e.target.value)}
              placeholder="やまだ たろう"
              className={inputCls}
            />
          </Field>
          <Field label="会社名" required>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="株式会社サンプル"
              className={inputCls}
            />
            {errors.company && <p className="text-red-500 text-xs">{errors.company}</p>}
          </Field>
          <Field label="部署">
            <input
              type="text"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              placeholder="営業部"
              className={inputCls}
            />
          </Field>
          <Field label="役職">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="部長"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* 連絡先 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">連絡先</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="メールアドレス">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="yamada@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="電話番号">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="03-1234-5678"
              className={inputCls}
            />
          </Field>
          <Field label="携帯番号">
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="090-1234-5678"
              className={inputCls}
            />
          </Field>
          <Field label="ウェブサイト">
            <input
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="住所">
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="東京都渋谷区..."
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* タグ・メモ */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">タグ・メモ</h2>
        <Field label="タグ">
          <TagInput tags={form.tags} onChange={(v) => set("tags", v)} suggestions={allTags} />
        </Field>
        <Field label="メモ">
          <textarea
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
            placeholder="出会いの経緯、商談内容など..."
            rows={4}
            className={inputCls + " resize-none"}
          />
        </Field>
      </section>

      {/* ボタン */}
      <div className="flex gap-3 justify-end pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          {initialData ? "更新する" : "保存する"}
        </button>
      </div>
    </form>
  );
}
