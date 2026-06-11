import { Sparkles, Info } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Place } from "@/lib/data/types";

/** 대표 메뉴 — 없으면 이용 안내 카드로 대체. */
export default function MenuList({ place }: { place: Place }) {
  const menu = place.menu;

  if (!menu || menu.length === 0) {
    return (
      <section className="px-4 pt-7">
        <div className="-mx-1">
          <SectionTitle eyebrow="MENU & INFO" title="이용 안내" />
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4 text-[13.5px] leading-relaxed text-ink-soft">
          <Info className="mt-0.5 size-4 shrink-0 text-river" />
          <p>
            정해진 메뉴판보다 발길 따라 즐기는 곳이에요.
            {place.hours ? ` ${place.hours} 기준으로 ` : " "}
            여유롭게 둘러보길 권합니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-7">
      <div className="-mx-1">
        <SectionTitle eyebrow="MENU" title="대표 메뉴" />
      </div>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {menu.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3 px-4 py-3.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[14.5px] font-semibold text-ink">
                {item.name}
              </span>
              {item.signature && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pear/15 px-2 py-0.5 text-[10.5px] font-bold text-pear-deep">
                  <Sparkles className="size-3" />
                  대표
                </span>
              )}
            </div>
            {item.price && (
              <span className="shrink-0 text-[13.5px] font-medium tabular-nums text-ink-soft">
                {item.price}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
