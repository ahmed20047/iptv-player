"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clapperboard,
  Film,
  Languages,
  Lock,
  LogOut,
  Play,
  Radio,
  Search,
} from "lucide-react";
import { useState } from "react";
import { getPin, lock } from "@/lib/lock";
import { useLang } from "@/lib/i18n";
import { getCreds, logout } from "@/lib/xtream";

// شريط علوي: اللوجو واللينكات فوق ع اليمين، والمستخدم والتسجيل خروج ع الشمال
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const creds = getCreds();
  const { lang, setLang, t } = useLang();
  const [searchQ, setSearchQ] = useState("");

  const links = [
    { href: "/live", label: t("nav.live"), Icon: Radio },
    { href: "/movies", label: t("nav.movies"), Icon: Film },
    { href: "/series", label: t("nav.series"), Icon: Clapperboard },
  ];

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-800/70 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link
          href="/live"
          className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/60">
            <Play className="h-4 w-4 fill-current" />
          </span>
          <span>
            IPTV{" "}
            <span className="bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Player
            </span>
          </span>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
          }}
          className="relative hidden md:block"
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-56 rounded-xl border border-gray-800 bg-gray-900/60 py-2 pe-3 ps-9 text-sm transition placeholder:text-gray-600 outline-none focus:w-72 focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-1.5">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "text-emerald-300"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-l from-emerald-400 to-teal-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ms-auto flex items-center gap-3">
          {creds && (
            <span className="hidden items-center gap-2 rounded-full border border-gray-800 bg-gray-900/80 py-1.5 pe-4 ps-1.5 text-sm text-gray-300 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                {(creds.type === "xtream" ? creds.username : "M").slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-32 truncate">
                {creds.type === "xtream" ? creds.username : "M3U"}
              </span>
            </span>
          )}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
            title="Language"
          >
            <Languages className="h-4 w-4" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button
            onClick={() => {
              if (getPin()) {
                lock();
                router.replace("/");
              } else {
                // أول مرة: نحدد الكود الأول من النافذة
                window.dispatchEvent(new Event("app:lock-setup"));
              }
            }}
            className="rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
            title={t("lock.action")}
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
            title={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}
