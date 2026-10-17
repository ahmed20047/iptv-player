"use client";

import { useEffect, useState } from "react";
import { Tv } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { XtreamCreds, xtream } from "@/lib/xtream";

interface EpgEntry {
  title: string;
  description?: string;
  start: number; // timestamp بالثواني
  stop: number;
}

// جدول برامج القناة (بيشتغل مع حسابات Xtream بس)
export default function EpgList({
  creds,
  streamId,
}: {
  creds: XtreamCreds;
  streamId: string;
}) {
  const { lang, t } = useLang();
  const [entries, setEntries] = useState<EpgEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    setEntries(null);
    xtream<any>(creds, { action: "short_epg", stream_id: streamId, limit: "6" })
      .then((data) => {
        if (!alive) return;
        const list: EpgEntry[] = (data?.epg_listings ?? []).map((e: any) => {
          let title = e.title ?? "";
          let desc = e.description ?? "";
          // أغلب السيرفرات بتبعت العناوين base64
          try {
            if (title && /^[\w+/=]+$/.test(title)) title = atob(title);
            if (desc && /^[\w+/=]{20,}$/.test(desc)) desc = atob(desc);
          } catch {
            // مش base64 — نمشي بالنص زي ما هو
          }
          return {
            title,
            description: desc,
            start: Number(e.start_timestamp),
            stop: Number(e.stop_timestamp),
          };
        });
        setEntries(list.filter((e) => e.stop > Date.now() / 1000));
      })
      .catch(() => alive && setEntries([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const timeFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const now = Date.now() / 1000;

  return (
    <section className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-gray-400">
        <Tv className="h-4 w-4" />
        {t("epg.title")}
      </h2>
      {entries === null && <p className="text-sm text-gray-500">{t("epg.loading")}</p>}
      {entries?.length === 0 && (
        <p className="text-sm text-gray-500">{t("epg.empty")}</p>
      )}
      <ul className="space-y-2">
        {entries?.map((e, i) => {
          const isNow = e.start <= now && e.stop > now;
          return (
            <li
              key={i}
              className={`rounded-xl border p-3 ${
                isNow
                  ? "border-emerald-500/50 bg-emerald-950/30"
                  : "border-gray-800/80 bg-gray-950/40"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <span dir="ltr" className="text-gray-400">
                  {timeFmt.format(new Date(e.start * 1000))} –{" "}
                  {timeFmt.format(new Date(e.stop * 1000))}
                </span>
                {isNow && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">
                    {t("epg.now")}
                  </span>
                )}
                {!isNow && i === 0 && (
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-400">
                    {t("epg.next")}
                  </span>
                )}
              </div>
              {e.title && <p className="mt-1 text-sm font-semibold">{e.title}</p>}
              {e.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{e.description}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
