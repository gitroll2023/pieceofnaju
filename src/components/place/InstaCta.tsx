import { Camera, ArrowUpRight } from "lucide-react";

/** 하단 CTA — 인스타 @piece_of_naju 더보기. */
export default function InstaCta() {
  return (
    <section className="px-4 pt-8">
      <a
        href="https://instagram.com/piece_of_naju"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-2xl border border-line bg-river px-4 py-4 text-white transition active:scale-[0.99]"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15">
          <Camera className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-bold">나주의 더 많은 한조각 보기</p>
          <p className="text-[12.5px] text-white/75">@piece_of_naju 인스타그램</p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-white/80 transition group-active:translate-x-0.5" />
      </a>
    </section>
  );
}
