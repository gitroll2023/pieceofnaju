import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 920 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/merchants", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(5000);
const btns = await p.$$('button[title="내 조각에 담기"]');
for (let i = 0; i < Math.min(9, btns.length); i++) { try { await btns[i].click(); await p.waitForTimeout(120); } catch {} }
await p.goto("http://localhost:3000/pieces", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(1800);
await p.screenshot({ path: "scripts/pieces_grid.png" });
// 조각 클릭 → 시트
try { await p.click("ul.grid li button", { timeout: 3000 }); await p.waitForTimeout(1200); } catch (e) { console.log("click:", e.message); }
await p.screenshot({ path: "scripts/pieces_sheet.png" });
console.log("done");
await b.close();
