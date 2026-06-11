import { Clock3, Footprints } from "lucide-react";
import { AGE_META, type Course } from "@/lib/data/types";

/** 선택된 코스의 페르소나 + 타이틀 + 요약 + 소요시간 헤더 카드 */
export default function CourseHeaderCard({ course }: { course: Course }) {
  const meta = AGE_META[course.age];
  return (
    <div
      className="paper-grain relative overflow-hidden rounded-2xl border border-river p-5 text-white shadow-[0_10px_28px_rgba(31,78,95,0.22)]"
      style={{ background: "linear-gradient(135deg, var(--naju-river) 0%, var(--naju-river-soft) 100%)" }}
    >
      {/* 배경 큰 글자 장식 */}
      <span
        aria-hidden
        className="brand-serif pointer-events-none absolute -right-2 -top-3 select-none text-[88px] font-extrabold leading-none text-white/10"
      >
        {course.age}
      </span>

      <div className="relative">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold">
          <span className="rounded-full bg-white/20 px-2.5 py-1 leading-none backdrop-blur">
            {meta.label} · {meta.persona}
          </span>
        </div>

        <h2 className="brand-serif mt-3 text-[22px] font-extrabold leading-snug tracking-tight">
          {course.title}
        </h2>

        <p className="mt-2 text-[13px] leading-relaxed text-white/85">
          {course.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-medium text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {course.duration}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Footprints className="size-3.5" />
            {meta.vibe}
          </span>
        </div>
      </div>
    </div>
  );
}
