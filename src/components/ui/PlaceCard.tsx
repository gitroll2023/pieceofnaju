import Link from "next/link";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { REGION_META, type Place } from "@/lib/data/types";
import CategoryBadge from "./CategoryBadge";
import PlaceThumb from "./PlaceThumb";

/** 가로형 장소 카드 — 가이드 리스트/코스 공용. 대표메뉴를 강조(평점 없음). */
export default function PlaceCard({ place }: { place: Place }) {
  const signature = place.menu?.find((m) => m.signature) ?? place.menu?.[0];
  const region = REGION_META[place.region];
  return (
    <Link
      href={`/place/${place.id}`}
      className="group flex gap-3 rounded-2xl border border-line bg-card p-2.5 transition active:scale-[0.99]"
    >
      <PlaceThumb place={place} size="sm" className="size-[92px] shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5 pr-1">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={place.category} />
          <span className="inline-flex items-center gap-0.5 truncate text-[11px] font-medium text-ink-soft">
            <MapPin className="size-3 shrink-0" />
            {region.label}
          </span>
        </div>
        <h3 className="truncate text-[15px] font-bold text-ink">{place.name}</h3>
        <p className="line-clamp-1 text-[12.5px] text-ink-soft">{place.tagline}</p>
        {signature && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px]">
            <UtensilsCrossed className="size-3 shrink-0 text-pear-deep" />
            <span className="truncate font-bold text-ink">{signature.name}</span>
            {signature.price && (
              <span className="ml-auto shrink-0 font-semibold text-pear-deep">
                {signature.price}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
