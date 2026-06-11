import { MapPin } from "lucide-react";
import { REGION_META, type Place } from "@/lib/data/types";
import PlaceThumb from "@/components/ui/PlaceThumb";
import CategoryBadge from "@/components/ui/CategoryBadge";

/** 상세 히어로 — 큰 브랜드 썸네일 위에 카테고리·이름·동네를 얹는다. */
export default function PlaceHero({ place }: { place: Place }) {
  return (
    <section className="animate-rise px-4 pt-1">
      <div className="relative h-56 overflow-hidden rounded-2xl border border-line">
        <PlaceThumb place={place} size="lg" className="absolute inset-0 h-full w-full" />
        {/* 전체를 은은히 + 아래를 진하게 깔아 흰 글자 가독성 확보 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.04) 70%, transparent 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4 text-white">
          <CategoryBadge category={place.category} />
          <h1 className="brand-serif text-[26px] font-extrabold leading-tight drop-shadow-md">
            {place.name}
          </h1>
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold drop-shadow-sm">
            <MapPin className="size-3.5" />
            {REGION_META[place.region].label} · {REGION_META[place.region].admin}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
        {place.tagline}
      </p>
    </section>
  );
}
