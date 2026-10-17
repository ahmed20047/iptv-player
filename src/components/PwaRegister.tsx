"use client";

import { useEffect } from "react";

// بيسجل الـ service worker عشان التطبيق يتنصب كـ PWA على الموبايل
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
