"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Play, Search } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import EpgList from "@/components/EpgList";
import Navbar from "@/components/Navbar";
import Player from "@/components/Player";
import { Category } from "@/components/types";
import { fetchLive, PlayItem } from "@/lib/content";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { errText, useLang } from "@/lib/i18n";
import { getCreds, requireCreds } from "@/lib/xtream";

export default function LivePage() {
  const router = useRouter();
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<PlayItem[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<PlayItem | null>(null);
  const [error, setError] = useState("");
  const [favTick, setFavTick] = useState(0); // عشان القلوب تتحدث أول بأول
  const creds = getCreds();

  useEffect(() => {
    const creds = requireCreds();
    if (!creds) {
      router.replace("/");
      return;
    }
    fetchLive(creds)
      .then((feed) => {
        setCategories(feed.categories);
        setChannels(feed.items);
      })
      .catch((e) => setError(errText(t, e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const filtered = useMemo(() => {
    return channels.filter(
      (c) =>
        (category === "all" ||
          (category === "favs" ? isFavorite(c.url) : c.category === category)) &&
        (!search || c.name.toLowerCase().includes(search.toLowerCase()))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, category, search, favTick]);

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
          title={playing?.name}
          sourceUrl={playing?.raw}
        />

        {playing && creds?.type === "xtream" && (
          <EpgList creds={creds} streamId={playing.id} />
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.live")}
            className="w-full rounded-xl border border-gray-700/80 bg-gray-900/50 py-2.5 pe-4 ps-11 transition placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <CategoryChips categories={categories} value={category} onChange={setCategory} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setPlaying(ch)}
              className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-start text-sm shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 ${
                playing?.id === ch.id
                  ? "border-emerald-500/80 bg-emerald-950/40"
                  : "border-gray-800/80 bg-gray-900/40 hover:border-emerald-500/50"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25 transition group-hover:bg-emerald-500/20">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
              <span className="truncate font-semibold text-gray-200">{ch.name}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(ch.url);
                  setFavTick((x) => x + 1);
                }}
                className="ms-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/40"
                title={t("common.favorites")}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition ${
                    isFavorite(ch.url) ? "fill-red-500 text-red-500" : "text-gray-500"
                  }`}
                />
              </span>
            </button>
          ))}
        </div>
        {!error && filtered.length === 0 && channels.length > 0 && (
          <p className="text-gray-500">{t("common.noResults")}</p>
        )}
      </main>
    </div>
  );
}
