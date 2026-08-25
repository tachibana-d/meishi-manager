"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Edit2, Trash2, Mail, Phone, Smartphone, Globe,
  MapPin, Building2, Tag, FileText, User, ExternalLink
} from "lucide-react";
import type { BusinessCard } from "@/lib/types";
import { getCard, deleteCard } from "@/lib/storage";

export default function CardDetail({ id }: { id: string }) {
  const router = useRouter();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setCard(getCard(id));
  }, [id]);

  if (!card) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">名刺が見つかりません</p>
      </div>
    );
  }

  function handleDelete() {
    deleteCard(id);
    router.push("/");
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* トップバー */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} />
          一覧へ戻る
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/cards/${id}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} />
            編集
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            削除
          </button>
        </div>
      </div>

      {/* 名刺画像 */}
      {card.cardImage && (
        <div className="w-full aspect-[1.75/1] relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <Image src={card.cardImage} alt="名刺" fill className="object-cover" />
        </div>
      )}

      {/* メインカード */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
            {card.photo ? (
              <Image src={card.photo} alt={card.name} width={56} height={56} className="object-cover" />
            ) : (
              <User className="text-blue-400" size={24} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{card.name}</h1>
            {card.nameKana && <p className="text-sm text-slate-400 mt-0.5">{card.nameKana}</p>}
            <div className="flex items-center gap-2 mt-2 text-slate-600">
              <Building2 size={14} className="text-slate-400" />
              <span className="font-medium">{card.company}</span>
              {card.department && <span className="text-slate-400">·</span>}
              {card.department && <span className="text-slate-500">{card.department}</span>}
            </div>
            {card.title && (
              <p className="text-sm text-slate-400 mt-0.5 ml-[22px]">{card.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* 連絡先 */}
      {(card.email || card.phone || card.mobile || card.website || card.address) && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {card.email && (
            <ContactRow
              icon={<Mail size={16} className="text-slate-400" />}
              label="メール"
              value={card.email}
              href={`mailto:${card.email}`}
            />
          )}
          {card.phone && (
            <ContactRow
              icon={<Phone size={16} className="text-slate-400" />}
              label="電話"
              value={card.phone}
              href={`tel:${card.phone}`}
            />
          )}
          {card.mobile && (
            <ContactRow
              icon={<Smartphone size={16} className="text-slate-400" />}
              label="携帯"
              value={card.mobile}
              href={`tel:${card.mobile}`}
            />
          )}
          {card.website && (
            <ContactRow
              icon={<Globe size={16} className="text-slate-400" />}
              label="ウェブ"
              value={card.website}
              href={card.website}
              external
            />
          )}
          {card.address && (
            <ContactRow
              icon={<MapPin size={16} className="text-slate-400" />}
              label="住所"
              value={card.address}
            />
          )}
        </div>
      )}

      {/* タグ */}
      {card.tags.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-slate-400" />
            <h3 className="text-sm font-medium text-slate-600">タグ</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* メモ */}
      {card.memo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-slate-400" />
            <h3 className="text-sm font-medium text-slate-600">メモ</h3>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{card.memo}</p>
        </div>
      )}

      {/* 日時 */}
      <p className="text-xs text-slate-400 text-center">
        登録: {formatDate(card.createdAt)} · 更新: {formatDate(card.updatedAt)}
      </p>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 text-lg mb-2">名刺を削除しますか？</h3>
            <p className="text-sm text-slate-500 mb-6">
              「{card.name}」の名刺を削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

function ContactRow({ icon, label, value, href, external }: ContactRowProps) {
  const content = (
    <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate group-hover:text-blue-600 transition-colors">{value}</p>
      </div>
      {href && <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />}
    </div>
  );

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        {content}
      </a>
    );
  }
  return <div>{content}</div>;
}
