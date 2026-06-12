// 기상청 초단기예보(나주 격자 nx=56, ny=71) — 30분 캐시.
const NX = 56, NY = 71;

function baseDT() {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  let y = kst.getUTCFullYear(), mo = kst.getUTCMonth(), d = kst.getUTCDate(), h = kst.getUTCHours();
  const mi = kst.getUTCMinutes();
  if (mi < 45) {
    h -= 1;
    if (h < 0) { h = 23; const p = new Date(Date.UTC(y, mo, d - 1)); y = p.getUTCFullYear(); mo = p.getUTCMonth(); d = p.getUTCDate(); }
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${y}${pad(mo + 1)}${pad(d)}`, time: `${pad(h)}30` };
}

function iconFor(sky: number, pty: number) {
  if (pty === 1 || pty === 5) return { icon: "🌧️", desc: "비" };
  if (pty === 2 || pty === 6) return { icon: "🌨️", desc: "진눈깨비" };
  if (pty === 3 || pty === 7) return { icon: "❄️", desc: "눈" };
  if (sky === 3) return { icon: "⛅", desc: "구름 많음" };
  if (sky === 4) return { icon: "☁️", desc: "흐림" };
  return { icon: "☀️", desc: "맑음" };
}

export async function GET() {
  const KEY = process.env.WEATHER_API_KEY;
  if (!KEY) return Response.json({ ok: false });
  const { date, time } = baseDT();
  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${KEY}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${date}&base_time=${time}&nx=${NX}&ny=${NY}`;
  try {
    const r = await fetch(url, { next: { revalidate: 1800 } });
    const j = await r.json();
    const items = j?.response?.body?.items?.item as { category: string; fcstTime: string; fcstValue: string }[] | undefined;
    if (!items?.length) return Response.json({ ok: false });
    const t0 = items.map((x) => x.fcstTime).sort()[0];
    const g: Record<string, string> = {};
    for (const x of items) if (x.fcstTime === t0) g[x.category] = x.fcstValue;
    const { icon, desc } = iconFor(Number(g.SKY), Number(g.PTY));
    return Response.json(
      { ok: true, temp: Number(g.T1H), icon, desc },
      { headers: { "Cache-Control": "public, max-age=1800" } },
    );
  } catch {
    return Response.json({ ok: false });
  }
}
