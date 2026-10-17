import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IPTV Player",
    short_name: "IPTV",
    description: "Live TV, movies and series player",
    start_url: "/live",
    display: "standalone",
    background_color: "#070a12",
    theme_color: "#070a12",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
