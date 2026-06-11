import SectionTitle from "@/components/ui/SectionTitle";
import KakaoMap from "@/components/map/KakaoMap";
import type { Place } from "@/lib/data/types";

/** 위치 — 이 장소 하나만 지도에 작게 표시. */
export default function PlaceLocation({ place }: { place: Place }) {
  return (
    <section className="px-4 pt-7">
      <div className="-mx-1">
        <SectionTitle eyebrow="LOCATION" title="위치" />
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line">
        <KakaoMap places={[place]} selectedId={place.id} className="h-48 w-full" />
      </div>
    </section>
  );
}
