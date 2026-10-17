"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Film, Play, Search } from "lucide-react";
import CategoryPanel from "@/components/CategoryPanel";
import Navbar from "@/components/Navbar";
import Player from "@/components/Player";
import { Category } from "@/components/types";
import { fetchMovies, PlayItem } from "@/lib/content";
import { errText, useLang } from "@/lib/i18n";
import { requireCreds } from "@/lib/xtream";

export default function MoviesPage() {
  const router = useRouter();
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<PlayItem[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<PlayItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const creds = requireCreds();
    if (!creds) {
      router.replace("/");
      return;
    }
    fetchMovies(creds)
      .then((feed) => {
        setCategories(feed.categories);
        setMovies(feed.items);
      })
      .catch((e) => setError(errText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const filtered = useMemo(
    () =>
      movies.filter(
        (m) =>
          (category === "all" || m.category === category) &&
          (!search || m.name.toLowerCase().includes(search.toLowerCase()))
      ),
    [movies, category, search]
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

        <Player src={playing?.url ?? null} title={playing?.name} />

        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.movies")}
            className="w-full rounded-xl border border-gray-700/80 bg-gray-900/50 py-2.5 pe-4 ps-11 transition placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-start gap-4">
          {/* التصنيفات على اليمين في العربي */}
          <CategoryPanel categories={categories} value={category} onChange={setCategory} />
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setPlaying(m)}
                className={`group overflow-hidden rounded-2xl border bg-gray-900/40 text-start shadow-lg shadow-black/30 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-emerald-950/40 ${
                  playing?.id === m.id ? "border-emerald-500/80" : "border-gray-800/80"
                }`}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-800/60">
                  {m.poster ? (
                    <Image
                      src={m.poster}
                      alt={m.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                      <Film className="h-10 w-10 opacity-60" />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-xl">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                </div>
                <p className="truncate px-3 py-2.5 text-xs font-semibold text-gray-200">{m.name}</p>
              </button>
            ))}
          </div>
        </div>
        {!error && filtered.length === 0 && movies.length > 0 && (
          <p className="text-gray-500">{t("common.noResults")}</p>
        )}
      </main>
    </div>
  );
}
