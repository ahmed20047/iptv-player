"use client";

import Hls from "hls.js";
import { Clapperboard, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { formatTime, getProgress, removeProgress, saveProgress } from "@/lib/progress";

const RESUME_THRESHOLD = 15; // أقل من كده بنعتبره من الأول
const SAVE_EVERY_MS = 5000;

export default function Player({
  src,
  title,
}: {
  src: string | null;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLang();
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setResumeAt(null);

    const nativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "";
    let hls: Hls | null = null;

    if (src.includes(".m3u8") && !nativeHls && Hls.isSupported()) {
      hls = new Hls({ manifestLoadingTimeOut: 20000 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          console.error("playback error:", data.type, data.details);
        }
      });
    } else {
      video.src = src;
    }

    // لما الفيديو يجهز: لو فيه مكان محفوظ نرجّع عنده ونوقّف ونسأله
    const onLoaded = () => {
      const saved = getProgress(src!);
      if (
        saved &&
        video.duration > 0 &&
        saved.position > RESUME_THRESHOLD &&
        saved.position < video.duration * 0.95
      ) {
        video.currentTime = saved.position;
        video.pause();
        setResumeAt(saved.position);
      }
    };

    let lastSave = 0;
    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSave > SAVE_EVERY_MS && video.duration > 0) {
        lastSave = now;
        saveProgress(src!, video.currentTime, video.duration);
      }
    };
    const onEnded = () => {
      removeProgress(src!);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.play().catch(() => {
      // المتصفح ممكن يمنع التشغيل التلقائي — المستخدم هيضغط play بنفسه
    });

    return () => {
      // بنقفل: نحفظ آخر مكان وقف عنده
      if (video.duration > 0 && !video.ended) {
        saveProgress(src!, video.currentTime, video.duration);
      }
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  function resume() {
    const video = videoRef.current;
    if (video) {
      setResumeAt(null);
      video.play().catch(() => {});
    }
  }

  function restart() {
    const video = videoRef.current;
    if (!video || !src) return;
    removeProgress(src);
    video.currentTime = 0;
    setResumeAt(null);
    video.play().catch(() => {});
  }

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 ring-1 ring-gray-800">
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="aspect-video w-full"
        />
        {!src && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
            <Clapperboard className="h-12 w-12 opacity-50" />
            <p className="text-sm">{t("player.hint")}</p>
          </div>
        )}

        {/* سؤال الكملة */}
        {src && resumeAt !== null && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-900/95 p-6 text-center shadow-2xl">
              <p className="text-sm text-gray-300">{t("resume.ask")}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-wide text-emerald-400" dir="ltr">
                {formatTime(resumeAt)}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={resume}
                  className="rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:brightness-110"
                >
                  {t("resume.yes")}
                </button>
                <button
                  onClick={restart}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/60 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-500"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("resume.no")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {title && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
          <p className="text-lg font-bold text-gray-100">{title}</p>
        </div>
      )}
    </div>
  );
}
