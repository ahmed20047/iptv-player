"use client";

import Hls from "hls.js";
import { Clapperboard } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";

export default function Player({
  src,
  title,
}: {
  src: string | null;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLang();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const nativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "";
    let hls: Hls | null = null;

    if (src.includes(".m3u8") && !nativeHls && Hls.isSupported()) {
      hls = new Hls({ manifestLoadingTimeOut: 20000 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          console.error("خطأ تشغيل:", data.type, data.details);
        }
      });
    } else {
      video.src = src;
    }

    video.play().catch(() => {
      // المتصفح ممكن يمنع التشغيل التلقائي — المستخدم هيضغط play بنفسه
    });

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

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
