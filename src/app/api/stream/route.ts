import { NextRequest, NextResponse } from "next/server";

// Proxy للفيديو نفسه:
// - لو الملف playlist (m3u8) بنعيد كتابة لينكات الجواها عشان تمري هي كمان من عندنا
// - لو فيديو عادي (mp4/mkv) بنمرر الطلب زي ما هو مع دعم الـ Range (عشان الـ seek)
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target || !/^https?:\/\//.test(target)) {
    return NextResponse.json({ error: "رابط غير صحيح" }, { status: 400 });
  }

  const range = req.headers.get("range");
  let res: Response;
  try {
    res = await fetch(target, {
      headers: range ? { Range: range } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف";
    return NextResponse.json({ error: `فشل تحميل البث: ${msg}` }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isPlaylist =
    target.includes(".m3u8") || contentType.includes("mpegurl");

  if (isPlaylist) {
    const body = await res.text();
    const rewritten = rewritePlaylist(body, target);
    return new NextResponse(rewritten, {
      status: res.status,
      headers: { "content-type": "application/vnd.apple.mpegurl" },
    });
  }

  // فيديو عادي: نمرر الـ body مباشرة
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "accept-ranges", "content-range"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", "video/mp4");
  }
  headers.set("accept-ranges", headers.get("accept-ranges") ?? "bytes");
  return new NextResponse(res.body, { status: res.status, headers });
}

function proxied(absoluteUrl: string): string {
  return `/api/stream?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewritePlaylist(body: string, playlistUrl: string): string {
  const lines = body.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith("#")) {
      // سطور التعريفات: بنعيد كتابة URI="..." لو موجودة
      return trimmed.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
        const abs = new URL(uri, playlistUrl).toString();
        return `URI="${proxied(abs)}"`;
      });
    }

    // سطر لينك segment: نحوله لـ URL كامل ونمرره من الـ proxy
    const abs = new URL(trimmed, playlistUrl).toString();
    return proxied(abs);
  });
  return lines.join("\n");
}
