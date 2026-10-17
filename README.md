# IPTV Player

A clean, simple IPTV player for the browser. Point it at your own subscription and watch live TV, movies and series — no clutter, no ads, nothing leaves your machine except requests to your own provider.

## Features

- **Two login types** — Xtream Codes (server / port / username / password) or a plain M3U link
- Live TV, movies and series, auto-sorted into categories
- Series with seasons and episodes
- Arabic and English interface (RTL/LTR), switchable from the navbar
- Streams go through a tiny local proxy, so no CORS headaches
- Login details are saved on your device — you sign in once

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000, pick your login type, enter your provider details and you're in.

## Tech

- Next.js (App Router)
- Tailwind CSS
- hls.js for HLS playback
- Two API routes act as local proxies: one for the Xtream API, one for video streams and M3U parsing

> The app is just a player — it comes with no content. Use it with content you're allowed to watch.

## To do

- EPG (program guide) for live channels
- Favorites and watch history
- Desktop packaging
