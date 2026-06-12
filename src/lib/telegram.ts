import "server-only";

// 관리자 텔레그램 알림(najupiecebot). 중요한 이벤트만(가입·건의·가게신청·크리에이터신청 등).
// 실패해도 본 요청에 영향 주지 않도록 항상 안전 처리.
// 인라인 버튼 타입(승인/반려/링크)
export type InlineKeyboard = { inline_keyboard: { text: string; callback_data?: string; url?: string }[][] };

export async function notifyAdmin(text: string, replyMarkup?: InlineKeyboard) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
    });
  } catch {
    // 알림 실패는 무시
  }
}

// 버튼 콜백 응답(토스트)
export async function tgAnswer(callbackId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
    });
  } catch {}
}

// 처리 후 원문 메시지 갱신 + 버튼 제거(중복 클릭 방지)
export async function tgEdit(chatId: number | string, messageId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true, reply_markup: { inline_keyboard: [] } }),
    });
  } catch {}
}

// 이미지 첨부 알림(버튼 옵션) — sendPhoto는 reply_markup 지원.
export async function notifyAdminPhoto(photo: Blob, caption: string, replyMarkup?: InlineKeyboard) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chat) return;
  try {
    const fd = new FormData();
    fd.append("chat_id", chat);
    fd.append("caption", caption.slice(0, 1024));
    fd.append("photo", photo, "attach.jpg");
    if (replyMarkup) fd.append("reply_markup", JSON.stringify(replyMarkup));
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: fd });
  } catch {
    // 실패 시 캡션 + 버튼만이라도 전송
    await notifyAdmin(caption, replyMarkup);
  }
}

// 여러 장 첨부 알림 — sendMediaGroup(최대 10장, 첫 장에 캡션).
export async function notifyAdminPhotos(photos: Blob[], caption: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chat) return;
  if (photos.length === 0) return notifyAdmin(caption);
  if (photos.length === 1) return notifyAdminPhoto(photos[0], caption);
  const pics = photos.slice(0, 10);
  try {
    const fd = new FormData();
    fd.append("chat_id", chat);
    fd.append(
      "media",
      JSON.stringify(pics.map((_, i) => ({ type: "photo", media: `attach://file${i}`, ...(i === 0 ? { caption: caption.slice(0, 1024) } : {}) }))),
    );
    pics.forEach((p, i) => fd.append(`file${i}`, p, `attach${i}.jpg`));
    await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, { method: "POST", body: fd });
  } catch {
    await notifyAdmin(caption);
  }
}
