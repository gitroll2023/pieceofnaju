import { CATEGORY_META, type Place } from "@/lib/data/types";

/**
 * 사진 대신 쓰는 브랜드 썸네일.
 * 카테고리 색 그라데이션 + 큰 이모지 + 옅은 종이 패턴으로
 * "손으로 만든" 에디토리얼 느낌을 낸다. (실사진 확보 시 교체)
 */
export default function PlaceThumb({
  place,
  className = "",
  size = "md",
}: {
  place: Place;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const meta = CATEGORY_META[place.category];
  const emojiSize =
    size === "lg" ? "text-6xl" : size === "sm" ? "text-3xl" : "text-5xl";
  return (
    <div
      className={`paper-grain relative grid place-items-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 120% at 25% 15%, color-mix(in oklab, ${meta.colorVar} 26%, white) 0%, color-mix(in oklab, ${meta.colorVar} 12%, var(--naju-cream)) 60%, color-mix(in oklab, ${meta.colorVar} 22%, var(--naju-cream)) 100%)`,
      }}
    >
      <span
        className="absolute -right-3 -top-3 size-20 rounded-full opacity-30"
        style={{ background: meta.colorVar }}
      />
      <span className={`relative drop-shadow-sm ${emojiSize}`}>{meta.emoji}</span>
    </div>
  );
}
