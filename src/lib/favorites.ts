"use client";

// المفضلة — بنخزن لينكات اللي بيمس عليها المستخدم
const KEY = "favorites";

function readAll(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function isFavorite(url: string): boolean {
  return readAll().includes(url);
}

export function toggleFavorite(url: string): boolean {
  const all = readAll();
  const idx = all.indexOf(url);
  if (idx >= 0) {
    all.splice(idx, 1);
  } else {
    all.push(url);
  }
  localStorage.setItem(KEY, JSON.stringify(all));
  return idx < 0; // رجّع الحالة الجديدة
}

export function favoriteCount(): number {
  return readAll().length;
}
