# AURORA — Global Weather

A cinematic, full-planet weather experience. Search any city on Earth, feel the atmosphere change with the sky, and explore forecasts that look as good as they inform.

![AURORA](https://img.shields.io/badge/weather-global-cyan) ![Stack](https://img.shields.io/badge/React-Vite-violet) ![Data](https://img.shields.io/badge/Open--Meteo-free-blue)

## Why Aurora feels different

- **Living atmosphere** — backgrounds, particles, and light shift with clear skies, rain, snow, fog, heat, and thunderstorms
- **True global search** — type any city; geocoding covers the planet
- **Near me** — one-tap GPS + reverse geocode
- **24-hour strip + temperature curve** — actual vs feels-like, rain chance
- **10-day outlook** — temperature range bars and precipitation odds
- **Deep details** — UV, wind/gusts, humidity, pressure, cloud cover, air quality (AQI)
- **Sunrise & sunset** in the location’s timezone
- **Around the world** — live snapshot of major cities
- **Saved cities** — pin favorites (stored locally)
- **°C / °F and km/h / mph** toggles
- **Zero API keys** — [Open-Meteo](https://open-meteo.com) forecast, geocoding, and air quality

## Quick start

```bash
cd aurora-weather
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build   # production build (includes service worker + manifest)
npm run preview # preview production build — use this to test install
```

## Deploy to the real web (GitHub Pages)

This repo is set up so every push to `main` builds and publishes the site.

### One-time setup

1. Create a **public** GitHub repo named **`aurora-weather`**  
   → https://github.com/new  
   (do **not** add a README or .gitignore — the project already has them)

2. In Terminal, from this folder:

```bash
cd ~/aurora-weather
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/aurora-weather.git
git branch -M main
git push -u origin main
```

3. On GitHub open the repo → **Settings** → **Pages**  
   - **Source:** GitHub Actions  
   (not “Deploy from a branch”)

4. Wait ~1–2 minutes for the **Deploy to GitHub Pages** workflow (Actions tab) to finish.

5. Your live site will be:

```
https://YOUR_GITHUB_USERNAME.github.io/aurora-weather/
```

### Later updates

```bash
git add .
git commit -m "Update AURORA"
git push
```

GitHub rebuilds and redeploys automatically.

---

## Install as an app (PWA)

AURORA is a full Progressive Web App:

- **Web app manifest** — name, icons, theme, standalone display
- **Service worker** — caches shell + Open-Meteo responses (NetworkFirst) for offline resilience
- **Install prompt** — in-app “Install AURORA” banner when the browser supports it
- **Update prompt** — “Update available” when a new build is ready
- **Home-screen shortcut** — “Near me” opens GPS weather (`/?near=1`)
- **iOS meta tags** — apple-touch-icon, status bar, web-app-capable

### How to install

| Platform | Steps |
|----------|--------|
| **Chrome / Edge (desktop)** | Address bar install icon, or the in-app **Install** banner |
| **Chrome (Android)** | Menu → **Install app** / **Add to Home screen** |
| **Safari (iPhone/iPad)** | Share → **Add to Home Screen** |
| **Production check** | `npm run build && npm run preview` (HTTPS or localhost required) |

Dev mode also registers a service worker (`devOptions.enabled`) so you can smoke-test PWA behavior locally.

## Stack

| Layer | Tech |
|--------|------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Motion | Framer Motion |
| Charts | Recharts |
| Icons | Lucide |
| Weather | Open-Meteo Forecast + Geocoding + Air Quality APIs |

## Project structure

```
src/
  api/weather.ts       # Open-Meteo clients
  components/          # UI pieces
  lib/                 # units, storage, weather codes
  types/weather.ts
  App.tsx
```

## Notes

- Geolocation requires HTTPS (or localhost) and browser permission.
- Saved cities and unit preferences live in `localStorage`.
- No backend and no API keys required for development or demo use.

## License

MIT — enjoy the sky.
