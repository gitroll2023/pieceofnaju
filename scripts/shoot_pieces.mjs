import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 1000 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/merchants", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(5000);
const btns = await p.$$('button[title="내 조각에 담기"]');
console.log("stamp btns found:", btns.length);
for (let i = 0; i < Math.min(8, btns.length); i++) { try { await btns[i].click(); await p.waitForTimeout(150); } catch {} }
await p.goto("http://localhost:3000/pieces", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(2000);
await p.screenshot({ path: "scripts/pieces.png", fullPage: true });
console.log("done");
await b.close();
