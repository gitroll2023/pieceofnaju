import { Quote } from "lucide-react";

/** 에디터 코멘트 — 큰 인용부호 + 세리프로 손편지 같은 느낌. */
export default function EditorQuote({ note }: { note: string }) {
  return (
    <section className="animate-rise px-4 pt-7">
      <figure className="relative rounded-2xl border border-line bg-cream/70 px-5 py-6 paper-grain">
        <Quote
          className="absolute left-4 top-4 size-6 fill-pear/25 stroke-pear/40"
          aria-hidden
        />
        <blockquote className="brand-serif relative pl-1 text-[16.5px] leading-loose text-ink">
          {note}
        </blockquote>
        <figcaption className="mt-3 text-right text-[12px] font-medium text-pear-deep">
          — 나주한조각 에디터
        </figcaption>
      </figure>
    </section>
  );
}
