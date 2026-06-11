import { Quote } from "lucide-react";
import { getPlace } from "@/lib/data/places";
import PlaceCard from "@/components/ui/PlaceCard";
import type { Course } from "@/lib/data/types";

/** 코스 stops를 세로 타임라인으로. 왼쪽 time+연결선, 오른쪽 장소카드+추천 이유 */
export default function CourseTimeline({ course }: { course: Course }) {
  const stops = course.stops
    .map((stop) => ({ stop, place: getPlace(stop.placeId) }))
    .filter((s): s is { stop: Course["stops"][number]; place: NonNullable<ReturnType<typeof getPlace>> } => Boolean(s.place));

  return (
    <ol className="px-5">
      {stops.map(({ stop, place }, i) => {
        const last = i === stops.length - 1;
        return (
          <li key={`${stop.placeId}-${i}`} className="flex gap-3">
            {/* 왼쪽: 순번 점 + 연결선 + 시간 라벨 */}
            <div className="flex w-[58px] shrink-0 flex-col items-center">
              <div className="relative grid size-7 place-items-center rounded-full bg-river text-[12px] font-bold text-white shadow-[0_4px_10px_rgba(31,78,95,0.3)]">
                {i + 1}
              </div>
              {!last && (
                <div
                  className="mt-1 w-[2px] flex-1 rounded-full"
                  style={{ background: "linear-gradient(to bottom, color-mix(in oklab, var(--naju-river) 45%, transparent), var(--naju-line))" }}
                />
              )}
              <span className="mt-2 text-center text-[11px] font-semibold leading-tight text-pear-deep">
                {stop.time}
              </span>
            </div>

            {/* 오른쪽: 장소 카드 + 추천 이유 */}
            <div className={`min-w-0 flex-1 ${last ? "pb-1" : "pb-6"}`}>
              <PlaceCard place={place} />
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-cream px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
                <Quote className="mt-[3px] size-3.5 shrink-0 -scale-x-100 text-pear" />
                <span>{stop.why}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
