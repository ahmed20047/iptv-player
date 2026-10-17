"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Film, Play, Radio, Search, Clapperboard } from "lucide-react";
import Navbar from "@/components/Navbar";
import Player from "@/components/Player";
import { fetchLive, fetchMovies, fetchSeries, PlayItem, SeriesEntry } from "@/lib/content";
import { errText, useLang } from "@/lib/i18n";
import { requireCreds } from "@/lib/xtream";

type Result =
  | { kind: "live"; item: PlayItem }
  | { kind: "movies"; item: PlayItem }
  | { kind: "series"; item: SeriesEntry };

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const [live, setLive] = useState<PlayItem[]>([]);
  const [movies, setMovies] = useState<PlayItem[]>([]);
  const [series, setSeries] = useState<SeriesEntry[]>([]);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<{ url: string; title: string; raw?: string } | null>(null);

  useEffect(() => {
    const creds = requireCreds();
    if (!creds) {
      router.replace("/");
      return;
    }
    Promise.all([fetchLive(creds), fetchMovies(creds), fetchSeries(creds)])
      .then(([l, m, s]) => {
        setLive(l.items);
        setMovies(m.items);
        setSeries(s.series);
      })
      .catch((e) => setError(errText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const groups = useMemo(() => {
    const match = (name: string) => name.toLowerCase().includes(q);
    return {
      live: q ? live.filter((i) => match(i.name)) : [],
      movies: q ? movies.filter((i) => match(i.name)) : [],
      series: q ? series.filter((i) => match(i.name)) : [],
    };
  }, [live, movies, series, q]);

  const sections = [
    { key: "live" as const, label: t("nav.live"), Icon: Radio, items: groups.live },
    { key: "movies" as const, label: t("nav.movies"), Icon: Film, items: groups.movies },
    { key: "series" as const, label: t("nav.series"), Icon: Clapperboard, items: groups.series },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/60 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Player src={playing?.url ?? null} title={playing?.title} sourceUrl={playing?.raw} />

        <h1 className="text-lg font-bold text-gray-300">
          {t("search.results")} {q && <span dir="ltr">"{q}"</span>}
        </h1>

        {!q && <p className="text-gray-500">{t("search.placeholder")}</p>}

        {q &&
          sections.map(({ key, label, Icon, items }) =>
            items.length === 0 ? null : (
              <section key={key}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-gray-400">
                  <Icon className="h-4 w-4" />
                  {label}{" "}
                  <span className="text-gray-600">({items.length})</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((it: any) => {
                    const name: string = it.name;
                    const poster: string | undefined = it.poster;
                    return (
                      <button
                        key={it.id ?? it.key}
                        onClick={() => {
                          if (key === "series") {
                            router.push("/series");
                            sessionStorage.setItem("open_series", String(it.key));
                          } else {
                            setPlaying({ url: it.url, title: name, raw: it.raw });
                          }
                        }}
                        className="group overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 text-start shadow-lg shadow-black/30 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/60"
                      >
                        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gray-800/60">
                          {poster ? (
                            <Image src={poster} alt={name} fill unoptimized className="object-cover" />
                          ) : (
                            <Icon className="h-8 w-8 text-gray-600" />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/90 text-white">
                              <Play className="h-4 w-4 fill-current" />
                            </span>
                          </span>
                        </div>
                        <p className="truncate px-3 py-2 text-xs font-semibold text-gray-200">{name}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )
          )}

        {q &&
          sections.every(({ items }) => items.length === 0) &&
          !error && <p className="text-gray-500">{t("common.noResults")}</p>}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
