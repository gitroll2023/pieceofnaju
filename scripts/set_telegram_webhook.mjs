// 텔레그램 봇 웹훅 등록 — 배포 후 1회 실행.
// 사용법: node scripts/set_telegram_webhook.mjs https://your-domain.com
// 해제:   node scripts/set_telegram_webhook.mjs --delete
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const token = get("TELEGRAM_BOT_TOKEN");
const secret = get("TELEGRAM_WEBHOOK_SECRET");
if (!token) { console.error("TELEGRAM_BOT_TOKEN 없음"); process.exit(1); }

const arg = process.argv[2];
if (arg === "--delete") {
  const r = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: "POST" });
  console.log(await r.json());
  process.exit(0);
}
if (!arg) { console.error("사용법: node scripts/set_telegram_webhook.mjs https://도메인"); process.exit(1); }

const url = `${arg.replace(/\/$/, "")}/api/telegram/webhook`;
const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["callback_query"] }),
});
console.log("setWebhook →", url);
console.log(await r.json());
