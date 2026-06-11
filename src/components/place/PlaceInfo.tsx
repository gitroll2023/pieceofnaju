import { MapPin, Clock, Navigation } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Place } from "@/lib/data/types";

/** 정보 — 주소·영업/이용·태그 + 카카오맵 길찾기 버튼. */
export default function PlaceInfo({ place }: { place: Place }) {
  // 카카오맵 길찾기: /link/to/{이름},{위도},{경도}
  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    place.name,
  )},${place.lat},${place.lng}`;

  return (
    <section className="px-4 pt-7">
      <div className="-mx-1">
        <SectionTitle eyebrow="INFORMATION" title="정보" />
      </div>

      <div className="mt-3 space-y-3 rounded-2xl border border-line bg-card p-4">
        {/* 주소 + 길찾기 */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-river" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-snug text-ink">{place.address}</p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-river px-3 py-1.5 text-[12.5px] font-semibold text-white transition active:scale-[0.97]"
            >
              <Navigation className="size-3.5" />
              카카오맵 길찾기
            </a>
          </div>
        </div>

        {/* 영업/이용 */}
        {place.hours && (
          <div className="flex items-start gap-3 border-t border-line pt-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-river" />
            <p className="text-[14px] leading-snug text-ink">{place.hours}</p>
          </div>
        )}

        {/* 태그 */}
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-cream px-2.5 py-1 text-[12px] font-medium text-ink-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
