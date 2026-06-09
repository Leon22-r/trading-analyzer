# Trading Analyzer — Improvements Design

**Date:** 2026-06-09  
**Approach:** Layered improvement sprint (A)  
**Layers:** Foundation → UX/Mobile hardening → New features

---

## Overview

Three ordered layers that each build on the previous. Every layer is independently shippable.

1. **Foundation** — decompose `page.tsx` into focused components + extract `useTrades` hook
2. **UX safety + mobile hardening** — delete confirmation, toast notifications, input validation, bottom sheet detail on mobile
3. **New features** — P/L equity chart, trade search, unlimited calendar

---

## Layer 1: Architecture

### Problem

`src/app/page.tsx` is 699 lines handling: form state, CRUD, backup, PWA install prompt, calendar aggregation, trade selection, and all rendering. It is impossible to extend without collision.

### Target file structure

```
src/
  app/
    page.tsx                  # thin coordinator, ~80 lines
    globals.css               # unchanged
    layout.tsx                # unchanged
    manifest.ts               # unchanged
  components/
    TradeForm.tsx             # form panel + local form state
    TradeList.tsx             # trade history panel + search input
    TradeDetail.tsx           # detail view (desktop side panel / mobile bottom sheet)
    PerformanceCalendar.tsx   # calendar grid panel
    PnLChart.tsx              # equity curve chart (new)
    SummaryGrid.tsx           # 4 stat cards row
    ui/
      MoneyInput.tsx          # controlled number input with label
      ScreenshotInput.tsx     # file input with preview
      ScreenshotPreview.tsx   # read-only image preview
      EmptyState.tsx          # dashed placeholder box
      Toast.tsx               # toast notification item + stack
      ConfirmDialog.tsx       # modal confirmation dialog
  hooks/
    useTrades.ts              # all state + CRUD + backup logic
  lib/
    backup.mjs / .ts          # unchanged
    storage.ts                # unchanged
    tradeMath.mjs / .ts       # unchanged
    tradeSort.mjs / .ts       # unchanged
    tradeTypes.ts             # unchanged
```

### `useTrades` hook interface

```ts
type UseTradesReturn = {
  trades: Trade[];
  isLoading: boolean;
  saveTrade: (trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  exportBackup: () => void;
};
```

The hook owns all IndexedDB interaction. Components receive only the data and callbacks they need via props — no prop-drilling of raw state cursors.

### `page.tsx` responsibility after refactor

- Call `useTrades`
- Hold `selectedTradeId` state (UI cursor, not data)
- Hold `installPrompt` state (PWA, not data)
- Render: hero, install card, `SummaryGrid`, `PnLChart`, dashboard grid (`TradeForm` + `PerformanceCalendar`), trade workspace (`TradeList` + `TradeDetail`)
- Wire callbacks between components

---

## Layer 2: UX Safety + Mobile Hardening

### Delete confirmation

Replace the direct `deleteTrade(id)` call with a `ConfirmDialog` modal.

- Trigger: user clicks Delete button in `TradeDetail`
- Dialog content: "Delete this trade? This cannot be undone." with Cancel and Delete buttons
- Implementation: local `pendingDeleteId` state in `TradeDetail`; on confirm, calls `deleteTrade` prop
- No browser `window.confirm()` — styled modal only

### Toast notifications

Replace the single `message: string` state with a toast stack.

- Position: fixed, bottom-center, above mobile navigation safe area
- Auto-dismiss: 3 seconds
- Variants: `success` (blue, existing style) and `error` (red)
- Dismissable by tap (critical for PWA)
- Multiple toasts stack vertically
- Toast state (`toasts`, `addToast`) lives in `page.tsx`. `useTrades` operations throw on error; `page.tsx` wraps each call in try/catch and calls `addToast`. `ToastStack` is rendered at the root of `page.tsx`.

### Input validation

Current `numberFromInput` silently returns `0` on bad input. Add a pre-submit guard in `TradeForm`:

- Detailed mode: reject if entryPrice, exitPrice, or quantity are zero (likely unset)
- Balance mode: reject if startingAmount is zero and endingAmount is also zero
- Show inline error text below the relevant field group, not a toast
- Do not block form render — only show errors after first submit attempt

### Mobile detail — bottom sheet

On screens ≤860px, `TradeDetail` renders as a bottom sheet overlay instead of a stacked panel.

- Trigger: `selectedTradeId` becomes non-null
- Behaviour: slides up from bottom, covers ~75% of screen height
- Drag handle at top (visual only, no drag-to-dismiss required in v1)
- Backdrop overlay behind sheet; tap backdrop to dismiss
- Dismiss also via Back button inside sheet header
- Implementation: CSS `position: fixed` + `transform: translateY` toggle + `transition`; no animation library needed
- Desktop (>860px): unchanged side-panel behaviour

### Hero on mobile

- Reduce `h1` bottom margin on small screens
- Shorten description copy (move verbose text to `aria-label` or remove)
- Buttons already stack full-width at ≤860px — no change needed there

---

## Layer 3: New Features

### P/L equity chart

**Position:** full-width panel between `SummaryGrid` and the `dashboard-grid` (form + calendar row).

**Library:** Recharts (`recharts` npm package).

**Component:** `PnLChart.tsx`

**Data:** derived in `page.tsx` from `trades` — sorted oldest-first, cumulative sum of `profitLoss`:

```ts
const equityPoints = useMemo(() => {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative = roundMoney(cumulative + t.profitLoss);
    return { date: t.tradeDate, value: cumulative };
  });
}, [trades]);
```

**Chart spec:**
- `ResponsiveContainer` width 100%, height 200px
- `AreaChart` with `linearGradient` fill: green (`#039855`) when final value ≥ 0, red (`#d92d20`) otherwise
- X-axis: `tradeDate` strings, tick formatter `date.slice(5)` (MM-DD)
- Y-axis: USD formatter, hidden label
- `Tooltip` shows date + cumulative P/L
- Renders `null` (nothing) when `trades.length === 0`

### Trade search

**Position:** text input at top of `TradeList` panel, above the trade list.

**Behaviour:**
- Filters `trades` prop by `description` (case-insensitive `includes`)
- Counter: "3 of 12 trades" shown when query is non-empty
- Clears when query is emptied
- Search is local state inside `TradeList` — not lifted to `page.tsx`

### Calendar cap removal

Remove `.slice(0, 14)` from `calendarDays` derivation in `page.tsx`. Show all trading days, newest first. Panel label changes from "14 active days" to "{n} active days" (already dynamic).

---

## Error handling

- `useTrades` operations throw on storage error; `page.tsx` catches and calls `addToast` (error variant)
- `importBackup` throws on invalid JSON or wrong schema via `parseBackupPayload` — same catch-and-toast pattern
- Chart renders nothing on empty data rather than throwing

---

## Testing

Existing tests (`tests/*.test.mjs`) cover pure functions and are unaffected.

No new unit tests required for this layer — components are thin renderers, `useTrades` is a wrapper around already-tested storage functions. Integration tests for the hook are a future concern.

---

## Out of scope

- Drag-to-dismiss on bottom sheet
- Screenshot storage outside IndexedDB (base64 bloat is a known issue, deferred)
- Multi-currency support
- Tagging / categories
- Pagination on trade list
