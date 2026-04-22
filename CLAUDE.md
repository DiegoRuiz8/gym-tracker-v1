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

**Lift Log** is a mobile-first, local-first PWA workout tracker. All state lives in a single [Zustand](https://github.com/pmndrs/zustand) store (`src/store/useAppStore.ts`) and is persisted to `localStorage` under the key `gym-tracker-v1` as a versioned JSON payload (current version: `2`).

### Data model

The core entity hierarchy is:

```
Exercise
  └─ ExerciseVariant          (one exercise has many variants, e.g. "Barbell", "Dumbbell")
       └─ RoutineExerciseRef  (variant referenced in a Routine, with a Prescription)
            └─ WorkoutSessionExercise  (snapshot of the ref inside an active/completed session)
```

- **Exercise** (`src/types/exercise.ts`) — the canonical movement (e.g. "Bench Press").
- **ExerciseVariant** — a specific implementation of an exercise. Has `trackingType` (`weight_reps`, `bodyweight_reps`, `duration`, etc.) and an `isActive` flag.
- **Routine** (`src/types/routine.ts`) — an ordered list of `RoutineExerciseRef`s, each with a `Prescription` (sets, rep range, target RIR, rest).
- **WorkoutSession** (`src/types/session.ts`) — created when a routine is started. Contains `WorkoutSessionExercise[]`, each with `CompletedSet[]`. Sessions are `in_progress` while active and `completed` when finished. The in-progress session lives in `activeWorkoutSession` (separate from `workoutSessions`) until completed.
- **WorkoutLog** (`src/types/log.ts`) — the legacy data model (pre-v2). Still stored but superseded by `workoutSessions`.

### State & persistence flow

1. On app load, `getInitialAppData()` (`src/store/initialData.ts`) reads from `localStorage`.
2. If `version < 2` or no sessions exist but logs do, `migrateLegacyLogsToSessions()` (`src/utils/sessionMigration.ts`) converts `workoutLogs` → `workoutSessions` and writes back as version 2.
3. Every Zustand state change is synced to `localStorage` via a `useAppStore.subscribe` listener at the bottom of `useAppStore.ts`.

### Active workout lifecycle

- `startWorkoutSessionFromRoutine(routineId)` — creates a new `WorkoutSession` with prefilled sets from the latest performance for each variant (checked against both `workoutSessions` and legacy `workoutLogs`). Stored in `activeWorkoutSession`.
- `completeActiveWorkoutSession()` — moves the session from `activeWorkoutSession` into `workoutSessions[]`.
- `cancelActiveWorkoutSession()` — discards `activeWorkoutSession` without saving.

When changing the first set's weight, `propagateActiveSessionSetWeightFromFirstSet` automatically updates subsequent sets that share the same weight value.

### Routing

React Router v7, defined in `src/app/router.tsx`. Bottom navigation bar with four tabs: **Home**, **Routines**, **Exercises**, **History**. The active workout lives at `/active-workout` (not in the nav bar; navigated to when a session is started).

### Selectors

`src/store/selectors.ts` provides helpers for joining IDs to entities (`getExerciseById`, `getVariantById`, `buildResolvedWorkoutSessions`, `getSessionHistoryForVariant`). Use these rather than filtering store arrays inline in pages.

### Import / export

`src/utils/importExport.ts` handles JSON import validation and export. Import validates every entity shape before accepting. Legacy imports (v1 with `workoutLogs` only) are auto-migrated to sessions on import, matching the same migration logic used on app load.

### Styling

Plain CSS files in `src/styles/`, one per page/section. Global tokens and dark-mode base styles are in `globals.css`. No CSS preprocessor or utility framework.
