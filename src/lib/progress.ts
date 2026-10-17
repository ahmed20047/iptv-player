"use client";

// حفظ مكان توقف المشاهدة لكل فيديو (بيتخزن في المتصفح)
export interface ProgressMeta {
  title?: string;
  poster?: string;
  page?: string; // movies / series
}

export interface Progress extends ProgressMeta {
  position: number; // ثواني
  duration: number;
  updated: number; // timestamp
}

const KEY = "watch_progress";

type ProgressMap = Record<string, Progress>;

function readAll(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

export function getProgress(url: string): Progress | null {
  return readAll()[url] ?? null;
}

export function saveProgress(
  url: string,
  position: number,
  duration: number,
  meta: ProgressMeta = {}
) {
  // البث المباشر مالوش مدة ثابتة — منحفظوش
  if (!Number.isFinite(duration) || position < 5) return;
  const all = readAll();
  all[url] = { position, duration, updated: Date.now(), ...meta };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // المساحة اتملت — نمسح الأقدم ونحاول تاني
    const entries = Object.entries(all).sort((a, b) => a[1].updated - b[1].updated);
    for (const [k] of entries.slice(0, Math.ceil(entries.length / 2))) {
      delete all[k];
    }
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}

export function removeProgress(url: string) {
  const all = readAll();
  delete all[url];
  localStorage.setItem(KEY, JSON.stringify(all));
}

// آخر اللي اتفرج عليه، مرتب بالأحدث، مع إمكانية الفلترة بالصفحة
export function getRecentProgress(page?: string, limit = 10): (Progress & { url: string })[] {
  return Object.entries(readAll())
    .map(([url, p]) => ({ ...p, url }))
    .filter((p) => p.duration > 0 && p.position > 15 && p.position < p.duration * 0.97)
    .filter((p) => !page || !p.page || p.page === page)
    .sort((a, b) => b.updated - a.updated)
    .slice(0, limit);
}

// 10:32 أو 1:02:15
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
