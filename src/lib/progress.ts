"use client";

// حفظ مكان توقف المشاهدة لكل فيديو (بيتخزن في المتصفح)
export interface Progress {
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

export function saveProgress(url: string, position: number, duration: number) {
  if (!duration || position < 5) return;
  const all = readAll();
  all[url] = { position, duration, updated: Date.now() };
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
