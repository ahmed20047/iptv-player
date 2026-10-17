"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clapperboard, Film, Link2, MonitorPlay, Radio, Server } from "lucide-react";
import { errText, useLang } from "@/lib/i18n";
import { Creds, getLastCreds, saveCreds, xtream } from "@/lib/xtream";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [tab, setTab] = useState<"xtream" | "m3u">("xtream");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("80");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // لو مش مسجل: نعبّي الحقول بآخر بيانات محفوظة (بتفضل محفوظة حتى بعد الخروج)
    const last = getLastCreds();
    if (last) {
      if (last.type === "xtream") {
        setServer(last.server);
        setPort(last.port);
        setUsername(last.username);
        setPassword(last.password);
      } else {
        setM3uUrl(last.url);
        setTab("m3u");
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let creds: Creds;
      if (tab === "xtream") {
        const c: Creds = {
          type: "xtream",
          server: server.trim(),
          port: port.trim() || "80",
          username: username.trim(),
          password: password.trim(),
        };
        if (c.type !== "xtream") throw new Error("error.generic");
        const data = await xtream(c);
        if (!data?.user_info || Number(data.user_info.auth) !== 1) {
          throw new Error("error.badCreds");
        }
        const exp = Number(data.user_info.exp_date) * 1000;
        if (exp) console.log("subscription expires:", new Date(exp).toISOString());
        creds = c;
      } else {
        const url = m3uUrl.trim();
        const res = await fetch(`/api/m3u?check=1&url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("error.badM3u");
        const counts = await res.json();
        if (!counts.live && !counts.movies && !counts.series) {
          throw new Error("error.badM3u");
        }
        console.log("playlist:", counts);
        creds = { type: "m3u", url };
      }
      saveCreds(creds);
      router.replace("/live");
    } catch (err) {
      setError(errText(t, err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/50 shadow-2xl backdrop-blur lg:grid-cols-2">
        {/* جزء البراندينج */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-emerald-950/80 via-gray-900 to-gray-950 p-10 lg:flex">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <MonitorPlay className="h-6 w-6 text-emerald-400" />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold leading-snug">
              {t("login.brandTitle")}
              <br />
              <span className="bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t("login.brandHighlight")}
              </span>
            </h1>
            <p className="mt-3 leading-relaxed text-gray-400">{t("login.brandSub")}</p>
          </div>
          <ul className="mt-10 space-y-3 text-sm text-gray-300">
            <Feature Icon={Radio} text={t("login.featureLive")} />
            <Feature Icon={Film} text={t("login.featureMovies")} />
            <Feature Icon={Clapperboard} text={t("login.featureSeries")} />
          </ul>
        </div>

        {/* فورم الدخول */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 lg:hidden">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <MonitorPlay className="h-5 w-5" />
            </span>
          </div>
          <h2 className="text-2xl font-bold">{t("login.title")}</h2>
          <p className="mt-1 text-sm text-gray-400">{t("login.subtitle")}</p>

          {/* تابات: Xtream أو M3U */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-gray-800 bg-gray-950/60 p-1">
            <TabButton active={tab === "xtream"} onClick={() => setTab("xtream")} icon={<Server className="h-4 w-4" />}>
              {t("login.tabXtream")}
            </TabButton>
            <TabButton active={tab === "m3u"} onClick={() => setTab("m3u")} icon={<Link2 className="h-4 w-4" />}>
              {t("login.tabM3u")}
            </TabButton>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab === "xtream" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label={t("login.server")} value={server} onChange={setServer}
                      placeholder="my.server.tv" required />
                  </div>
                  <Field label={t("login.port")} value={port} onChange={setPort} placeholder="8080" required />
                </div>
                <Field label={t("login.username")} value={username} onChange={setUsername}
                  placeholder="username" required />
                <Field label={t("login.password")} value={password} onChange={setPassword}
                  placeholder="password" type="password" required />
              </>
            ) : (
              <Field label={t("login.m3uUrl")} value={m3uUrl} onChange={setM3uUrl}
                placeholder="http://provider.tv/get.php?...&type=m3u" required />
            )}

            {tab === "m3u" && (
              <p className="text-xs leading-relaxed text-gray-500">{t("login.m3uHint")}</p>
            )}

            {error && (
              <p className="rounded-xl border border-red-900/50 bg-red-950/60 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 py-3 font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-gray-800 text-emerald-300 shadow"
          : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Feature({ Icon, text }: { Icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-800/80 ring-1 ring-gray-700">
        <Icon className="h-4.5 w-4.5 text-emerald-400" />
      </span>
      {text}
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-400">{label}</span>
      <input
        type={type}
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-700/80 bg-gray-950/70 px-3.5 py-2.5 text-left transition placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}
