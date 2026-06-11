import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 950 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(5500);
await p.screenshot({ path: "scripts/guide_food.png" });
// 관광 탭
try { await p.click("button:has-text('관광')", { timeout: 3000 }); await p.waitForTimeout(3000); } catch (e) { console.log("tab:", e.message); }
await p.screenshot({ path: "scripts/guide_tour.png" });
console.log("done");
await b.close();
