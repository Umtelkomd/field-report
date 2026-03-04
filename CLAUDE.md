# CLAUDE.md — Field Report App

## What Is This?
PWA for fiber installation field technicians. Dual-client (Glasfaser Plus + Westconnect) form submission with photo capture, offline sync, and admin dashboard.

## Stack
- React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Zustand 5
- vite-plugin-pwa (Workbox autoUpdate)
- No routing library — Zustand `view` state (linear flow)

## Repo & Deploy
- **Local:** `~/Dev/field-report/`
- **GitHub:** jarl9801/field-report
- **Live:** https://jarl9801.github.io/field-report/
- **Deploy:** Push to `main` → GitHub Actions builds & deploys to Pages
- **CI:** `.github/workflows/deploy.yml` — `npm ci && npm run build && cp citas.json dist/`

## Architecture
```
src/
├── main.tsx, App.tsx, index.css
├── types/index.ts              # All TS interfaces + constants
├── store/appStore.ts           # Zustand: nav, auth, form, submissions, UI
├── lib/
│   ├── api.ts                  # Apps Script client (all endpoints)
│   ├── db.ts                   # IndexedDB (FieldReportV2) + migration
│   ├── i18n.ts                 # ES/DE translations (~160 keys)
│   ├── photoUtils.ts           # Compress + blur/dark/overexposed detection
│   ├── validation.ts           # Weighted scoring (basic/HA/photos/checklist/protocols/comments)
│   └── constants.ts            # Script URL, DB config, thresholds, admin PIN
├── data/
│   ├── gfpPhotos.ts            # GFP photo requirements by building type
│   ├── wcPhotos.ts             # WC photos: basement + per-WE + exterior
│   └── ne4Checklist.ts         # 19 NE4 items with categories
├── hooks/
│   ├── useTranslation.ts       # i18n hook wrapping Zustand lang
│   ├── useOnline.ts            # Online/offline boolean
│   ├── useSync.ts              # Retry pending submissions with backoff
│   └── usePhotoCapture.ts      # Camera/gallery + compress + quality
└── components/
    ├── layout/StatusBar.tsx     # Top bar: back, connection, lang toggle
    ├── ui/                     # PinEntry, MemberSelect, PhotoField, Modal, Toast
    ├── form/                   # BasicInfoSection, GfpSection, WcSection, EvidenceSection, ValidationScoreCard
    ├── views/                  # TechView (form orchestrator), HistoryView, AdminView
    └── citas/                  # CitasScreen, CitaCard
```

## User Flow
- **GFP:** PIN → Member → Form → Submit
- **WC:** PIN → Member → Citas → Form → Submit
- **Admin:** PIN 0223 → Admin Dashboard

## Backend (Not in this repo)
- **Apps Script URL:** `https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec`
- **Writes use GET** (not POST) — POST triggers Google auth redirect for assignCita/updateCitaStatus
- `citas.json` auto-synced from Google Calendar via `scripts/sync_citas.sh` (cron by LobsterOps)

## Key Patterns
- Zustand selectors: `useAppStore((s) => s.fieldName)` — avoid full store subscriptions
- Photos stored as base64 data URLs in Zustand + IndexedDB
- Offline-first: save to IndexedDB first, mark `pendingSync`, retry on reconnect
- Validation score: only computed for WC finalized orders (weighted 100-point system)
- i18n: `t('key')` returns string, `TranslationKey` type for compile-time safety
- Form data stored as `Record<string, string>` for flexibility

## Commands
```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # tsc + vite build → dist/
npm run preview  # Preview production build
```
