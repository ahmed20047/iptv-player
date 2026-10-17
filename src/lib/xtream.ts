"use client";

// نوعين حساب: Xtream Codes (سيرفر/بورت/اسم/باسورد) أو رابط M3U مباشر
export type XtreamCreds = {
  type: "xtream";
  server: string;
  port: string;
  username: string;
  password: string;
};

export type M3uCreds = {
  type: "m3u";
  url: string;
};

export type Creds = XtreamCreds | M3uCreds;

const CREDS_KEY = "xtream_creds";
// نسخة تانية بنحتفظ بيها حتى بعد تسجيل الخروج عشان الحقول تفضل متعبية
const LAST_KEY = "xtream_last";

function readJson(key: string): Creds | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Creds;
  } catch {
    return null;
  }
}

export const getCreds = () => readJson(CREDS_KEY);
export const requireCreds = getCreds;
// آخر بيانات اتسجلت بيها — بتفضل محفوظة حتى بعد الخروج
export const getLastCreds = () => readJson(LAST_KEY);

export function saveCreds(creds: Creds) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  localStorage.setItem(LAST_KEY, JSON.stringify(creds));
}

export function logout() {
  // بنشيل الدخول بس — بنسيب LAST_KEY عشان الحقول تفضل متعبية المرة الجاية
  localStorage.removeItem(CREDS_KEY);
}

// ===== حسابات متعددة =====
export interface Account {
  id: string;
  label: string;
  creds: Creds;
}

const ACCOUNTS_KEY = "iptv_accounts";

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as Account[];
  } catch {
    return [];
  }
}

export function accountLabel(creds: Creds): string {
  return creds.type === "xtream" ? creds.username : "M3U";
}

// بيضيف الحساب أو يحدّثه لو موجود بنفس البيانات
export function upsertAccount(creds: Creds): string {
  const accounts = getAccounts();
  const label = accountLabel(creds);
  const existing = accounts.find(
    (a) => JSON.stringify(a.creds) === JSON.stringify(creds)
  );
  if (existing) return existing.id;
  const id = `${Date.now()}`;
  accounts.push({ id, label, creds });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return id;
}

export function removeAccount(id: string) {
  const accounts = getAccounts().filter((a) => a.id !== id);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function xtreamBaseUrl(creds: XtreamCreds): string {
  return `http://${creds.server}:${creds.port}`;
}

// أي نداء للـ Xtream API بيمر من علي السيرفر المحلي عشان نتخطى مشكلة CORS
export async function xtream<T = any>(
  creds: XtreamCreds,
  params: Record<string, string> = {}
): Promise<T> {
  const qs = new URLSearchParams({
    base: xtreamBaseUrl(creds),
    username: creds.username,
    password: creds.password,
    ...params,
  });
  const res = await fetch(`/api/xtream?${qs.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "error.serverUnreachable");
  }
  return (await res.json()) as T;
}

// لينك تشغيل جاهز (ممري من الـ proxy المحلي)
export function proxied(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

export function xtreamStreamUrl(
  creds: XtreamCreds,
  kind: "live" | "movie" | "series",
  id: number | string,
  ext = "m3u8"
): string {
  return proxied(
    `${xtreamBaseUrl(creds)}/${kind}/${creds.username}/${creds.password}/${id}.${ext}`
  );
}
