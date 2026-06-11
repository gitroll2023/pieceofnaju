// KB 나주 가맹점 자동 크롤러 (헤드풀, 동 46개 순차 순회)
// 사용법: node scripts/kb_crawl.mjs
//  1) 뜬 브라우저에서: 위치팝업 닫기 → 전남·나주시 선택 → 혜택 체크 → 아무 동이나 조회 → "목록"
//  2) 목록이 뜨면(=세팅 완료 신호) 스크립트가 46개 동을 자동 순회하며 수집 → data/naju_merchants.csv
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

// 이번에 수집할 혜택(usecase): 1=온누리 2=전통시장 3=착한가격 (6=고유가는 기존 보유)
const WANTED = (process.env.USECASES || "1,2,3").split(",").map((s) => s.trim());

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const URL = "https://m.kbcard.com/BON/DVIEW/MBAM0005";

const DONGS = [
  "경현동","공산면","과원동","관정동","교동","금계동","금성동","금천면","남내동","남외동",
  "남평읍","노안면","다도면","다시면","대기동","대호동","동강면","동수동","문평면","반남면",
  "보산동","봉황면","부덕동","빛가람동","산정동","산포면","삼도동","삼영동","서내동","석현동",
  "성북동","세지면","송월동","송촌동","안창동","영산동","오량동","왕곡면","용산동","운곡동",
  "이창동","죽림동","중앙동","청동","토계동","평산동",
];

const log = (m) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`;
  console.log(line);
  try { appendFileSync("scripts/kb_crawl.log", line + "\n"); } catch {}
};

const EXTRACT = () =>
  [...document.querySelectorAll(".place-list__item")].map((it) => {
    const title = (it.querySelector(".place-list__title")?.innerText || "").trim();
    const theme = (it.querySelector(".place-list__theme")?.innerText || "").trim();
    const badges = [...it.querySelectorAll(".place-list__badge")]
      .map((b) => b.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);
    const addrs = [...it.querySelectorAll(".place-list__addr")].map((a) => a.innerText.trim());
    let dong = "", phone = "", mno = "";
    for (const a of addrs) {
      if (a.startsWith("전화번호")) phone = a.replace("전화번호", "").trim();
      else if (a.startsWith("가맹점번호")) mno = a.replace("가맹점번호", "").trim();
      else { const m = a.match(/나주시\s+(\S+)/); if (m) dong = m[1]; }
    }
    return { name: title, dong, phone, merchant_no: mno, theme, programs: badges.join("|") };
  });

// store: key → {name,dong,theme,phone,merchant_no, programs:Set}
const store = new Map();
const keyOf = (r) => r.merchant_no || `${r.name}|${r.dong}`;

// 기존 수집분(고유가 등) 불러와 병합 시작점으로
if (existsSync("data/naju_merchants.json")) {
  try {
    const prev = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
    for (const r of prev) {
      const progs = new Set((r.programs || "").split("|").filter(Boolean));
      store.set(keyOf(r), { ...r, programs: progs });
    }
    log(`기존 ${store.size}건 불러옴(병합 모드)`);
  } catch {}
}

const save = () => {
  mkdirSync("data", { recursive: true });
  const rows = [...store.values()].map((r) => ({
    ...r, programs: [...r.programs].sort().join("|"),
  }));
  const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
  const header = ["name", "dong", "theme", "programs", "phone", "merchant_no"];
  const csv = "﻿" + [header.join(",")]
    .concat(rows.map((r) => header.map((h) => esc(r[h])).join(","))).join("\n");
  writeFileSync("data/naju_merchants.csv", csv, "utf-8");
  writeFileSync("data/naju_merchants.json", JSON.stringify(rows, null, 1), "utf-8");
};

async function harvestCurrent() {
  let prev = -1, same = 0;
  for (let i = 0; i < 500; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      document.querySelectorAll(".place-list, .tabs__panel, [class*='scroll']").forEach((c) => { try { c.scrollTop = c.scrollHeight; } catch {} });
    });
    try {
      const more = page.locator("a:has-text('더보기'), button:has-text('더보기'), [class*='more']:visible").first();
      if (await more.isVisible({ timeout: 200 })) await more.click({ timeout: 800 });
    } catch {}
    await page.waitForTimeout(650);
    const n = await page.locator(".place-list__item").count().catch(() => 0);
    if (n === prev) same++; else { same = 0; prev = n; }
    if (same >= 6) break;
  }
  const rows = await page.evaluate(EXTRACT).catch(() => []);
  let added = 0;
  for (const r of rows) {
    if (!r.name) continue;
    const k = keyOf(r);
    const badges = (r.programs || "").split("|").filter(Boolean);
    const ex = store.get(k);
    if (ex) {
      badges.forEach((b) => ex.programs.add(b));
      if (!ex.phone && r.phone) ex.phone = r.phone;
      if (!ex.theme && r.theme) ex.theme = r.theme;
    } else {
      added++;
      store.set(k, { ...r, programs: new Set(badges) });
    }
  }
  return { found: rows.length, added };
}

async function setUsecases() {
  // WANTED만 체크, 나머지 해제 (cb.click()으로 페이지 핸들러까지 발동)
  await page.evaluate((wanted) => {
    for (const n of ["1", "2", "3", "4", "5", "6"]) {
      const cb = document.getElementById("usecaseChk" + n);
      if (!cb) continue;
      const want = wanted.includes(n);
      if (cb.checked !== want) cb.click();
    }
  }, WANTED).catch(() => {});
}

async function searchDong(dong) {
  // 필터 팝업 열기
  await page.click("a.sort__btn--filter", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  // 이번에 원하는 혜택만 체크
  await setUsecases();
  await page.waitForTimeout(200);
  // 지역선택 팝업 열기
  await page.click('[pop-name="selBsArea"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  // 동 클릭
  await page.click(`#areaDepth3 a[data-value="${dong}"]`, { timeout: 6000 });
  await page.waitForTimeout(250);
  // 선택 확정 → 조회
  await page.evaluate(() => { try { selBs("selBsArea"); } catch {} });
  await page.waitForTimeout(500);
  await page.evaluate(() => { try { doSearch("#filterPopup"); } catch {} });
  await page.waitForTimeout(1600);
}

// ───────── main ─────────
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 412, height: 900 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
log("브라우저 열림 ▶ 팝업 닫고 / 전남·나주시 / 혜택 체크 / 아무 동이나 조회 → '목록' 까지 해주세요.");

// 세팅 완료 신호: 목록 등장 대기(최대 6분)
let ready = false;
for (let t = 0; t < 144; t++) {
  const n = await page.locator(".place-list__item").count().catch(() => 0);
  const dongTabs = await page.locator('#areaDepth3 a[data-value="빛가람동"]').count().catch(() => 0);
  if (n >= 1 && dongTabs >= 1) { ready = true; break; }
  await page.waitForTimeout(2500);
}
if (!ready) { log("세팅 미감지(타임아웃). 종료."); await browser.close(); process.exit(0); }
log("세팅 감지! 46개 동 자동 순회 시작합니다.");

for (let i = 0; i < DONGS.length; i++) {
  const dong = DONGS[i];
  try {
    await searchDong(dong);
    const { found, added } = await harvestCurrent();
    log(`(${i + 1}/${DONGS.length}) ${dong}: 화면 ${found}건, 신규 ${added}건, 누적 ${store.size}건`);
    save();
  } catch (e) {
    log(`(${i + 1}/${DONGS.length}) ${dong}: 실패 - ${e.message}`);
    await page.screenshot({ path: `scripts/err_${dong}.png` }).catch(() => {});
  }
}
log(`완료! 총 ${store.size}건 저장: data/naju_merchants.csv`);
save();
await page.waitForTimeout(1500);
await browser.close();
