"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, RotateCw, X } from "lucide-react";

interface CropRect { x: number; y: number; w: number; h: number }
type Handle = "tl" | "t" | "tr" | "r" | "br" | "b" | "bl" | "l" | "move";

const DEFAULT_CROP: CropRect = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
const CURSORS: Record<Handle, string> = {
  tl: "nw-resize", t: "n-resize", tr: "ne-resize",
  r: "e-resize", br: "se-resize", b: "s-resize",
  bl: "sw-resize", l: "w-resize", move: "move",
};

function detectCardCrop(canvas: HTMLCanvasElement): CropRect {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || width < 20 || height < 20) return { ...DEFAULT_CROP };

  const image = ctx.getImageData(0, 0, width, height).data;
  const gray = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return 0.299 * image[i] + 0.587 * image[i + 1] + 0.114 * image[i + 2];
  };
  const verticalScore = (x: number) => {
    let score = 0;
    for (let y = Math.round(height * 0.12); y < height * 0.88; y += 2) {
      score += Math.abs(gray(x, y) - gray(Math.min(width - 1, x + 2), y));
    }
    return score;
  };
  const horizontalScore = (y: number) => {
    let score = 0;
    for (let x = Math.round(width * 0.12); x < width * 0.88; x += 2) {
      score += Math.abs(gray(x, y) - gray(x, Math.min(height - 1, y + 2)));
    }
    return score;
  };
  const best = (from: number, to: number, score: (index: number) => number) => {
    let index = from;
    let max = -1;
    for (let i = from; i <= to; i += 1) {
      const value = score(i);
      if (value > max) { max = value; index = i; }
    }
    return index;
  };

  const left = best(Math.round(width * 0.03), Math.round(width * 0.42), verticalScore);
  const right = best(Math.round(width * 0.58), Math.round(width * 0.97), verticalScore);
  const top = best(Math.round(height * 0.03), Math.round(height * 0.42), horizontalScore);
  const bottom = best(Math.round(height * 0.58), Math.round(height * 0.97), horizontalScore);
  const marginX = Math.max(2, Math.round(width * 0.008));
  const marginY = Math.max(2, Math.round(height * 0.008));
  const x = Math.max(0, left - marginX);
  const y = Math.max(0, top - marginY);
  const rightEdge = Math.min(width, right + marginX);
  const bottomEdge = Math.min(height, bottom + marginY);
  if (rightEdge - x < width * 0.25 || bottomEdge - y < height * 0.25) return { ...DEFAULT_CROP };
  return { x: x / width, y: y / height, w: (rightEdge - x) / width, h: (bottomEdge - y) / height };
}

interface Props {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ src, onConfirm, onCancel }: Props) {
  const [rotation, setRotation] = useState(0);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const imgEl = useRef<HTMLImageElement | null>(null);
  const imgCanvasRef = useRef<HTMLCanvasElement>(null);   // 画像描画用
  const ovCanvasRef = useRef<HTMLCanvasElement>(null);    // クロップUI描画用
  const cropRef = useRef<CropRect>({ ...DEFAULT_CROP });  // ドラッグ中の値（stateではなくref）
  const dragRef = useRef<{ handle: Handle; sx: number; sy: number; sc: CropRect } | null>(null);

  // ---- オーバーレイをcanvasに直接描画（React再レンダリングなし）----
  const drawOverlay = useCallback((c: CropRect) => {
    const ov = ovCanvasRef.current;
    if (!ov) return;
    const W = ov.width, H = ov.height;
    const ctx = ov.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    const x = c.x * W, y = c.y * H, w = c.w * W, h = c.h * H;

    // 暗いマスク（クロップ外）
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.clearRect(x, y, w, h);

    // クロップ枠
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // グリッド線（三分割法）
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + w * i / 3, y); ctx.lineTo(x + w * i / 3, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h * i / 3); ctx.lineTo(x + w, y + h * i / 3); ctx.stroke();
    }

    // コーナーハンドル
    const cs = 10;
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([hx, hy]) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(hx - cs / 2, hy - cs / 2, cs, cs);
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2; ctx.strokeRect(hx - cs / 2, hy - cs / 2, cs, cs);
    });

    // エッジハンドル
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = "#93c5fd"; ctx.lineWidth = 1;
    [[x + w / 2, y, 22, 7], [x + w / 2, y + h, 22, 7], [x, y + h / 2, 7, 22], [x + w, y + h / 2, 7, 22]].forEach(([hx, hy, hw, hh]) => {
      ctx.fillRect(hx - hw / 2, hy - hh / 2, hw, hh);
      ctx.strokeRect(hx - hw / 2, hy - hh / 2, hw, hh);
    });
  }, []);

  // ---- 画像をimgCanvasに描画 ----
  const drawImage = useCallback((img: HTMLImageElement, rot: number) => {
    const ic = imgCanvasRef.current;
    const ov = ovCanvasRef.current;
    if (!ic || !ov) return;
    const is90 = rot === 90 || rot === 270;
    const iw = is90 ? img.naturalHeight : img.naturalWidth;
    const ih = is90 ? img.naturalWidth : img.naturalHeight;
    const scale = Math.min(620 / iw, 400 / ih, 1);
    ic.width = ov.width = Math.round(iw * scale);
    ic.height = ov.height = Math.round(ih * scale);
    const ctx = ic.getContext("2d")!;
    ctx.save();
    ctx.translate(ic.width / 2, ic.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    if (is90) {
      ctx.drawImage(img, -img.naturalHeight * scale / 2, -img.naturalWidth * scale / 2, img.naturalHeight * scale, img.naturalWidth * scale);
    } else {
      ctx.drawImage(img, -ic.width / 2, -ic.height / 2, ic.width, ic.height);
    }
    ctx.restore();
    cropRef.current = detectCardCrop(ic);
    drawOverlay(cropRef.current);
  }, [drawOverlay]);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => { imgEl.current = img; drawImage(img, 0); };
    img.src = src;
  }, [src, drawImage]);

  useEffect(() => {
    if (imgEl.current) {
      cropRef.current = { ...DEFAULT_CROP };
      drawImage(imgEl.current, rotation);
    }
  }, [rotation, drawImage]);

  // ---- ポインター座標をcanvas上の比率（0–1）に変換 ----
  function rel(e: React.PointerEvent) {
    const r = ovCanvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  }

  function hitHandle(pos: { x: number; y: number }, c: CropRect): Handle | null {
    const tol = 0.04;
    const nearL = Math.abs(pos.x - c.x) < tol;
    const nearR = Math.abs(pos.x - (c.x + c.w)) < tol;
    const nearT = Math.abs(pos.y - c.y) < tol;
    const nearB = Math.abs(pos.y - (c.y + c.h)) < tol;
    const inX = pos.x >= c.x - tol && pos.x <= c.x + c.w + tol;
    const inY = pos.y >= c.y - tol && pos.y <= c.y + c.h + tol;
    if (nearT && nearL) return "tl"; if (nearT && nearR) return "tr";
    if (nearB && nearL) return "bl"; if (nearB && nearR) return "br";
    if (nearT && inX) return "t"; if (nearB && inX) return "b";
    if (nearL && inY) return "l"; if (nearR && inY) return "r";
    const inner = pos.x > c.x + tol && pos.x < c.x + c.w - tol && pos.y > c.y + tol && pos.y < c.y + c.h - tol;
    return inner ? "move" : null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const pos = rel(e);
    const h = hitHandle(pos, cropRef.current);
    if (!h) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { handle: h, sx: pos.x, sy: pos.y, sc: { ...cropRef.current } };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const pos = rel(e);

    // カーソル更新（ドラッグ中でなくても）
    if (!dragRef.current) {
      const h = hitHandle(pos, cropRef.current);
      e.currentTarget.style.cursor = h ? CURSORS[h] : "default";
      return;
    }

    const { handle: h, sx, sy, sc } = dragRef.current;
    const dx = pos.x - sx, dy = pos.y - sy;
    const min = 0.08;
    let { x, y, w } = sc, height = sc.h;

    if (h === "move") {
      x = Math.max(0, Math.min(1 - w, x + dx));
      y = Math.max(0, Math.min(1 - height, y + dy));
    }
    if (h.includes("l")) { const nx = Math.max(0, Math.min(x + w - min, x + dx)); w = w + x - nx; x = nx; }
    if (h.includes("r")) { w = Math.max(min, Math.min(1 - x, w + dx)); }
    if (h.includes("t")) { const ny = Math.max(0, Math.min(y + height - min, y + dy)); height = height + y - ny; y = ny; }
    if (h.includes("b")) { height = Math.max(min, Math.min(1 - y, height + dy)); }

    cropRef.current = { x, y, w, h: height };
    drawOverlay(cropRef.current); // React state を使わず直接描画
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    e.currentTarget.style.cursor = "default";
  }

  function setPreset(ratio: number | null) {
    if (ratio === null) {
      cropRef.current = { x: 0, y: 0, w: 1, h: 1 };
    } else {
      const ic = imgCanvasRef.current;
      if (!ic) return;
      const canvasRatio = ic.width / ic.height;
      let w, h;
      if (ratio > canvasRatio) { w = 0.9; h = (w / ratio) * canvasRatio; }
      else { h = 0.9; w = (h * ratio) / canvasRatio; }
      cropRef.current = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
    }
    drawOverlay(cropRef.current);
  }

  function confirm() {
    try {
      const img = imgEl.current;
      if (!img || !img.complete || !img.naturalWidth) {
        throw new Error("画像の読み込みが完了していません");
      }
      const c = cropRef.current;
      if (![c.x, c.y, c.w, c.h].every(Number.isFinite) || c.w <= 0 || c.h <= 0) {
        throw new Error("トリミング範囲が不正です");
      }
      const is90 = rotation === 90 || rotation === 270;
      const rw = is90 ? img.naturalHeight : img.naturalWidth;
      const rh = is90 ? img.naturalWidth : img.naturalHeight;

    // 回転済みの画像を一時canvasに描画
      const tmp = document.createElement("canvas");
      tmp.width = rw; tmp.height = rh;
      const tc = tmp.getContext("2d");
      if (!tc) throw new Error("画像変換に失敗しました");
      tc.save();
      tc.translate(rw / 2, rh / 2);
      tc.rotate((rotation * Math.PI) / 180);
      tc.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      tc.restore();

    // クロップして出力
      const cx = Math.round(c.x * rw), cy = Math.round(c.y * rh);
      const cw = Math.max(1, Math.round(c.w * rw)), ch = Math.max(1, Math.round(c.h * rh));
      const maxOutputSize = 1600;
      const outputScale = Math.min(1, maxOutputSize / Math.max(cw, ch));
      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(cw * outputScale));
      out.height = Math.max(1, Math.round(ch * outputScale));
      const outputContext = out.getContext("2d");
      if (!outputContext) throw new Error("画像変換に失敗しました");
      outputContext.imageSmoothingEnabled = true;
      outputContext.imageSmoothingQuality = "high";
      outputContext.drawImage(tmp, cx, cy, cw, ch, 0, 0, out.width, out.height);
      setConfirmError(null);
      onConfirm(out.toDataURL("image/jpeg", 0.82));
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "画像の確定に失敗しました");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">画像を編集</h3>
          <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* キャンバスエリア（画像 + オーバーレイを重ねて表示）*/}
        <div className="bg-slate-900 flex items-center justify-center p-3 sm:p-4">
          <div className="relative inline-block select-none">
            {/* 画像レイヤー */}
            <canvas ref={imgCanvasRef} className="block max-w-full" style={{ maxHeight: 380 }} />
            {/* クロップUIレイヤー（touch-noneでスクロールを抑制）*/}
            <canvas
              ref={ovCanvasRef}
              className="absolute inset-0 touch-none"
              style={{ maxHeight: 380, width: "100%", height: "100%" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
        </div>

        {/* コントロール */}
        <div className="relative z-10 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-slate-600 shrink-0">回転</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <RotateCcw size={14} /> 左90°
              </button>
              <button type="button" onClick={() => setRotation(r => (r + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <RotateCw size={14} /> 右90°
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-600 shrink-0">比率</span>
            <span className="text-xs text-blue-600">名刺範囲を自動検出済み</span>
            <button type="button" onClick={() => setPreset(1.75)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">名刺 (1.75:1)</button>
            <button type="button" onClick={() => setPreset(1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">正方形</button>
            <button type="button" onClick={() => setPreset(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">全体</button>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              キャンセル
            </button>
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); confirm(); }} className="relative z-20 flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm">
              確定
            </button>
          </div>
          {confirmError && <p role="alert" className="text-center text-xs text-red-500">{confirmError}</p>}
        </div>
      </div>
    </div>
  );
}
