"use client";

// قفل البرنامج بكود سر (بيتخزن مشفر بسيط في المتصفح)
const PIN_KEY = "app_pin";
const LOCKED_KEY = "app_locked";

function hash(pin: string): string {
  // مش تشفير عسكري — بس عشان الكود ميتخزنش نص صريح
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 31 + pin.charCodeAt(i)) | 0;
  }
  return String(h);
}

export function getPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_KEY);
}

export function setPin(pin: string) {
  localStorage.setItem(PIN_KEY, hash(pin));
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY);
  localStorage.removeItem(LOCKED_KEY);
}

export function isLocked(): boolean {
  if (typeof window === "undefined") return false;
  return !!getPin() && localStorage.getItem(LOCKED_KEY) === "1";
}

export function lock() {
  if (getPin()) localStorage.setItem(LOCKED_KEY, "1");
}

export function unlock(pin: string): boolean {
  if (hash(pin) === getPin()) {
    localStorage.removeItem(LOCKED_KEY);
    return true;
  }
  return false;
}
