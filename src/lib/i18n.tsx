"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ar" | "en";

const dict = {
  ar: {
    "app.name": "IPTV Player",
    "nav.live": "بث مباشر",
    "nav.movies": "أفلام",
    "nav.series": "مسلسلات",
    "nav.logout": "خروج",
    "login.title": "تسجيل الدخول",
    "login.subtitle": "ادخل بيانات اشتراكك للبدء",
    "login.tabXtream": "Xtream Codes",
    "login.tabM3u": "رابط M3U",
    "login.server": "السيرفر (بدون http)",
    "login.port": "البورت",
    "login.username": "اسم المستخدم",
    "login.password": "كلمة السر",
    "login.m3uUrl": "رابط قائمة M3U",
    "login.m3uHint": "اللينك اللي بيطلع من مزود الخدمة بصيغة get.php...&type=m3u",
    "login.submit": "دخول",
    "login.submitting": "جاري الاتصال...",
    "login.brandTitle": "كل اللي بتحبه",
    "login.brandHighlight": "في مكان واحد",
    "login.brandSub":
      "مشغلك الخاص لاشتراك الـ IPTV — بياناتك محفوظة على جهازك وبتدخل مباشرة كل مرة.",
    "login.featureLive": "قنوات مباشرة مقسّمة تصنيفات",
    "login.featureMovies": "مكتبة أفلام بالبوسترات",
    "login.featureSeries": "مسلسلات بمواسم وحلقات",
    "search.live": "ابحث عن قناة...",
    "search.movies": "ابحث عن فيلم...",
    "search.series": "ابحث عن مسلسل...",
    "panel.categories": "التصنيفات",
    "common.all": "الكل",
    "common.noResults": "مفيش نتائج",
    "common.loading": "جاري التحميل...",
    "player.hint": "اختار قناة أو فيلم أو حلقة عشان يبدأ التشغيل",
    "series.back": "رجوع لكل المسلسلات",
    "series.season": "الموسم {n}",
    "series.episode": "حلقة {n}",
    "error.badCreds": "بيانات الدخول غلط — راجع الاسم والباسورد والسيرفر والبورت",
    "error.badM3u": "مش قادر أقرا قائمة الـ M3U — اتأكد من الرابط",
    "error.serverUnreachable": "مش قادر أوصل لسيرفر الـ IPTV — اتأكد من السيرفر والبورت",
    "error.generic": "حصل خطأ، حاول تاني",
  },
  en: {
    "app.name": "IPTV Player",
    "nav.live": "Live TV",
    "nav.movies": "Movies",
    "nav.series": "Series",
    "nav.logout": "Log out",
    "login.title": "Sign in",
    "login.subtitle": "Enter your subscription details to get started",
    "login.tabXtream": "Xtream Codes",
    "login.tabM3u": "M3U Link",
    "login.server": "Server (without http)",
    "login.port": "Port",
    "login.username": "Username",
    "login.password": "Password",
    "login.m3uUrl": "M3U playlist URL",
    "login.m3uHint": "The get.php...&type=m3u link your provider gives you",
    "login.submit": "Sign in",
    "login.submitting": "Connecting...",
    "login.brandTitle": "Everything you love",
    "login.brandHighlight": "in one place",
    "login.brandSub":
      "Your own IPTV player — your details stay on your device and you're signed in automatically every time.",
    "login.featureLive": "Live channels organized by category",
    "login.featureMovies": "Movie library with posters",
    "login.featureSeries": "Series with seasons and episodes",
    "search.live": "Search for a channel...",
    "search.movies": "Search for a movie...",
    "search.series": "Search for a series...",
    "panel.categories": "Categories",
    "common.all": "All",
    "common.noResults": "No results",
    "common.loading": "Loading...",
    "player.hint": "Pick a channel, movie or episode to start watching",
    "series.back": "Back to all series",
    "series.season": "Season {n}",
    "series.episode": "Episode {n}",
    "error.badCreds": "Wrong credentials — check the username, password, server and port",
    "error.badM3u": "Couldn't read the M3U playlist — check the link",
    "error.serverUnreachable": "Can't reach the IPTV server — check the server and port",
    "error.generic": "Something went wrong, try again",
  },
} as const;

export type TKey = keyof typeof dict.ar;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangCtx>({
  lang: "ar",
  setLang: () => {},
  t: (k) => dict.ar[k],
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (key: TKey, vars?: Record<string, string | number>) => {
    let s: string = dict[lang][key] ?? dict.ar[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

// بتحول رسالة خطأ (ممكن تكون مفتاح ترجمة) لنص معروض
export function errText(t: LangCtx["t"], e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  return msg in dict.ar ? t(msg as TKey) : msg || t("error.generic");
}
