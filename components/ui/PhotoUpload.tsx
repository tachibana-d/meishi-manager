"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, Edit2 } from "lucide-react";
import Image from "next/image";
import ImageEditor from "./ImageEditor";

interface PhotoUploadProps {
  value: string;
  onChange: (base64: string) => void;
  label?: string;
  aspectRatio?: "square" | "card";
}

export default function PhotoUpload({
  value,
  onChange,
  label = "写真",
  aspectRatio = "square",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditing(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleConfirm(dataUrl: string) {
    onChange(dataUrl);
    setEditing(null);
  }

  const containerClass = aspectRatio === "card" ? "w-full aspect-[1.75/1]" : "w-32 h-32";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div
          className={`${containerClass} relative rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" />
              {/* 編集・削除ボタン */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(value);
                  }}
                  className="bg-white text-slate-700 rounded-full p-2 shadow-md hover:bg-blue-50 transition-colors"
                  title="編集"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  className="bg-white text-red-500 rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                  title="削除"
                >
                  <X size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
              {aspectRatio === "card" ? <Camera size={28} /> : <Upload size={24} />}
              <span className="text-xs text-center px-2">
                {aspectRatio === "card" ? "名刺画像をアップロード" : "クリックまたはドラッグ"}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400">
          アップロード後に回転・トリミングができます
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={aspectRatio === "card" ? "environment" : undefined}
        onChange={handleChange}
        className="hidden"
      />

      {editing && (
        <ImageEditor
          src={editing}
          onConfirm={handleConfirm}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  );
}
