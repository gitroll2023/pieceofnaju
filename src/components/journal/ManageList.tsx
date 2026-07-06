"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, MapPin, Trash2, X, Check } from "lucide-react";
import InstaGlyph from "@/components/ui/InstaGlyph";
import CropModal from "@/components/journal/CropModal";
import Lightbox from "@/components/journal/Lightbox";

type Piece = {
  id: number; place_name: string; address: string; photo_urls: string[];
  insta_url: string; memo: string; merchant_id: string | null; at: number;
};
const MAX_PHOTOS = 5;

export default function ManageList() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/journal").then((r) => r.json()).catch(() => ({}));
    setPieces(d.pieces || []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = pieces.find((p) => p.id === openId) || null;

  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-background pb-24">
      <header className="paper-grain px-4 pb-4 pt-5">
        <p className="text-[11.5px] font-bold text-pear-deep">🧩 나주한조각</p>
        <h1 className="brand-serif text-[20px] font-extrabold leading-tight text-ink">내가 남긴 조각 ({pieces.length})</h1>
      </header>

      {loading ? (
        <p className="px-4 py-10 text-center text-[13px] text-ink-soft">불러오는 중…</p>
      ) : pieces.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-ink-soft">아직 남긴 조각이 없어요. 아래 &quot;등록&quot; 탭에서 추가해보세요.</p>
      ) : (
        <ul className="space-y-2 px-4">
          {pieces.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setOpenId(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-2.5 text-left active:scale-[0.99]">
                <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-background">
                  {p.photo_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_urls[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <InstaGlyph className="size-6 text-ink-soft/50" />
                  )}
                  {p.photo_urls.length > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black/60 px-1 text-[9px] font-bold text-white">+{p.photo_urls.length - 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink">{p.place_name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ink-soft"><MapPin className="size-3 shrink-0" />{p.address || "주소 없음"}</p>
                  {p.memo && <p className="mt-0.5 truncate text-[11px] text-ink-soft/70">{p.memo}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <DetailSheet
          piece={open}
          onClose={() => setOpenId(null)}
          onChanged={load}
          onViewPhoto={(i) => setLightboxAt(i)}
        />
      )}
      {lightboxAt !== null && open && (
        <Lightbox images={open.photo_urls} startIndex={lightboxAt} onClose={() => setLightboxAt(null)} />
      )}
    </div>
  );
}

function DetailSheet({
  piece, onClose, onChanged, onViewPhoto,
}: {
  piece: Piece;
  onClose: () => void;
  onChanged: () => void;
  onViewPhoto: (i: number) => void;
}) {
  const [kept, setKept] = useState<string[]>(piece.photo_urls);
  const [newPhotos, setNewPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [pendingSrc, setPendingSrc] = useState("");
  const [memo, setMemo] = useState(piece.memo);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");
  const total = kept.length + newPhotos.length;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPendingSrc(URL.createObjectURL(f));
  }
  function confirmCrop(blob: Blob) {
    setNewPhotos((p) => [...p, { blob, url: URL.createObjectURL(blob) }].slice(0, MAX_PHOTOS - kept.length));
    URL.revokeObjectURL(pendingSrc);
    setPendingSrc("");
  }

  async function save() {
    setErr(""); setSaving(true);
    const form = new FormData();
    form.set("id", String(piece.id));
    form.set("memo", memo);
    form.set("keepPhotoUrls", JSON.stringify(kept));
    newPhotos.forEach((p, i) => form.append("newPhotos", p.blob, `photo-${i}.webp`));
    const r = await fetch("/api/admin/journal", { method: "PATCH", body: form });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok || !d.ok) { setErr(d.error || "저장 실패"); return; }
    onChanged();
    onClose();
  }

  async function del() {
    if (typeof window !== "undefined" && !window.confirm("이 조각을 삭제할까요?")) return;
    setDeleting(true);
    await fetch("/api/admin/journal?id=" + piece.id, { method: "DELETE" });
    setDeleting(false);
    onChanged();
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[3400] flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-line px-4 py-4">
        <button type="button" onClick={onClose} aria-label="닫기" className="grid size-8 place-items-center rounded-full border border-line active:scale-95">
          <X className="size-4 text-ink-soft" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{piece.place_name}</p>
          <p className="truncate text-[11px] text-ink-soft">{piece.address}</p>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section>
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-bold text-ink-soft">📷 사진</label>
            <span className="text-[11.5px] font-bold text-ink-soft/60">{total}/{MAX_PHOTOS}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {kept.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-2xl border border-line">
                <button type="button" onClick={() => onViewPhoto(i)} className="block size-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
                <button type="button" onClick={() => setKept((k) => k.filter((u) => u !== url))} aria-label="사진 빼기"
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white active:scale-90">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {newPhotos.map((p, i) => (
              <div key={p.url} className="relative aspect-square overflow-hidden rounded-2xl border border-pear/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="size-full object-cover" />
                <span className="absolute left-1 top-1 rounded-full bg-pear px-1.5 py-0.5 text-[9px] font-bold text-[#2a1c06]">NEW</span>
                <button type="button" onClick={() => setNewPhotos((ps) => ps.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white active:scale-90">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {total < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-card text-ink-soft/60">
                <Camera className="size-6" />
                <span className="text-[11px] font-bold">추가</span>
                <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
              </label>
            )}
          </div>
          {piece.insta_url && (
            <a href={piece.insta_url} target="_blank" rel="noreferrer" className="mt-2 block text-[12px] font-bold text-river underline">🎬 릴스 링크 보기</a>
          )}
        </section>

        <section>
          <label className="text-[12.5px] font-bold text-ink-soft">📝 메모</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value.slice(0, 300))} rows={2}
            className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-ink outline-none focus:border-pear/60" />
        </section>

        {err && <p className="text-[12.5px] font-semibold text-red-500">{err}</p>}
      </div>

      <div className="flex items-center gap-2.5 border-t border-line p-4 pb-6">
        <button type="button" onClick={del} disabled={deleting}
          className="grid size-12 shrink-0 place-items-center rounded-2xl border border-red-300 text-red-500 active:scale-95 disabled:opacity-50">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
        <button type="button" onClick={save} disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-ink py-3.5 text-[14px] font-extrabold text-background active:scale-[0.98] disabled:opacity-50">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      {pendingSrc && <CropModal imageSrc={pendingSrc} onCancel={() => { URL.revokeObjectURL(pendingSrc); setPendingSrc(""); }} onConfirm={confirmCrop} />}
    </div>,
    document.body,
  );
}
