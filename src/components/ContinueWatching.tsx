"use client";

import Image from "next/image";
import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { formatTime, getRecentProgress, removeProgress } from "@/lib/progress";

// صف "كمّلت مشاهدة" — آخر اللي اتفرج عليه ووقف في نصه، جاهز يكمل بضغطة
export default function ContinueWatching({
  page,
  onSelect,
}: {
  page: string;
  onSelect: (item: { url: string; title: string; poster?: string }) => void;
}) {
  const { t } = useLang();
  const [items, setItems] = useState<ReturnType<typeof getRecentProgress>>([]);

  useEffect(() => {
    setItems(getRecentProgress(page));
  }, [page]);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-400">
        {t("continue.title")}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => {
          const pct = Math.min(100, Math.round((p.position / p.duration) * 100));
          return (
            <div
              key={p.url}
              className="group relative w-40 shrink-0 overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-lg shadow-black/30 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/60"
            >
              <button
                onClick={() =>
                  onSelect({ url: p.url, title: p.title ?? "", poster: p.poster })
                }
                className="block w-full text-start"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-800/60">
                  {p.poster ? (
                    <Image src={p.poster} alt={p.title ?? ""} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                      <Play className="h-7 w-7 opacity-60" />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-xl">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-0 h-1 bg-gray-700"
                    dir="ltr"
                  >
                    <span
                      className="block h-full bg-gradient-to-l from-emerald-400 to-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-semibold text-gray-200">
                    {p.title || "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500" dir="ltr">
                    {formatTime(p.position)} · {pct}%
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  removeProgress(p.url);
                  setItems((prev) => prev.filter((x) => x.url !== p.url));
                }}
                title={t("continue.remove")}
                className="absolute end-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full bg-black/70 text-gray-300 transition hover:text-red-400 group-hover:flex"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
