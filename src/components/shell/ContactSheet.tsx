"use client";

import { useState } from "react";
import { Check, Send, ImagePlus, Image as ImageIcon, X } from "lucide-react";

export type ContactMode = "contact" | "suggest" | "report" | "event";

const CFG: Record<ContactMode, { title: string; sub: string; api: string; place: boolean; msgLabel: string; msgPh: string }> = {
  contact: { title: "문의하기", sub: "궁금한 점은 편하게 남겨주세요.", api: "/api/contact", place: false, msgLabel: "문의 내용", msgPh: "무엇이 궁금하신가요?" },
  suggest: { title: "건의하기", sub: "이렇게 바뀌면 좋겠다, 다 들을게요.", api: "/api/contact", place: false, msgLabel: "건의 내용", msgPh: "이런 점이 있으면 좋겠어요…" },
  report: { title: "가게 제보하기", sub: "빠진 가게나 숨은 장소를 알려주세요.", api: "/api/store-request", place: true, msgLabel: "한 줄 소개 (선택)", msgPh: "어떤 곳인가요? 위치·메뉴 등" },
  event: { title: "지역 행사 알리기", sub: "나주에서 열리는 행사를 알려주세요.", api: "/api/contact", place: false, msgLabel: "행사 정보", msgPh: "행사명·일정·장소·내용 등을 적어주세요" },
};

export default function ContactSheet({ mode, onClose }: { mode: ContactMode | null; onClose: () => void }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [contact, setContact] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [shopInShop, setShopInShop] = useState(false);
  const [agree, setAgree] = useState(false);
  const [honey, setHoney] = useState(""); // 봇 허니팟(사람은 비워둠)
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  if (!mode) return null;
  const cfg = CFG[mode];

  function addImages(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...incoming].slice(0, 4)); // 최대 4장
    setErr("");
  }
  function close() {
    setName(""); setMsg(""); setContact(""); setImages([]); setShopInShop(false); setAgree(false); setHoney(""); setSent(false); setErr(""); setBusy(false);
    onClose();
  }

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      let r: Response;
      if (cfg.place) {
        // 가게 제보 → 사진 필수. DB(store-request) 저장 + 텔레그램 사진·승인버튼 전송
        if (name.trim().length < 2) { setErr("가게 이름을 입력해주세요"); setBusy(false); return; }
        if (images.length === 0) { setErr("가게 사진을 한 장 이상 넣어주세요"); setBusy(false); return; }
        if (shopInShop && msg.trim().length < 2) { setErr("샵인샵은 어디 안에 있는지 등 근거를 적어주세요"); setBusy(false); return; }
        if (!agree) { setErr("보내기 전에 아래 안내에 동의해주세요"); setBusy(false); return; }
        const fd = new FormData();
        fd.append("name", name.trim());
        fd.append("summary", msg.trim());
        fd.append("contact", contact.trim());
        fd.append("bucket", "see");
        fd.append("shopInShop", shopInShop ? "1" : "0");
        fd.append("agree", "1");
        fd.append("website", honey);
        images.forEach((f) => fd.append("image", f));
        r = await fetch("/api/store-request", { method: "POST", body: fd });
      } else {
        // 문의·건의·행사 제보 → DB 없이 텔레그램으로만(이미지 여러 장 첨부 가능)
        if (msg.trim().length < 2 && images.length === 0) { setErr("내용을 입력하거나 사진을 첨부해주세요"); setBusy(false); return; }
        if (!agree) { setErr("보내기 전에 아래 안내에 동의해주세요"); setBusy(false); return; }
        const fd = new FormData();
        fd.append("type", mode as string);
        fd.append("message", msg.trim());
        fd.append("contact", contact.trim());
        fd.append("agree", "1");
        fd.append("website", honey); // 허니팟
        images.forEach((f) => fd.append("image", f));
        r = await fetch("/api/contact", { method: "POST", body: fd });
      }
      if (!r.ok) throw new Error();
      setSent(true);
    } catch {
      setErr("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={close}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise relative w-full max-w-[480px] rounded-t-3xl border-t border-line bg-card p-5 pb-7 shadow-[0_-12px_32px_-12px_rgba(31,28,24,0.5)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {sent ? (
          <div className="grid place-items-center gap-3 py-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-pear/15 text-pear-deep"><Check className="size-7" /></span>
            <p className="brand-serif text-[18px] font-extrabold text-ink">잘 전해졌어요!</p>
            <p className="text-[13px] leading-relaxed text-ink-soft">소중한 의견 고마워요.<br />하나하나 직접 읽고 반영할게요 🧩</p>
            <button type="button" onClick={close} className="mt-1 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-bold text-background active:scale-95">닫기</button>
          </div>
        ) : (
          <>
            <h2 className="brand-serif text-[20px] font-extrabold text-ink">{cfg.title}</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">{cfg.sub}</p>

            {cfg.place && (
              <label className="mt-4 block">
                <span className="text-[12px] font-bold text-ink-soft">가게·장소 이름</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: ○○식당"
                  className="mt-1 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pear/60" />
              </label>
            )}

            <label className="mt-3 block">
              <span className="text-[12px] font-bold text-ink-soft">{cfg.msgLabel}</span>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder={cfg.msgPh}
                className="mt-1 w-full resize-y rounded-xl border border-line bg-background px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none focus:border-pear/60" />
            </label>

            {cfg.place && (
              <label className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft">
                <input type="checkbox" checked={shopInShop} onChange={(e) => setShopInShop(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-pear" />
                <span>샵인샵이에요 (다른 가게 안에 입점). 체크하면 위 칸에 <b className="text-ink">어디 안에 있는지·운영 근거</b>를 꼭 적어주세요.</span>
              </label>
            )}

            <div className="mt-3">
              <span className="text-[12px] font-bold text-ink-soft">{cfg.place ? "가게 사진 (필수 · 최대 4장)" : "사진 첨부 (선택 · 최대 4장)"}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                  {images.map((f, i) => (
                    <div key={i} className="relative size-16 overflow-hidden rounded-xl border border-line bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt={`첨부 ${i + 1}`} className="size-full object-cover" />
                      <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label="삭제"
                        className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/55 text-white"><X className="size-3" /></button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <label className="grid size-16 cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-background text-ink-soft active:scale-95">
                      <ImagePlus className="size-5" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                    </label>
                  )}
              </div>
            </div>

            <label className="mt-3 block">
              <span className="text-[12px] font-bold text-ink-soft">답변받을 곳 (선택)</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="인스타 아이디·메일 등 (선택)"
                className="mt-1 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pear/60" />
            </label>

            {/* 봇 허니팟 — 화면엔 안 보이고 사람은 비워둠 */}
            <input type="text" value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0" />

            <label className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-soft">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-pear" />
              <span>허위·욕설·부적절한 사진 등은 보내지 않을게요. 운영자가 검토 후 <b className="text-ink">반영하지 않을 수 있고</b>, 악용 시 차단될 수 있음에 동의해요. <ImageIcon className="inline size-3 text-ink-soft/50" /></span>
            </label>

            {err && <p className="mt-2 text-[12px] font-semibold text-hongeo">{err}</p>}

            <button type="button" onClick={submit} disabled={busy || !agree}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-pear px-4 py-3 text-[14.5px] font-extrabold text-[#2a1c06] transition active:scale-[0.98] disabled:opacity-50">
              <Send className="size-4" />{busy ? "보내는 중…" : "보내기"}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-soft/60">닉네임·비밀번호 외 개인정보는 받지 않아요.</p>
          </>
        )}
      </div>
    </div>
  );
}
