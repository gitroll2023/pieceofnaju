"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, UtensilsCrossed, X } from "lucide-react";
import { type Place } from "@/lib/data/types";
import PlaceThumb from "@/components/ui/PlaceThumb";
import CategoryBadge from "@/components/ui/CategoryBadge";

/**
 * 가이드 지도 위 하단 오버레이.
 * - 핀 선택 시: 대표메뉴가 보이는 미니 상세카드
 * - 미선택 시: 현재 필터의 장소들을 가로 스트립으로(탭 → 선택)
 * 지도를 가리지 않도록 wrapper는 pointer-events-none.
 */
export default function GuideSheet({
  selected,
  list,
  scopeLabel,
  onSelect,
  onClear,
}: {
  selected: Place | null;
  list: Place[];
  scopeLabel: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <SelectedCard key={selected.id} place={selected} onClear={onClear} />
        ) : (
          <BrowseStrip key="strip" list={list} scopeLabel={scopeLabel} onSelect={onSelect} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── 선택된 장소 미니 상세카드 ───── */
function SelectedCard({ place, onClear }: { place: Place; onClear: () => void }) {
  const signature = place.menu?.find((m) => m.signature) ?? place.menu?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      className="pointer-events-auto rounded-3xl border border-line bg-card p-3.5 shadow-[0_12px_32px_-12px_rgba(31,28,24,0.45)]"
    >
      <div className="flex gap-3.5">
        <PlaceThumb
          place={place}
          size="md"
          className="size-[84px] shrink-0 rounded-2xl"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={place.category} />
            <button
              type="button"
              onClick={onClear}
              aria-label="닫기"
              className="-mr-1 grid size-7 place-items-center rounded-full text-ink-soft active:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
          <h2 className="brand-serif truncate text-[18px] font-extrabold leading-tight text-ink">
            {place.name}
          </h2>
          <span className="inline-flex items-center gap-1 truncate text-[12px] text-ink-soft">
            <MapPin className="size-3 shrink-0" />
            {place.area}
          </span>
        </div>
      </div>

      {signature && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream px-3.5 py-2.5">
          <UtensilsCrossed className="size-4 shrink-0 text-pear-deep" />
          <span className="text-[11px] font-bold text-pear-deep">대표</span>
          <span className="truncate text-[13px] font-bold text-ink">
            {signature.name}
          </span>
          {signature.price && (
            <span className="ml-auto shrink-0 text-[12.5px] font-semibold text-pear-deep">
              {signature.price}
            </span>
          )}
        </div>
      )}

      <Link
        href={`/place/${place.id}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-river px-4 py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
      >
        자세히 보기
        <ArrowRight className="size-4" />
      </Link>
    </motion.div>
  );
}

/* ───── 미선택: 가로 장소 스트립 ───── */
function BrowseStrip({
  list,
  scopeLabel,
  onSelect,
}: {
  list: Place[];
  scopeLabel: string;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="pointer-events-auto"
    >
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-bold text-background">
          {scopeLabel} {list.length}곳
        </span>
        <span className="text-[11.5px] font-medium text-ink-soft drop-shadow-sm">
          핀이나 카드를 눌러보세요
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card px-4 py-5 text-center text-[13px] text-ink-soft">
          이 조건엔 아직 담아둔 곳이 없어요.
        </div>
      ) : (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {list.map((place) => {
            const sig = place.menu?.find((m) => m.signature) ?? place.menu?.[0];
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect(place.id)}
                className="flex w-[200px] shrink-0 gap-2.5 rounded-2xl border border-line bg-card p-2 text-left shadow-sm transition active:scale-[0.98]"
              >
                <PlaceThumb
                  place={place}
                  size="sm"
                  className="size-[58px] shrink-0 rounded-xl"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <CategoryBadge category={place.category} />
                  </div>
                  <h3 className="truncate text-[13.5px] font-bold text-ink">
                    {place.name}
                  </h3>
                  {sig && (
                    <p className="truncate text-[11.5px] font-medium text-pear-deep">
                      {sig.name}
                      {sig.price ? ` · ${sig.price}` : ""}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
