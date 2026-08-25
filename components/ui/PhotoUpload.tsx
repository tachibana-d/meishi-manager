"use client";

import { useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

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

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const containerClass =
    aspectRatio === "card"
      ? "w-full aspect-[1.75/1]"
      : "w-32 h-32";

  return (
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            {aspectRatio === "card" ? (
              <Camera size={28} />
            ) : (
              <Upload size={24} />
            )}
            <span className="text-xs text-center px-2">
              {aspectRatio === "card" ? "名刺画像をアップロード" : "クリックまたはドラッグ"}
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={aspectRatio === "card" ? "environment" : undefined}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
