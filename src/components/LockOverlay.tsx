"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { getPin, isLocked, lock, setPin, unlock } from "@/lib/lock";
import { useLang } from "@/lib/i18n";

// قفل البرنامج بكود سر — بيغطي الشاشة كلها لحد ما الكود يتكتب
export default function LockOverlay() {
  const { t } = useLang();
  const [mode, setMode] = useState<"hidden" | "set" | "enter">("hidden");
  const [pin, setLocalPin] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (isLocked()) setMode("enter");
    const handler = () => setMode("set");
    window.addEventListener("app:lock-setup", handler);
    return () => window.removeEventListener("app:lock-setup", handler);
  }, []);

  if (mode === "hidden") return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return;
    if (mode === "set") {
      setPin(pin);
      lock();
      setMode("enter");
      setLocalPin("");
      return;
    }
    if (unlock(pin)) {
      setMode("hidden");
      setLocalPin("");
      setWrong(false);
      window.location.reload();
    } else {
      setWrong(true);
      setLocalPin("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 p-6 backdrop-blur">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-2xl"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Lock className="h-6 w-6 text-emerald-400" />
        </span>
        <h2 className="text-lg font-bold">
          {mode === "set" ? t("lock.set") : t("lock.enter")}
        </h2>
        <input
          type="password"
          inputMode="numeric"
          dir="ltr"
          value={pin}
          onChange={(e) => {
            setLocalPin(e.target.value);
            setWrong(false);
          }}
          autoFocus
          className="w-full rounded-xl border border-gray-700/80 bg-gray-950/70 px-3.5 py-2.5 text-center text-xl tracking-[0.5em] outline-none focus:border-emerald-500"
        />
        {wrong && <p className="text-sm text-red-400">{t("lock.wrong")}</p>}
        <button
          type="submit"
          disabled={pin.length < 4}
          className="w-full rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {mode === "set" ? t("login.submit") : t("lock.unlock")}
        </button>
      </form>
    </div>
  );
}
