"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, MapPin, Search, X, Check, ArrowLeft, Loader2, List as ListIcon } from "lucide-react";
import InstaGlyph from "@/components/ui/InstaGlyph";
import CropModal from "@/components/journal/CropModal";
import Lightbox from "@/components/journal/Lightbox";
import ManageList from "@/components/journal/ManageList";

type Place = {
  name: string; address: string; lat: number; lng: number;
  known?: boolean; merchantId?: string; catLabel?: string; catEmoji?: string;
};
type Mode = "photo" | "insta";
type Photo = { blob: Blob; url: string };
const MAX_PHOTOS = 5;

export default function JournalCapturePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/check").then((r) => r.json()).then((d) => setAuthed(!!d.admin)).catch(() => setAuthed(false));
  }, []);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, pw }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) { setLoginErr(d.error || "로그인 실패"); return; }
    setAuthed(true);
  }

  if (authed === null) {
    return <div className="fixed inset-0 z-[3000] grid place-items-center bg-background text-ink-soft">불러오는 중…</div>;
  }
  if (!authed) {
    return (
      <div className="fixed inset-0 z-[3000] grid place-items-center bg-background px-6">
        <form onSubmit={doLogin} className="w-full max-w-[340px] rounded-3xl border border-line bg-card p-6">
          <h1 className="brand-serif text-[22px] font-extrabold text-ink">내 조각 등록</h1>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" autoComplete="username"
            className="mt-4 w-full rounded-2xl border border-line bg-background px-4 py-3 text-[14px] text-ink outline-none focus:border-pear/60" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="비밀번호" autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-line bg-background px-4 py-3 text-[14px] text-ink outline-none focus:border-pear/60" />
          {loginErr && <p className="mt-2 text-[12px] font-semibold text-red-500">{loginErr}</p>}
          <button type="submit" className="mt-4 w-full rounded-2xl bg-ink py-3 text-[15px] font-extrabold text-background active:scale-[0.98]">들어가기</button>
        </form>
      </div>
    );
  }

  return <JournalApp />;
}

function JournalApp() {
  const [view, setView] = useState<"add" | "list">("add");
  return (
    <>
      {view === "add" ? <CaptureForm /> : <ManageList />}
      <nav className="fixed inset-x-0 bottom-0 z-[3100] flex border-t border-line bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
        style={{ boxShadow: "0 -4px 16px -8px rgba(31,28,24,0.15)" }}>
        {([["add", "등록", Camera], ["list", "목록", ListIcon]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => setView(k)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-bold ${view === k ? "text-pear-deep" : "text-ink-soft/60"}`}>
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

function CaptureForm() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pendingSrc, setPendingSrc] = useState<string>("");
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const [instaUrl, setInstaUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    setQ(query);
    setPlace(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const d = await fetch(`/api/admin/kakao-search?q=${encodeURIComponent(query.trim())}`).then((r) => r.json());
        setResults(d.results || []);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
  }, []);

  function pickPlace(p: Place) {
    setPlace(p);
    setResults([]);
    setQ("");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 선택해도 change 이벤트 나가도록
    if (!f) return;
    setPendingSrc(URL.createObjectURL(f));
  }

  function confirmCrop(blob: Blob) {
    setPhotos((p) => [...p, { blob, url: URL.createObjectURL(blob) }].slice(0, MAX_PHOTOS));
    URL.revokeObjectURL(pendingSrc);
    setPendingSrc("");
  }
  function cancelCrop() {
    URL.revokeObjectURL(pendingSrc);
    setPendingSrc("");
  }
  function removePhoto(i: number) {
    setPhotos((p) => { URL.revokeObjectURL(p[i].url); return p.filter((_, idx) => idx !== i); });
  }

  function resetForm() {
    setPlace(null); setQ(""); setResults([]); setMode("photo");
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]); setInstaUrl(""); setMemo("");
  }

  async function save() {
    setErr("");
    if (!place) { setErr("장소를 먼저 검색해서 선택해주세요"); return; }
    if (mode === "photo" && photos.length === 0) { setErr("사진을 한 장 이상 담아주세요"); return; }
    if (mode === "insta" && !instaUrl.trim()) { setErr("릴스 링크를 넣어주세요"); return; }

    setSaving(true);
    const form = new FormData();
    form.set("placeName", place.name);
    form.set("address", place.address);
    form.set("lat", String(place.lat));
    form.set("lng", String(place.lng));
    form.set("memo", memo);
    if (place.merchantId) form.set("merchantId", place.merchantId);
    if (mode === "photo") photos.forEach((p, i) => form.append("photos", p.blob, `photo-${i}.webp`));
    if (mode === "insta") form.set("instaUrl", instaUrl.trim());

    const r = await fetch("/api/admin/journal", { method: "POST", body: form });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok || !d.ok) { setErr(d.error || "저장 실패"); return; }
    setSaved(true);
    resetForm();
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-background pb-24">
      <header className="paper-grain flex items-center gap-3 px-4 pb-4 pt-5">
        <Link href="/pieceadmin" className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-card active:scale-95">
          <ArrowLeft className="size-4 text-ink-soft" />
        </Link>
        <div>
          <p className="text-[11.5px] font-bold text-pear-deep">🧩 나주한조각</p>
          <h1 className="brand-serif text-[20px] font-extrabold leading-tight text-ink">내 조각 등록</h1>
        </div>
      </header>

      <div className="space-y-5 px-4">
        {/* 1. 장소 검색 */}
        <section>
          <label className="text-[12.5px] font-bold text-ink-soft">📍 어디였나요</label>
          {place ? (
            <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-pear/50 bg-pear/10 px-4 py-3">
              <MapPin className="size-4 shrink-0 text-pear-deep" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[14px] font-bold text-ink">
                  {place.name}
                  {place.known && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-pear/20 px-1.5 py-0.5 text-[10px] font-bold text-pear-deep">
                      {place.catEmoji} 등록된 가게
                    </span>
                  )}
                </p>
                <p className="truncate text-[11.5px] text-ink-soft">{place.address}</p>
              </div>
              <button type="button" onClick={() => setPlace(null)} className="shrink-0 text-ink-soft/60"><X className="size-4" /></button>
            </div>
          ) : (
            <>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3">
                <Search className="size-4 text-ink-soft/60" />
                <input value={q} onChange={(e) => search(e.target.value)} placeholder="가게 이름이나 주소 검색"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/50" />
                {searching && <Loader2 className="size-4 animate-spin text-ink-soft/50" />}
              </div>
              {results.length > 0 && (
                <ul className="mt-1.5 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-line bg-card p-1.5">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => pickPlace(r)}
                        className="block w-full rounded-xl px-3 py-2 text-left active:bg-background">
                        <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink">
                          {r.name}
                          {r.known && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-pear/20 px-1.5 py-0.5 text-[10px] font-bold text-pear-deep">
                              {r.catEmoji} 등록된 가게
                            </span>
                          )}
                        </p>
                        <p className="text-[11.5px] text-ink-soft">{r.address}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* 2. 사진 또는 인스타 릴스 */}
        <section>
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-full border border-line bg-card p-0.5 text-[12.5px] font-bold">
              {([["photo", "📷 사진"], ["insta", "🎬 릴스 링크"]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setMode(k)} className="rounded-full px-4 py-1.5 transition"
                  style={mode === k ? { background: "var(--naju-ink)", color: "var(--background)" } : { color: "var(--naju-ink-soft)" }}>
                  {label}
                </button>
              ))}
            </div>
            {mode === "photo" && <span className="text-[11.5px] font-bold text-ink-soft/60">{photos.length}/{MAX_PHOTOS}</span>}
          </div>

          {mode === "photo" ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-2xl border border-line">
                  <button type="button" onClick={() => setLightboxAt(i)} className="block size-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="size-full object-cover" />
                  </button>
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white active:scale-90">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-card text-ink-soft/60">
                  <Camera className="size-6" />
                  <span className="text-[11px] font-bold">{photos.length === 0 ? "사진 찍기" : "추가"}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3">
              <InstaGlyph className="size-4 shrink-0 text-ink-soft/60" />
              <input value={instaUrl} onChange={(e) => setInstaUrl(e.target.value)} placeholder="instagram.com/reel/..."
                className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-soft/50" />
            </div>
          )}
        </section>

        {/* 3. 메모 */}
        <section>
          <label className="text-[12.5px] font-bold text-ink-soft">📝 메모(선택)</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value.slice(0, 300))} rows={2}
            placeholder="어떤 곳인지, 왜 남기는지…"
            className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-pear/60" />
        </section>

        {err && <p className="text-[12.5px] font-semibold text-red-500">{err}</p>}

        <button type="button" onClick={save} disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink py-4 text-[15px] font-extrabold text-background active:scale-[0.98] disabled:opacity-50">
          {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saving ? "저장 중…" : saved ? "저장됐어요 · 다음 조각" : "이 조각 남기기"}
        </button>
      </div>

      {pendingSrc && <CropModal imageSrc={pendingSrc} onCancel={cancelCrop} onConfirm={confirmCrop} />}
      {lightboxAt !== null && (
        <Lightbox images={photos.map((p) => p.url)} startIndex={lightboxAt} onClose={() => setLightboxAt(null)} />
      )}
    </div>
  );
}
