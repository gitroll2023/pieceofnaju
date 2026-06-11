// KB 사용처(고유가/온누리/전통시장/착한가격 등) — 헤드풀 수집기
// 사용법: node scripts/kb_harvest.mjs
//  1) 뜬 브라우저에서 전남 → 나주시 선택, 원하는 혜택 체크, 조회 → "목록" 탭
//  2) 목록이 뜨면 스크립트가 자동으로 끝까지 로드하며 수집 → data/naju_merchants.csv 저장
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const URL = "https://m.kbcard.com/BON/DVIEW/MBAM0005";
const log = (m) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`;
  console.log(line);
  try { appendFileSync("scripts/kb_harvest.log", line + "\n"); } catch {}
};

const EXTRACT = () =>
  [...document.querySelectorAll(".place-list__item")].map((it) => {
    const t = (s) => (it.querySelector(s)?.innerText || "").trim();
    const badges = [...it.querySelectorAll(".place-list__badge")]
      .map((b) => b.innerText.trim()).filter(Boolean);
    const addr = [...it.querySelectorAll(".place-list__addr")]
      .map((a) => a.innerText.trim()).filter(Boolean);
    return {
      name: t(".place-list__title"),
      addr: addr.join(" | "),
      badges: badges.join(","),
      theme: t(".place-list__theme"),
      desc: t(".place-list__desc"),
      link: it.querySelector(".place-list__link a, a.place-list__link")?.getAttribute("href") || "",
    };
  });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  userAgent: UA, viewport: { width: 412, height: 900 }, isMobile: true, hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);
log("열림. 브라우저에서: 전남 → 나주시 → 혜택 체크 → 조회 → '목록' 탭 누르세요.");

// 1) 목록 등장 대기 (최대 12분) — 사용자가 검색 수행
let appeared = 0;
for (let i = 0; i < 290; i++) {
  const n = await page.locator(".place-list__item").count().catch(() => 0);
  if (n >= 3) { appeared = n; break; }
  await page.waitForTimeout(2500);
}
if (appeared < 3) { log("목록 미감지(타임아웃). 종료."); await browser.close(); process.exit(0); }
log(`목록 감지: ${appeared}건. 끝까지 로드하며 수집 시작...`);

// 2) 끝까지 로드 + 점진 수집(가상스크롤/페이지네이션 모두 대응)
const store = new Map();
const harvest = async () => {
  const rows = await page.evaluate(EXTRACT).catch(() => []);
  for (const r of rows) {
    const k = (r.name + "|" + r.addr).trim();
    if (r.name) store.set(k, r);
  }
};
let prevSize = -1, same = 0;
for (let i = 0; i < 600; i++) {
  // 더보기 버튼 있으면 클릭
  try {
    const more = page.locator(
      "a:has-text('더보기'), button:has-text('더보기'), [class*='more']:visible, [class*='btn-more']:visible"
    ).first();
    if (await more.isVisible({ timeout: 250 })) await more.click({ timeout: 1200 });
  } catch {}
  // 스크롤(window + 리스트 컨테이너)
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll(".place-list, .tabs__panel, [class*='scroll']").forEach((c) => {
      try { c.scrollTop = c.scrollHeight; } catch {}
    });
  });
  await page.waitForTimeout(800);
  await harvest();
  if (store.size === prevSize) same++; else { same = 0; prevSize = store.size; }
  if (i % 8 === 0) log(`수집 중... 누적 ${store.size}건`);
  if (same >= 8) break; // 더 안 늘면 종료
}
await harvest();
const uniq = [...store.values()];
log(`수집 완료: ${uniq.length}건 (고유 상호+주소 기준)`);

// 3) 저장 (CSV는 엑셀 호환 BOM)
mkdirSync("data", { recursive: true });
const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
const header = ["name", "address", "badges", "theme", "desc", "link"];
const csv = "﻿" + [header.join(",")]
  .concat(uniq.map((r) => [r.name, r.addr, r.badges, r.theme, r.desc, r.link].map(esc).join(",")))
  .join("\n");
writeFileSync("data/naju_merchants.csv", csv, "utf-8");
writeFileSync("data/naju_merchants.json", JSON.stringify(uniq, null, 1), "utf-8");
log(`저장: data/naju_merchants.csv (${uniq.length} rows)`);
await page.waitForTimeout(1200);
await browser.close();
