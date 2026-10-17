import { NextRequest, NextResponse } from "next/server";

// بيحمّل قايمة M3U ويحللها: قنوات مباشر / أفلام / مسلسلات (مجمّعة بمواسم وحلقات)
// ?url=<رابط القايمة>&check=1 → بيطلع بس أرقام سريعة للتحقق وقت تسجيل الدخول
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url");
  const check = sp.get("check") === "1";

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "error.badM3u" }, { status: 400 });
  }

  let text: string;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "error.badM3u" }, { status: 502 });
    }
    text = await res.text();
  } catch {
    return NextResponse.json({ error: "error.badM3u" }, { status: 502 });
  }

  const parsed = parseM3U(text);

  if (check) {
    return NextResponse.json({
      live: parsed.live.length,
      movies: parsed.movies.length,
      series: parsed.series.length,
    });
  }
  return NextResponse.json(parsed);
}

export interface M3uEntry {
  name: string;
  group: string;
  logo: string;
  url: string;
}

export interface M3uSeries {
  name: string;
  group: string;
  logo: string;
  seasons: Record<string, { num: string; title: string; url: string }[]>;
}

function parseM3U(text: string): {
  live: M3uEntry[];
  movies: M3uEntry[];
  series: M3uSeries[];
} {
  const live: M3uEntry[] = [];
  const movies: M3uEntry[] = [];
  const seriesMap = new Map<string, M3uSeries>();
  // مفاتيح بديلة للقايمات اللي بتكرر نفس الحلقة بأسماء مختلفة
  const seenSeriesUrls = new Set<string>();

  let pending: { name: string; group: string; logo: string } | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const attrs: Record<string, string> = {};
      for (const m of line.matchAll(/([\w-]+)="([^"]*)"/g)) {
        attrs[m[1]] = m[2];
      }
      const name = line.slice(line.lastIndexOf(",") + 1).trim();
      pending = {
        name,
        group: attrs["group-title"] ?? "",
        logo: attrs["tvg-logo"] ?? "",
      };
      continue;
    }

    if (line.startsWith("#")) continue; // أي توجيهات تانية
    if (!pending) continue;

    const entry = { ...pending, url: line };
    pending = null;

    const kind = classify(line);
    if (kind === "live") {
      live.push(entry);
      continue;
    }
    if (kind === "movie") {
      movies.push(entry);
      continue;
    }

    // مسلسل: جرب نمط S01E02 في الاسم
    const m = entry.name.match(/^(.*?)\s*[Ss](\d{1,2})[\s._-]*[Ee](\d{1,3})\s*(.*)$/);
    const baseName = m ? m[1].trim() : entry.name;
    const season = m ? String(parseInt(m[2], 10)) : "1";
    const epNum = m ? String(parseInt(m[3], 10)) : "1";
    const epTitle = m && m[4] ? m[4].replace(/^[-–—:\s]+/, "").trim() : "";

    const key = `${entry.group}|${baseName.toLowerCase()}`;
    let s = seriesMap.get(key);
    if (!s) {
      s = { name: baseName, group: entry.group, logo: entry.logo, seasons: {} };
      seriesMap.set(key, s);
    }
    // بعض القوائم بتحط كل الحلقات مرتين (روابط مختلفة لنفس الحلقة) — نمنع التكرار
    if (seenSeriesUrls.has(entry.url)) continue;
    seenSeriesUrls.add(entry.url);
    (s.seasons[season] ??= []).push({
      num: epNum,
      title: epTitle || `${epNum}`,
      url: entry.url,
    });
  }

  for (const s of seriesMap.values()) {
    for (const eps of Object.values(s.seasons)) {
      eps.sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10));
    }
  }

  return { live, movies, series: [...seriesMap.values()] };
}

function classify(url: string): "live" | "movie" | "series" {
  const path = url.replace(/^https?:\/\//, "");
  if (path.includes("/series/")) return "series";
  if (path.includes("/movie/")) return "movie";
  if (path.includes("/live/")) return "live";
  if (/\.(mkv|mp4|avi|mov|m4v)(\?|$)/i.test(path)) return "movie";
  return "live";
}
