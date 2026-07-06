"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Lightbox({
  images, startIndex = 0, onClose,
}: {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  if (images.length === 0) return null;
  const prev = () => setI((v) => (v - 1 + images.length) % images.length);
  const next = () => setI((v) => (v + 1) % images.length);

  return createPortal(
    <div className="fixed inset-0 z-[3600] flex flex-col bg-black/95" onClick={onClose}>
      <button type="button" onClick={onClose}
        className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white active:scale-90">
        <X className="size-5" />
      </button>
      <div className="relative flex flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button type="button" onClick={prev}
            className="absolute left-2 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white active:scale-90">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 && (
          <button type="button" onClick={next}
            className="absolute right-2 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white active:scale-90">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <p className="pb-6 text-center text-[12.5px] font-bold text-white/70">{i + 1} / {images.length}</p>
      )}
    </div>,
    document.body,
  );
}
