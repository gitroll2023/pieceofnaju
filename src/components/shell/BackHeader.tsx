"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackHeader({
  title,
  transparent = false,
}: {
  title?: string;
  transparent?: boolean;
}) {
  const router = useRouter();
  return (
    <header
      className={`sticky top-0 z-30 flex h-13 items-center gap-1 px-2 ${
        transparent
          ? "bg-transparent"
          : "border-b border-line bg-background/85 backdrop-blur"
      }`}
      style={{ height: 52 }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="grid size-9 place-items-center rounded-full text-ink active:bg-muted"
      >
        <ChevronLeft className="size-6" />
      </button>
      {title && (
        <h1 className="truncate text-[15px] font-bold text-ink">{title}</h1>
      )}
    </header>
  );
}
