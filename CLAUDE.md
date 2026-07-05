# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start local dev server (Vite)
npm run build     # type-check (tsc -b) then build for production
npm run preview   # serve the production build locally
npm run lint      # run ESLint
```

There is no test suite.

## Architecture

**Lift Log** is a mobile-first, local-first PWA workout tracker. All state lives in a single [Zustand](https://github.com/pmndrs/zustand) store (`src/store/useAppStore.ts`) and is persisted to `localStorage` under the key `gym-tracker-v1` as a versioned JSON payload (current version: `3`).

### Data model

The entity hierarchy is flat — there is no separate "exercise family + variant" tier:

```
Exercise                       (the exercise itself, e.g. "Bench Press - Barbell")
  └─ RoutineExerciseRef        (exercise referenced in a Routine, with a Prescription)
       └─ WorkoutSessionExercise  (snapshot of the ref inside an active/completed session)
```

- **Exercise** (`src/types/exercise.ts`) — a single flat entity (renamed from the old `ExerciseVariant`). Has `name`, `category`, `muscleGroups`, `equipment`/`gymLabel`, `trackingType` (`weight_reps`, `bodyweight_reps`, `duration`, etc.), and an `isActive` flag. Also carries optional `exerciseDbId` / `exerciseDbLinkStatus` fields, used by the in-progress ExerciseDB GIF integration (`src/lib/exerciseDbCache.ts`).
- **Routine** (`src/types/routine.ts`) — an ordered list of `RoutineExerciseRef`s, each with a `Prescription` (sets, rep range, target RIR, rest). Each ref points directly at an `Exercise` via `exerciseId`.
- **WorkoutSession** (`src/types/session.ts`) — created when a routine is started. Contains `WorkoutSessionExercise[]`, each with `CompletedSet[]`. Sessions are `in_progress` while active and `completed` when finished. The in-progress session lives in `activeWorkoutSession` (separate from `workoutSessions`) until completed.
- **WorkoutLog** (`src/types/log.ts`) — the legacy data model (pre-v2). Still stored alongside `workoutSessions` for historical reference, but no longer used to drive any app logic.

> History note: this model was flattened from a two-tier `Exercise → ExerciseVariant` hierarchy. The old `ExerciseVariant` entity, `variantId` references, and the `migrateLegacyLogsToSessions` runtime migration have all been removed from the app code. Existing exports from the old model must be converted with a one-off migration script before importing (see `src/utils/importExport.ts` — it rejects anything that isn't `version: 3`).

### State & persistence flow

1. On app load, `getInitialAppData()` (`src/store/initialData.ts`) reads from `localStorage` and returns the stored data as-is. There is no in-app migration logic — any structural migration happens once, externally, via a JSON export/transform/import cycle.
2. Every Zustand state change is synced to `localStorage` via a `useAppStore.subscribe` listener at the bottom of `useAppStore.ts`, and (debounced) pushed to Supabase via `src/lib/syncService.ts`.

### Active workout lifecycle

- `startWorkoutSessionFromRoutine(routineId)` — creates a new `WorkoutSession` with prefilled sets from the latest performance for each exercise (checked against both `workoutSessions` and legacy `workoutLogs`). Stored in `activeWorkoutSession`.
- `completeActiveWorkoutSession()` — moves the session from `activeWorkoutSession` into `workoutSessions[]`.
- `cancelActiveWorkoutSession()` — discards `activeWorkoutSession` without saving.
- `swapActiveSessionExercise(sessionExerciseId, nextExerciseId)` — swaps an exercise within the active session for any other active exercise (no longer restricted to "variants of the same family", since that grouping no longer exists). The UI for this in `ActiveWorkoutPage.tsx` is a searchable picker, same pattern as "Add exercise".

When changing the first set's weight, `propagateActiveSessionSetWeightFromFirstSet` automatically updates subsequent sets that share the same weight value.

### Routing

React Router v7, defined in `src/app/router.tsx`. Bottom navigation bar with four tabs: **Home**, **Routines**, **Exercises**, **History**. The active workout lives at `/active-workout` (not in the nav bar; navigated to when a session is started). Exercise history lives at `/history/exercise/:exerciseId` (`ExerciseHistoryPage.tsx`, renamed from `VariantHistoryPage.tsx`).

### Selectors

`src/store/selectors.ts` provides helpers for joining IDs to entities (`getExerciseById`, `buildResolvedWorkoutSessions`, `getSessionHistoryForExercise`). Use these rather than filtering store arrays inline in pages.

### Import / export

`src/utils/importExport.ts` handles JSON import validation and export, versioned at `3`. Import validates every entity shape before accepting, and requires `workoutSessions` to already be present and valid — there is no automatic legacy-log migration at import time (unlike the old `version: 2` behavior). Files exported from the old two-tier model are rejected with an explicit error rather than partially accepted.

### Styling

Plain CSS files in `src/styles/`, one per page/section. Global tokens and dark-mode base styles are in `globals.css`. No CSS preprocessor or utility framework.

### In progress

- ExerciseDB integration (`src/lib/exerciseDbCache.ts`): caches the ExerciseDB V1 free catalog (`oss.exercisedb.dev`) in localStorage to show exercise GIFs offline-first. Catalog pagination via the API's `cursor` parameter is unconfirmed/unreliable — see code comments in that file before extending it.
- Supabase free-tier project pausing after 7 days of inactivity: not yet mitigated with a keep-alive job.