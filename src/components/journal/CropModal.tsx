"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { Check, X, ZoomIn } from "lucide-react";
import { cropAndCompress } from "@/lib/imagePrep";

export default function CropModal({
  imageSrc, aspect = 1, onCancel, onConfirm,
}: {
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => setAreaPixels(pixels), []);

  async function confirm() {
    if (!areaPixels) return;
    setWorking(true);
    try {
      const blob = await cropAndCompress(imageSrc, areaPixels);
      onConfirm(blob);
    } finally {
      setWorking(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[3600] flex flex-col bg-black">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          objectFit="cover"
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="flex items-center gap-3 bg-black/90 px-5 py-4">
        <ZoomIn className="size-4 shrink-0 text-white/60" />
        <input type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 accent-pear" />
      </div>
      <div className="flex items-center gap-2.5 bg-black px-5 pb-7 pt-1">
        <button type="button" onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/20 py-3.5 text-[14px] font-bold text-white active:scale-[0.98]">
          <X className="size-4" />취소
        </button>
        <button type="button" onClick={confirm} disabled={working || !areaPixels}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-pear py-3.5 text-[14px] font-extrabold text-[#2a1c06] active:scale-[0.98] disabled:opacity-50">
          <Check className="size-4" />{working ? "처리 중…" : "이 크기로 담기"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
