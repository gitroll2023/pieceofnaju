import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 412, height: 920 }, deviceScaleFactor: 2,
  geolocation: { latitude: 35.0205, longitude: 126.7120 }, permissions: ["geolocation"],
});
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(5500);
// 위치 버튼(우하단 Crosshair) 클릭
try { await p.click('button[aria-label="내 위치"]', { timeout: 3000 }); await p.waitForTimeout(2500); } catch (e) { console.log("loc:", e.message); }
// 내 주변순 켜기
try { await p.click("button:has-text('내 주변순')", { timeout: 3000 }); await p.waitForTimeout(1500); } catch (e) { console.log("near:", e.message); }
await p.screenshot({ path: "scripts/guide_loc.png" });
console.log("done");
await b.close();
