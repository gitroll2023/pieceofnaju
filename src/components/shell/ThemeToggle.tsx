"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("naju.theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button type="button" onClick={toggle} aria-label="다크/라이트 전환"
      className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold text-ink-soft transition active:scale-95">
      {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {dark ? "라이트" : "다크"}
    </button>
  );
}
