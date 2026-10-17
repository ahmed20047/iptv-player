"use client";

import {
  Creds,
  M3uCreds,
  XtreamCreds,
  proxied,
  xtream,
  xtreamStreamUrl,
} from "./xtream";

// طبقة موحدة بين الواجهة ومصدر البيانات (Xtream API أو قايمة M3U)
// الواجهة بتستلم نفس الشكل مهما كان نوع الحساب

export interface Category {
  id: string;
  name: string;
}

export interface PlayItem {
  id: string;
  name: string;
  category: string;
  poster?: string;
  url: string; // جاهز للتشغيل (ممري من الـ proxy)
}

export interface Episode {
  num: string;
  title: string;
  url: string;
}

export interface SeriesEntry {
  key: string;
  name: string;
  category: string;
  poster?: string;
  loadEpisodes: () => Promise<Record<string, Episode[]>>;
}

export interface Feed {
  categories: Category[];
  items: PlayItem[];
}

const isXtream = (c: Creds): c is XtreamCreds => c.type === "xtream";
const isM3u = (c: Creds): c is M3uCreds => c.type === "m3u";

async function fetchM3U(creds: M3uCreds) {
  const res = await fetch(`/api/m3u?url=${encodeURIComponent(creds.url)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "error.badM3u");
  }
  return res.json();
}

function uniqueCategories(groups: string[]): Category[] {
  const seen = new Map<string, string>();
  for (const g of groups) {
    const name = g || "Other";
    if (!seen.has(name)) seen.set(name, name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: name, name }));
}

export async function fetchLive(creds: Creds): Promise<Feed> {
  if (isXtream(creds)) {
    const [cats, chs] = await Promise.all([
      xtream(creds, { action: "get_live_categories" }),
      xtream(creds, { action: "get_live_streams" }),
    ]);
    const categories: Category[] = (Array.isArray(cats) ? cats : []).map(
      (c: any) => ({ id: String(c.category_id), name: c.category_name })
    );
    const items: PlayItem[] = (Array.isArray(chs) ? chs : []).map((c: any) => ({
      id: String(c.stream_id),
      name: c.name,
      category: String(c.category_id),
      poster: c.stream_icon || undefined,
      url: xtreamStreamUrl(creds, "live", c.stream_id),
    }));
    return { categories, items };
  }

  const data = await fetchM3U(creds);
  const items: PlayItem[] = (data.live ?? []).map((e: any, i: number) => ({
    id: `live-${i}`,
    name: e.name,
    category: e.group || "Other",
    poster: e.logo || undefined,
    url: proxied(e.url),
  }));
  return { categories: uniqueCategories(items.map((i) => i.category)), items };
}

export async function fetchMovies(creds: Creds): Promise<Feed> {
  if (isXtream(creds)) {
    const [cats, vods] = await Promise.all([
      xtream(creds, { action: "get_vod_categories" }),
      xtream(creds, { action: "get_vod_streams" }),
    ]);
    const categories: Category[] = (Array.isArray(cats) ? cats : []).map(
      (c: any) => ({ id: String(c.category_id), name: c.category_name })
    );
    const items: PlayItem[] = (Array.isArray(vods) ? vods : []).map((m: any) => ({
      id: String(m.stream_id),
      name: m.name,
      category: String(m.category_id),
      poster: m.stream_icon || m.cover || undefined,
      url: xtreamStreamUrl(creds, "movie", m.stream_id, m.container_extension || "mp4"),
    }));
    return { categories, items };
  }

  const data = await fetchM3U(creds);
  const items: PlayItem[] = (data.movies ?? []).map((e: any, i: number) => ({
    id: `movie-${i}`,
    name: e.name,
    category: e.group || "Other",
    poster: e.logo || undefined,
    url: proxied(e.url),
  }));
  return { categories: uniqueCategories(items.map((i) => i.category)), items };
}

export async function fetchSeries(creds: Creds): Promise<{
  categories: Category[];
  series: SeriesEntry[];
}> {
  if (isXtream(creds)) {
    const [cats, list] = await Promise.all([
      xtream(creds, { action: "get_series_categories" }),
      xtream(creds, { action: "get_series" }),
    ]);
    const categories: Category[] = (Array.isArray(cats) ? cats : []).map(
      (c: any) => ({ id: String(c.category_id), name: c.category_name })
    );
    const series: SeriesEntry[] = (Array.isArray(list) ? list : []).map((s: any) => ({
      key: String(s.series_id),
      name: s.name,
      category: String(s.category_id),
      poster: s.cover || undefined,
      loadEpisodes: async () => {
        const info = await xtream(creds, {
          action: "get_series_info",
          series_id: String(s.series_id),
        });
        const eps = info?.episodes ?? {};
        const out: Record<string, Episode[]> = {};
        for (const [season, list2] of Object.entries(eps)) {
          out[season] = (Array.isArray(list2) ? list2 : []).map((ep: any) => ({
            num: String(ep.episode_num),
            title: ep.title || String(ep.episode_num),
            url: xtreamStreamUrl(
              creds,
              "series",
              ep.id,
              ep.container_extension || "mp4"
            ),
          }));
        }
        return out;
      },
    }));
    return { categories, series };
  }

  const data = await fetchM3U(creds);
  const series: SeriesEntry[] = (data.series ?? []).map((s: any, i: number) => ({
    key: `series-${i}`,
    name: s.name,
    category: s.group || "Other",
    poster: s.logo || undefined,
    loadEpisodes: async () =>
      Object.fromEntries(
        Object.entries(s.seasons ?? {}).map(([season, eps]: [string, any]) => [
          season,
          eps.map((ep: any) => ({ num: ep.num, title: ep.title, url: proxied(ep.url) })),
        ])
      ),
  }));
  return { categories: uniqueCategories(series.map((s) => s.category)), series };
}
