# Field Report → NE4 Work Manager — Refactoring Spec

## Goal
Transform the current field-report app into a focused **NE4 WestConnect work manager** with:
- Admin calendar/planner view (Outlook-style)
- Technician citas + full work report submission
- Complete data flow between admin ↔ tech ↔ citas.json

## Architecture

### Data Flow
```
Google Calendar (WestConnect NE4 events)
       ↓ (every 15 min via external cron)
   citas.json (GitHub Pages) — SINGLE SOURCE OF TRUTH
       ↓
  ┌────┴────┐
  Admin     Tech App
  (read)    (read + submit)
  │              │
  │         Google Apps Script
  │         (submit reports, update status)
  │              │
  └──── cron reads back ────┘
       updates citas.json
```

### Key Principle
- `citas.json` on GitHub Pages is the single source of truth for citas
- Admin assigns teams directly (updates citas.json via GitHub API or LobsterOps)
- Tech app reads citas.json for their assignments
- Tech submits reports via Apps Script (existing POST endpoint)
- Status updates: localStorage (immediate) + Apps Script background sync
- External cron merges everything back into citas.json every 15 min

## What to REMOVE
- `glasfaser-plus` client type entirely
- `GfpSection.tsx` component
- `gfpPhotos.ts` data file
- All GFP-specific photo definitions
- `clientType` conditional logic (app is always WestConnect/NE4)
- `buildingType`, `orderNumber` GFP-only fields from Submission type
- The client type selection/switching logic

## What to KEEP (unchanged or improved)
- PIN login flow (PinEntry → MemberSelect → app)
- Admin PIN (0223)
- Team configs (West-001 through West-004 + fallback)
- WcSection.tsx (WestConnect form with HA, units, WE data, photos, checklist)
- EvidenceSection.tsx
- BasicInfoSection.tsx
- Photo capture system (usePhotoCapture, PhotoField, photoUtils)
- IndexedDB submissions storage
- Offline support / useSync hook
- Toast notifications
- i18n (es/de)
- Validation scoring
- StatusBar
- ErrorBoundary

## What to ADD

### 1. Protocolo de Instalación Section (Tech Form)
New section after the WC photos section:
- Title: "Protocolo de Instalación"
- Upload options:
  - Camera capture (photo)
  - Gallery pick (photo from device gallery)
  - Document pick (PDF from files/documents)
- Multiple files allowed
- Store as base64 in submission (same as photos)
- Show preview thumbnails for images, file icon for PDFs
- Input type="file" with accept="image/*,application/pdf" + capture option
- This replaces the current `protocols` checkbox array

### 2. Admin Calendar View (Outlook-style)
Replace the current admin tabs (overview/citas/reports/teams) with:

**Main view: Resource Timeline Calendar**
- Use FullCalendar library (@fullcalendar/react + @fullcalendar/resource-timeline)
- Y-axis: Teams (West-001, West-002, West-003, West-004) as resources
- X-axis: Days/hours
- Events: citas shown as colored blocks on each team's row
- Colors by status:
  - `libre` (unassigned): gray
  - `asignada`: blue
  - `capturada`: orange
  - `en_trabajo`: yellow
  - `finalizada_ok`: green
  - `finalizada_no_ok`: red
  - `cliente_ausente`: amber
  - `recitar`: purple
  - `paralizada`: dark gray
- Drag & drop: drag unassigned citas onto team rows to assign
- Click event: open detail panel with cita info + status + actions
- Time range shown: 06:00 - 20:00
- Default view: week (resourceTimelineWeek)
- Also available: day view, month view

**Unassigned Citas Sidebar**
- List of citas with `equipo: ''` (unassigned)
- Draggable — drag onto calendar to assign to team + date/time
- Show: HA, address, city, # technicians

**Detail Panel (on click)**
- Full cita details
- Current status with color badge
- Assign/reassign team dropdown
- Notes field
- Link to documents (linkDocs)
- If report submitted: show report summary

**Secondary tabs (keep but simplify):**
- Reports: table of submitted reports with filters
- Teams: team overview with current assignments

### 3. Improved Tech Citas Flow
Current flow is fine but improve:
- Show cita details prominently (address, city, HA, time, # units)
- "Capturar" → "Iniciar" → auto-fills form
- Status bar shows current cita status
- After form submit: cita moves to history tab automatically

## Dependencies to Add
```json
{
  "@fullcalendar/core": "^6.x",
  "@fullcalendar/react": "^6.x",
  "@fullcalendar/resource-timeline": "^6.x",
  "@fullcalendar/interaction": "^6.x",
  "@fullcalendar/daygrid": "^6.x"
}
```

## File Structure (target)
```
src/
├── App.tsx (simplified — no clientType switching)
├── main.tsx
├── index.css
├── types/index.ts (remove GFP types, add calendar types)
├── store/appStore.ts (remove clientType, simplify)
├── lib/
│   ├── api.ts (keep fetchCitasByTeam from citas.json, keep Apps Script submit)
│   ├── constants.ts
│   ├── db.ts
│   ├── i18n.ts (remove GFP strings)
│   ├── validation.ts (WC only)
│   └── photoUtils.ts
├── data/
│   ├── wcPhotos.ts (keep)
│   └── ne4Checklist.ts (keep)
├── hooks/
│   ├── useOnline.ts
│   ├── usePhotoCapture.ts
│   ├── useSync.ts
│   └── useTranslation.ts
├── components/
│   ├── layout/StatusBar.tsx
│   ├── ui/ (ErrorBoundary, Modal, Toast, PinEntry, MemberSelect, PhotoField)
│   ├── citas/
│   │   ├── CitasScreen.tsx (improved)
│   │   └── CitaCard.tsx
│   ├── form/
│   │   ├── BasicInfoSection.tsx
│   │   ├── WcSection.tsx
│   │   ├── EvidenceSection.tsx
│   │   ├── ProtocolSection.tsx (NEW — Protocolo de Instalación)
│   │   └── ValidationScoreCard.tsx
│   └── views/
│       ├── AdminView.tsx (REWRITE — calendar + resource timeline)
│       ├── TechView.tsx (simplified — always WC)
│       └── HistoryView.tsx
```

## Implementation Order
1. Remove GFP code (clean slate)
2. Add ProtocolSection.tsx to tech form
3. Install FullCalendar dependencies
4. Rewrite AdminView with calendar
5. Fix data flow (citas.json reading works, improve status sync)
6. Test build, ensure PWA still works
7. Polish UI/UX

## Constants
- ADMIN_PIN: '0223'
- Teams: West-001 (pin 2345), West-002 (3456), West-003 (4567), West-004 (5678)
- Apps Script URL: https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec
- GitHub Pages: https://umtelkomd.github.io/field-report/
- citas.json: served from repo root

## Important Notes
- Keep the app as a PWA (VitePWA plugin, manifest, SW)
- Keep offline-first approach (IndexedDB + localStorage)
- Keep bilingual support (es/de)
- The app must work on mobile (technicians use phones)
- Admin view is primarily for tablet/desktop
- DO NOT touch citas.json or push to git — only modify src/ files
- Run `npm run build` to verify the build succeeds
- FullCalendar premium (resource-timeline) requires a license key or use the free version
  - Alternative: build a custom calendar grid with CSS Grid + drag events (no license needed)
  - If using FullCalendar, check if resource-timeline is available in the free tier
  - PREFERRED: Build custom calendar component (no external dependency issues)
