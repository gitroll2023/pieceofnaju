"use client";

import { useEffect, useState } from "react";

const KEY = "naju.intro.v1";

// "~할 땐 나주한조각" — 후킹 문구를 돌려가며
const HOOKS = [
  "곰탕 한 그릇 하러 갈 땐,",
  "영산포 노을 보러 갈 땐,",
  "주말 드라이브 갈 땐,",
  "인생샷 찍으러 갈 땐,",
  "배꽃·단풍 보러 갈 땐,",
];

export default function IntroSplash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hook, setHook] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setHook((h) => (h + 1) % HOOKS.length), 2200);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  function close() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setLeaving(true);
    setTimeout(() => setShow(false), 380);
  }

  return (
    <div
      className={`fixed inset-0 z-[2000] overflow-hidden ${leaving ? "intro-leave" : "intro-enter"}`}
      style={{ background: "linear-gradient(170deg, var(--naju-cream) 0%, var(--background) 55%)" }}
      role="dialog"
      aria-label="나주한조각 소개"
    >
      <div className="paper-grain pointer-events-none absolute inset-0 -z-10 opacity-70" />

      <div className="mx-auto flex h-full max-w-[480px] flex-col px-7 pb-9 pt-[12dvh]">
        <p
          className="animate-rise text-[12px] font-bold tracking-[0.22em] text-pear-deep"
          style={{ animationDelay: "0.05s" }}
        >
          A PIECE OF NAJU
        </p>

        {/* 떠다니는 조각 */}
        <div
          className="animate-rise mt-7 mb-7"
          style={{ animationDelay: "0.12s" }}
        >
          <div
            className="piece-thumb paper-grain animate-float grid size-[104px] place-items-center text-2xl shadow-[0_18px_40px_-14px_rgba(201,130,31,0.6)]"
            style={{
              background:
                "radial-gradient(120% 120% at 30% 22%, #f0b85a 0%, #e8a33d 45%, #c9821f 100%)",
            }}
          >
            <span className="-rotate-3">🧩</span>
          </div>
        </div>

        {/* 헤드라인 — 강약 */}
        <h1 className="animate-rise" style={{ animationDelay: "0.18s" }}>
          <span className="block text-[15.5px] font-bold text-ink-soft">
            다 둘러보려 하지 마세요.
          </span>
          <span className="brand-serif mt-1 block text-[33px] font-extrabold leading-[1.15] tracking-tight text-ink">
            나주는, <span className="text-pear-deep">한 조각씩.</span>
          </span>
        </h1>

        <p
          className="animate-rise mt-3.5 max-w-[19rem] text-[13.5px] leading-relaxed text-ink-soft"
          style={{ animationDelay: "0.24s" }}
        >
          노포의 손맛, 관광지 옆 진짜 맛집, 지금 피는 꽃까지 — <b className="font-bold text-ink">프랜차이즈 빼고 로컬만</b> 골라 담았어요.
        </p>

        {/* 차별점 칩 */}
        <div
          className="animate-rise mt-4 flex flex-wrap gap-1.5"
          style={{ animationDelay: "0.3s" }}
        >
          {["🚫 프랜차이즈 빼고", "🧭 한갓진 동네까지", "🌸 지금 피는 꽃"].map((c) => (
            <span
              key={c}
              className="rounded-full border border-line bg-card/70 px-2.5 py-1 text-[11.5px] font-bold text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>

        {/* 후킹 — ~할 땐 나주한조각 */}
        <div
          className="animate-rise mt-auto"
          style={{ animationDelay: "0.36s" }}
        >
          <p className="text-[14px] font-medium text-ink-soft" key={hook}>
            <span className="animate-rise inline-block">{HOOKS[hook]}</span>
          </p>
          <p className="brand-serif text-[27px] font-extrabold tracking-tight text-pear-deep">
            나주한조각 🧩
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={close}
          className="animate-rise mt-6 w-full rounded-2xl bg-ink py-4 text-[15.5px] font-extrabold text-background shadow-lg transition active:scale-[0.98]"
          style={{ animationDelay: "0.42s" }}
        >
          나주, 한 조각 담으러 가기
        </button>
        <button
          type="button"
          onClick={close}
          className="animate-rise mx-auto mt-3 text-[12.5px] font-semibold text-ink-soft/80 underline underline-offset-2"
          style={{ animationDelay: "0.46s" }}
        >
          그냥 둘러볼게요
        </button>

        <p
          className="animate-rise mt-5 text-center text-[10.5px] text-ink-soft/55"
          style={{ animationDelay: "0.5s" }}
        >
          비로그인 · 광고 없는 로컬 큐레이션 · @piece_of_naju
        </p>
      </div>
    </div>
  );
}
