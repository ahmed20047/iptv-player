import { NextRequest, NextResponse } from "next/server";

// Proxy بسيط: بيستقبل طلب المتصفح ويحوله لسيرفر الـ IPTV ويرجع الـ JSON
// ده بيحل مشكلة CORS لأن المتصفح بيكلم سيرفرنا المحلي مش سيرفر الـ IPTV
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const base = sp.get("base");
  const username = sp.get("username");
  const password = sp.get("password");

  if (!base || !username || !password) {
    return NextResponse.json(
      { error: "error.badCreds" },
      { status: 400 }
    );
  }

  if (!/^https?:\/\//.test(base)) {
    return NextResponse.json({ error: "رابط السيرفر غير صحيح" }, { status: 400 });
  }

  const upstream = new URL("/player_api.php", base);
  upstream.searchParams.set("username", username);
  upstream.searchParams.set("password", password);
  for (const [key, value] of sp.entries()) {
    // نتجاهل المفاتيح بتاعتنا ونمرر الباقي (action, category_id, series_id ...)
    if (!["base", "username", "password", "_"].includes(key)) {
      upstream.searchParams.set(key, value);
    }
  }

  try {
    const res = await fetch(upstream.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "error.serverUnreachable" },
      { status: 502 }
    );
  }
}
