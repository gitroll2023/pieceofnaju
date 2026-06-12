"use client";

import Link from "next/link";
import { MapPin, Footprints, Coffee, Compass, ChevronRight } from "lucide-react";
import HamburgerButton from "@/components/shell/HamburgerButton";
import InstaGlyph from "@/components/ui/InstaGlyph";

const INSTA = "https://instagram.com/piece_of_naju";

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100dvh_-_72px)] bg-background pb-12">
      {/* 헤더 */}
      <header className="paper-grain relative overflow-hidden px-5 pb-8 pt-6">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "linear-gradient(150deg, var(--naju-cream) 0%, var(--background) 70%)" }} />
        <HamburgerButton />
        <p className="mt-5 text-[12px] font-bold tracking-wide text-pear-deep">나주한조각 이야기</p>
        <h1 className="brand-serif mt-2 text-[30px] font-extrabold leading-[1.25] text-ink" style={{ wordBreak: "keep-all", textWrap: "balance" }}>
          나주 와서, <br />뭐 하지?
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft" style={{ wordBreak: "keep-all" }}>
          그 고민 하나 덜어주고 싶어서 시작했어요.<br />
          나주를 <b className="text-ink">한 조각씩</b>, 천천히 모았습니다.
        </p>
      </header>

      {/* 본문 */}
      <div className="space-y-7 px-5 pt-7">
        <section>
          <h2 className="brand-serif text-[19px] font-extrabold text-ink">처음 오면 막막하잖아요</h2>
          <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-soft" style={{ wordBreak: "keep-all" }}>
            곰탕 한 그릇은 어디서 먹지, 카페는, 아이랑 갈 만한 곳은, 비 오는 날엔 뭘 하지 —
            검색해도 광고만 잔뜩이고 정작 ‘진짜 좋은 곳’은 잘 안 보여요.
            나주한조각은 그 사이를 메우려고 만든, <b className="text-ink">작고 컴팩트한 나주 안내서</b>예요.
          </p>
        </section>

        <section>
          <h2 className="brand-serif text-[19px] font-extrabold text-ink">나주시가 만든 게 아니에요</h2>
          <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-soft" style={{ wordBreak: "keep-all" }}>
            지자체나 기관에서 운영하는 페이지가 아니에요. 지원을 받고 만든 것도 아니고요.
            인스타그램 <b className="text-hongeo">@piece_of_naju</b> 한 사람이,
            가게 사장님들과 직접 이야기 나누고 발로 다녀보며 모은 기록이에요.
            그래서 큰 곳보다 <b className="text-ink">동네에 진짜 있는 곳들</b>이 더 많아요.
          </p>
        </section>

        <section>
          <h2 className="brand-serif text-[19px] font-extrabold text-ink">누구한테든 도움이 되게</h2>
          <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-soft" style={{ wordBreak: "keep-all" }}>
            처음 온 관광객도, 오랜만에 들른 타지 사람도, 나주에 사는 분도 —
            연령대와 상황에 맞게 ‘오늘 뭘 하면 좋을지’ 바로 떠올릴 수 있게 정리했어요.
            먹거리·마실거리·볼거리·즐길거리·체험거리, 그리고 지금 나주에서 열리는 행사까지.
          </p>
        </section>

        <section>
          <h2 className="brand-serif text-[19px] font-extrabold text-ink">발로 뛰고, AI의 손도 빌렸어요</h2>
          <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-soft" style={{ wordBreak: "keep-all" }}>
            직접 다녀보고 사장님들과 나눈 이야기가 바탕이에요. 거기에 정보를 정리하고
            지도·코스로 보기 좋게 다듬는 일은 <b className="text-ink">AI의 도움</b>도 받았어요.
            사람의 발품과 AI의 손이 함께 만든 나주 안내서인 셈이에요.
          </p>
        </section>

        {/* 우리가 하는 일 카드 */}
        <section className="grid grid-cols-2 gap-2.5">
          {[
            { icon: <Footprints className="size-5" />, t: "발로 모았어요", d: "직접 다녀온 곳만" },
            { icon: <Coffee className="size-5" />, t: "로컬 위주", d: "프랜차이즈는 살짝 뒤로" },
            { icon: <Compass className="size-5" />, t: "코스로 안내", d: "동선까지 한 번에" },
            { icon: <MapPin className="size-5" />, t: "지도와 함께", d: "내 주변부터 쏙" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border border-line bg-card p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-pear/12 text-pear-deep">{c.icon}</span>
              <p className="mt-2.5 text-[14px] font-extrabold text-ink">{c.t}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{c.d}</p>
            </div>
          ))}
        </section>

        {/* 인용 */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <p className="brand-serif text-[16px] font-bold leading-relaxed text-ink" style={{ wordBreak: "keep-all" }}>
            “나주에 이런 게 있었어?”<br />
            <span className="text-ink-soft">— 그 말 한마디가 듣고 싶어서요.</span>
          </p>
        </section>

        {/* CTA */}
        <section className="space-y-2.5">
          <Link href="/" className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-background active:scale-[0.99]">
            <Compass className="size-5 shrink-0" />
            <span className="flex-1 text-[14.5px] font-extrabold">나주 둘러보러 가기</span>
            <ChevronRight className="size-4 shrink-0 opacity-70" />
          </Link>
          <a href={INSTA} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 active:scale-[0.99]">
            <InstaGlyph className="size-5 shrink-0 text-hongeo" />
            <span className="flex-1 text-[14px] font-bold text-ink">인스타그램 @piece_of_naju</span>
            <ChevronRight className="size-4 shrink-0 text-ink-soft/50" />
          </a>
        </section>

        <p className="pt-2 text-center text-[11px] text-ink-soft/50">나주한조각 · 나주를 한 조각씩</p>
      </div>
    </div>
  );
}
