"use client";

import { useState, useRef, useEffect, PointerEvent } from "react";
import { RotateCcw, RotateCw, X } from "lucide-react";

interface CropRect {
  x: number; // 0–1 relative to displayed image
  y: number;
  w: number;
  h: number;
}

type Handle = "tl" | "t" | "tr" | "r" | "br" | "b" | "bl" | "l" | "move";

interface Props {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const DEFAULT_CROP: CropRect = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };

export default function ImageEditor({ src, onConfirm, onCancel }: Props) {
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgEl = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ handle: Handle; sx: number; sy: number; sc: CropRect } | null>(null);

  // Draw rotated image onto canvas
  function draw(img: HTMLImageElement, rot: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const is90 = rot === 90 || rot === 270;
    const iw = is90 ? img.naturalHeight : img.naturalWidth;
    const ih = is90 ? img.naturalWidth : img.naturalHeight;
    const maxW = 620;
    const maxH = 400;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    canvas.width = Math.round(iw * scale);
    canvas.height = Math.round(ih * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    if (is90) {
      ctx.drawImage(img, -img.naturalHeight * scale / 2, -img.naturalWidth * scale / 2, img.naturalHeight * scale, img.naturalWidth * scale);
    } else {
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => { imgEl.current = img; draw(img, 0); };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (imgEl.current) {
      draw(imgEl.current, rotation);
      setCrop(DEFAULT_CROP);
    }
  }, [rotation]);

  // Pointer position relative to canvas (0–1)
  function rel(e: PointerEvent<HTMLDivElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
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
    if (nearT && nearL) return "tl";
    if (nearT && nearR) return "tr";
    if (nearB && nearL) return "bl";
    if (nearB && nearR) return "br";
    if (nearT && inX) return "t";
    if (nearB && inX) return "b";
    if (nearL && inY) return "l";
    if (nearR && inY) return "r";
    const inner = pos.x > c.x + tol && pos.x < c.x + c.w - tol && pos.y > c.y + tol && pos.y < c.y + c.h - tol;
    if (inner) return "move";
    return null;
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    const pos = rel(e);
    const h = hitHandle(pos, crop);
    if (!h) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { handle: h, sx: pos.x, sy: pos.y, sc: { ...crop } };
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const { handle: h, sx, sy, sc } = drag.current;
    const pos = rel(e);
    const dx = pos.x - sx;
    const dy = pos.y - sy;
    const min = 0.08;
    setCrop(() => {
      let { x, y, w, h: hh } = sc;
      if (h === "move") {
        x = Math.max(0, Math.min(1 - w, x + dx));
        y = Math.max(0, Math.min(1 - hh, y + dy));
      }
      if (h.includes("l")) { const nx = Math.max(0, Math.min(x + w - min, x + dx)); w = w + x - nx; x = nx; }
      if (h.includes("r")) { w = Math.max(min, Math.min(1 - x, w + dx)); }
      if (h.includes("t")) { const ny = Math.max(0, Math.min(y + hh - min, y + dy)); hh = hh + y - ny; y = ny; }
      if (h.includes("b")) { hh = Math.max(min, Math.min(1 - y, hh + dy)); }
      return { x, y, w, h: hh };
    });
  }

  function onUp() { drag.current = null; }

  function setPreset(ratio: number | null) {
    if (ratio === null) { setCrop({ x: 0, y: 0, w: 1, h: 1 }); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRatio = canvas.width / canvas.height;
    let w, h;
    if (ratio > canvasRatio) { w = 0.9; h = (w / ratio) * canvasRatio; }
    else { h = 0.9; w = (h * ratio) / canvasRatio; }
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
  }

  function confirm() {
    const img = imgEl.current;
    if (!img) return;
    const is90 = rotation === 90 || rotation === 270;
    const rw = is90 ? img.naturalHeight : img.naturalWidth;
    const rh = is90 ? img.naturalWidth : img.naturalHeight;

    // Rotated full image
    const tmp = document.createElement("canvas");
    tmp.width = rw; tmp.height = rh;
    const tc = tmp.getContext("2d")!;
    tc.save();
    tc.translate(rw / 2, rh / 2);
    tc.rotate((rotation * Math.PI) / 180);
    tc.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    tc.restore();

    // Crop
    const cx = Math.round(crop.x * rw);
    const cy = Math.round(crop.y * rh);
    const cw = Math.round(crop.w * rw);
    const ch = Math.round(crop.h * rh);
    const out = document.createElement("canvas");
    out.width = cw; out.height = ch;
    out.getContext("2d")!.drawImage(tmp, cx, cy, cw, ch, 0, 0, cw, ch);
    onConfirm(out.toDataURL("image/jpeg", 0.92));
  }

  const c = crop;
  const cursors: Record<Handle, string> = {
    tl: "nw-resize", t: "n-resize", tr: "ne-resize",
    r: "e-resize", br: "se-resize", b: "s-resize",
    bl: "sw-resize", l: "w-resize", move: "move",
  };

  const corners: [Handle, number, number][] = [
    ["tl", c.x, c.y], ["tr", c.x + c.w, c.y],
    ["bl", c.x, c.y + c.h], ["br", c.x + c.w, c.y + c.h],
  ];
  const edges: [Handle, number, number][] = [
    ["t", c.x + c.w / 2, c.y], ["b", c.x + c.w / 2, c.y + c.h],
    ["l", c.x, c.y + c.h / 2], ["r", c.x + c.w, c.y + c.h / 2],
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">画像を編集</h3>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="bg-slate-900 flex items-center justify-center p-3 sm:p-4">
          <div
            className="relative inline-block select-none touch-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <canvas ref={canvasRef} className="block max-w-full" style={{ maxHeight: 380 }} />

            {/* Dark masks */}
            <div className="absolute bg-black/55 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: `${c.y * 100}%` }} />
            <div className="absolute bg-black/55 pointer-events-none" style={{ top: `${(c.y + c.h) * 100}%`, left: 0, right: 0, bottom: 0 }} />
            <div className="absolute bg-black/55 pointer-events-none" style={{ top: `${c.y * 100}%`, bottom: `${(1 - c.y - c.h) * 100}%`, left: 0, width: `${c.x * 100}%` }} />
            <div className="absolute bg-black/55 pointer-events-none" style={{ top: `${c.y * 100}%`, bottom: `${(1 - c.y - c.h) * 100}%`, left: `${(c.x + c.w) * 100}%`, right: 0 }} />

            {/* Crop border + grid */}
            <div className="absolute border-2 border-white/90 pointer-events-none" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.w * 100}%`, height: `${c.h * 100}%` }}>
              <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "33.33% 33.33%" }} />
            </div>

            {/* Corner handles */}
            {corners.map(([pos, hx, hy]) => (
              <div key={pos} className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-sm shadow"
                style={{ left: `${hx * 100}%`, top: `${hy * 100}%`, transform: "translate(-50%,-50%)", cursor: cursors[pos] }} />
            ))}

            {/* Edge handles */}
            {edges.map(([pos, hx, hy]) => (
              <div key={pos} className="absolute bg-white border border-blue-400 rounded-sm shadow opacity-80"
                style={{
                  left: `${hx * 100}%`, top: `${hy * 100}%`,
                  transform: "translate(-50%,-50%)",
                  width: pos === "t" || pos === "b" ? 24 : 8,
                  height: pos === "l" || pos === "r" ? 24 : 8,
                  cursor: cursors[pos],
                }} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-slate-600 shrink-0">回転</span>
            <div className="flex gap-2">
              <button onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <RotateCcw size={14} /> 左90°
              </button>
              <button onClick={() => setRotation(r => (r + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <RotateCw size={14} /> 右90°
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-600 shrink-0">比率</span>
            <button onClick={() => setPreset(1.75)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">名刺 (1.75:1)</button>
            <button onClick={() => setPreset(1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">正方形</button>
            <button onClick={() => setPreset(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">全体</button>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              キャンセル
            </button>
            <button onClick={confirm} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
