"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Clapperboard, Heart, Play, Search } from "lucide-react";
import CategoryPanel from "@/components/CategoryPanel";
import ContinueWatching from "@/components/ContinueWatching";
import Navbar from "@/components/Navbar";
import Player from "@/components/Player";
import { Category } from "@/components/types";
import { Episode, fetchSeries, SeriesEntry } from "@/lib/content";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { errText, useLang } from "@/lib/i18n";
import { requireCreds } from "@/lib/xtream";

export default function SeriesPage() {
  const router = useRouter();
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesEntry[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [openSeries, setOpenSeries] = useState<SeriesEntry | null>(null);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [season, setSeason] = useState<string>("");
  const [playing, setPlaying] = useState<{
    url: string;
    title: string;
    poster?: string;
    raw?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [favTick, setFavTick] = useState(0); // عشان القلوب تتحدث أول بأول

  useEffect(() => {
    const creds = requireCreds();
    if (!creds) {
      router.replace("/");
      return;
    }
    fetchSeries(creds)
      .then((feed) => {
        setCategories(feed.categories);
        setSeriesList(feed.series);
        // لو جايين من صفحة البحث: افتح المسلسل المطلوب على طول
        const wanted = sessionStorage.getItem("open_series");
        if (wanted) {
          sessionStorage.removeItem("open_series");
          const found = feed.series.find((s) => s.key === wanted);
          if (found) open(found);
        }
      })
      .catch((e) => setError(errText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const filtered = useMemo(
    () =>
      seriesList.filter(
        (s) =>
          (category === "all" ||
            (category === "favs" ? isFavorite(s.poster ?? s.key) : s.category === category)) &&
          (!search || s.name.toLowerCase().includes(search.toLowerCase()))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seriesList, category, search, favTick]
  );

  async function open(s: SeriesEntry) {
    setOpenSeries(s);
    setEpisodes({});
    setPlaying(null);
    try {
      const eps = await s.loadEpisodes();
      setEpisodes(eps);
      const seasons = Object.keys(eps).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      if (seasons.length) setSeason(seasons[0]);
    } catch (e) {
      setError(errText(t, e));
    }
  }

  function playEpisode(ep: Episode) {
    if (!openSeries) return;
    setPlaying({
      url: ep.url,
      raw: ep.raw,
      poster: openSeries.poster,
      title: `${openSeries.name} — ${t("series.episode", { n: ep.num })}${
        ep.title && ep.title !== ep.num ? `: ${ep.title}` : ""
      }`,
    });
  }

  const seasonKeys = Object.keys(episodes).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-4 p-6">
        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/60 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Player
          src={playing?.url ?? null}
          title={playing?.title}
          poster={playing?.poster}
          page="series"
          sourceUrl={playing?.raw}
        />

        <ContinueWatching
          page="series"
          onSelect={({ url, title, poster }) => setPlaying({ url, title, poster })}
        />

        <div className="flex items-start gap-4">
          {/* التصنيفات على اليمين في العربي */}
          <CategoryPanel categories={categories} value={category} onChange={setCategory} />

          <div className="flex-1 space-y-3">
            {openSeries ? (
              <>
                <button
                  onClick={() => setOpenSeries(null)}
                  className="flex w-fit items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:text-gray-100"
                >
                  <ArrowRight className="h-4 w-4" />
                  {t("series.back")}
                </button>
                <h2 className="text-2xl font-extrabold">{openSeries.name}</h2>

                <div className="flex flex-wrap gap-2">
                  {seasonKeys.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeason(s)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        season === s
                          ? "bg-gradient-to-l from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/50"
                          : "bg-gray-900/60 text-gray-300 ring-1 ring-gray-800 hover:bg-gray-800"
                      }`}
                    >
                      {t("series.season", { n: s })}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(episodes[season] ?? []).map((ep) => (
                    <button
                      key={`${ep.num}-${ep.url}`}
                      onClick={() => playEpisode(ep)}
                      className={`group flex items-center gap-3 rounded-2xl border p-4 text-start text-sm shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 ${
                        playing?.url === ep.url
                          ? "border-emerald-500/80 bg-emerald-950/40"
                          : "border-gray-800/80 bg-gray-900/40 hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25 transition group-hover:bg-emerald-500/20">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                      <span className="truncate">
                        <span className="font-bold text-emerald-300">
                          {t("series.episode", { n: ep.num })}
                        </span>{" "}
                        <span className="text-gray-400">{ep.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("search.series")}
                    className="w-full rounded-xl border border-gray-700/80 bg-gray-900/50 py-2.5 pe-4 ps-11 transition placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {filtered.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => open(s)}
                      className="group overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 text-start shadow-lg shadow-black/30 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-emerald-950/40"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-800/60">
                        {s.poster ? (
                          <Image
                            src={s.poster}
                            alt={s.name}
                            fill
                            unoptimized
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-600">
                            <Clapperboard className="h-10 w-10 opacity-60" />
                          </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-xl">
                            <Play className="h-5 w-5 fill-current" />
                          </span>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(s.poster ?? s.key);
                            setFavTick((x) => x + 1);
                          }}
                          className="absolute start-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 backdrop-blur transition hover:bg-black/80"
                          title={t("common.favorites")}
                        >
                          <Heart
                            className={`h-4 w-4 transition ${
                              isFavorite(s.poster ?? s.key)
                                ? "fill-red-500 text-red-500"
                                : "text-white"
                            }`}
                          />
                        </span>
                      </div>
                      <p className="truncate px-3 py-2.5 text-xs font-semibold text-gray-200">{s.name}</p>
                    </button>
                  ))}
                </div>
                {!error && filtered.length === 0 && seriesList.length > 0 && (
                  <p className="text-gray-500">{t("common.noResults")}</p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
