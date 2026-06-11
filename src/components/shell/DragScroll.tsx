"use client";

import { useEffect } from "react";

/**
 * 전역: 마우스로도 가로 스크롤 영역(.no-scrollbar)을 드래그해 넘길 수 있게 함.
 * 드래그 후엔 클릭이 발생하지 않도록 한 번 막아준다.
 */
export default function DragScroll() {
  useEffect(() => {
    let el: HTMLElement | null = null;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType !== "mouse") return;
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(".no-scrollbar");
      if (!target || target.scrollWidth <= target.clientWidth + 2) return;
      el = target;
      startX = e.clientX;
      startLeft = target.scrollLeft;
      dragging = true;
      moved = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging || !el) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      el.scrollLeft = startLeft - dx;
      if (moved > 4) el.classList.add("is-dragging");
    };

    const onUp = () => {
      if (dragging && moved > 5) {
        // 드래그 직후 발생하는 클릭 1회 차단
        const cancel = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", cancel, { capture: true, once: true });
      }
      el?.classList.remove("is-dragging");
      el = null;
      dragging = false;
    };

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);

  return null;
}
