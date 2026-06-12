import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 1300 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/course", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(4500);
await p.screenshot({ path: "scripts/course_persona.png", fullPage: true });
console.log("done");
await b.close();
