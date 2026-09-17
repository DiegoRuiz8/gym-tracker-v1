// src/app/router.tsx

import { lazy, Suspense, type ReactNode, useEffect, useRef, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import type { WorkoutSession } from "../types/session";
import "../styles/app-shell.css";

const ActiveWorkoutPage = lazy(() => import("../pages/ActiveWorkoutPage"));
const EditExercisePage = lazy(() => import("../pages/EditExercisePage"));
const EditRoutinePage = lazy(() => import("../pages/EditRoutinePage"));
const ExerciseHistoryPage = lazy(
  () => import("../pages/ExerciseHistoryPage"),
);
const ExercisesPage = lazy(() => import("../pages/ExercisesPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const HomePage = lazy(() => import("../pages/HomePage"));
const ImportExportPage = lazy(() => import("../pages/ImportExportPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NewExercisePage = lazy(() => import("../pages/NewExercisePage"));
const NewRoutinePage = lazy(() => import("../pages/NewRoutinePage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const RoutineDetailPage = lazy(() => import("../pages/RoutineDetailPage"));
const RoutinesPage = lazy(() => import("../pages/RoutinesPage"));

function getNavLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "app-shell-nav-link active" : "app-shell-nav-link";
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-shell-nav-icon">
      <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20h13V9.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoutinesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-shell-nav-icon">
      <rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ExercisesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-shell-nav-icon">
      <path d="M3 10v4M7 8v8M17 8v8M21 10v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 9v6M19 9v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-shell-nav-icon">
      <path d="M4 12a8 8 0 1 0 2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4l2.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isDemo = useAuthStore((state) => state.isDemo)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user && !isDemo) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function formatElapsedTime(startedAt: string, nowMs: number): string {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((nowMs - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getLastCompletedSetTime(session: WorkoutSession): string | null {
  return session.exercises.reduce<string | null>((latest, exercise) => {
    return exercise.performedSets.reduce<string | null>((currentLatest, set) => {
      if (!set.completedAt) return currentLatest;
      if (!currentLatest) return set.completedAt;

      return new Date(set.completedAt).getTime() >
        new Date(currentLatest).getTime()
        ? set.completedAt
        : currentLatest;
    }, latest);
  }, null);
}

function ActiveWorkoutBanner() {
  const location = useLocation();
  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );
  const routines = useAppStore((state) => state.routines);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!activeWorkoutSession) return;

    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [activeWorkoutSession]);

  if (!activeWorkoutSession || location.pathname === "/active-workout") {
    return null;
  }

  const routine = routines.find(
    (item) => item.id === activeWorkoutSession.routineId,
  );

  return (
    <Link
      to="/active-workout"
      className="app-shell-active-workout"
      aria-label={`Resume active workout: ${routine?.name ?? "Workout"}`}
    >
      <span className="app-shell-active-workout-indicator" aria-hidden="true" />
      <span className="app-shell-active-workout-content">
        <strong>Workout in progress</strong>
        <span>
          {routine?.name ?? "Active workout"} · {formatElapsedTime(activeWorkoutSession.startedAt, nowMs)}
        </span>
      </span>
      <span className="app-shell-active-workout-action">Resume</span>
    </Link>
  );
}

function SyncStatusIndicator() {
  const syncStatus = useAppStore((state) => state.syncStatus);
  const syncError = useAppStore((state) => state.syncError);
  const retrySync = useAppStore((state) => state.retrySync);
  const isDemo = useAuthStore((state) => state.isDemo);
  const wasOffline = useRef(false);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    if (syncStatus === "offline") {
      wasOffline.current = true;
      return;
    }

    if (syncStatus !== "saved" || !wasOffline.current) return;

    wasOffline.current = false;
    let dismissTimeout: number | null = null;
    const showTimeout = window.setTimeout(() => {
      setShowRecovered(true);
      dismissTimeout = window.setTimeout(() => setShowRecovered(false), 4000);
    }, 0);

    return () => {
      window.clearTimeout(showTimeout);
      if (dismissTimeout !== null) {
        window.clearTimeout(dismissTimeout);
      }
    };
  }, [syncStatus]);

  if (syncStatus === "idle" || (syncStatus === "saved" && !showRecovered)) {
    return null;
  }

  const label = showRecovered
    ? isDemo
      ? "Connection restored — demo data stays on this device"
      : "Connection restored — changes synced"
    : syncStatus === "saving"
      ? "Saving changes…"
      : syncStatus === "offline"
        ? "Offline — saved on this device"
        : syncError ?? "Cloud sync failed";

  return (
    <div
      className={`app-shell-sync-status is-${showRecovered ? "recovered" : syncStatus}`}
      role="status"
      aria-live="polite"
    >
      <span>{label}</span>
      {syncStatus === "error" ? (
        <button type="button" onClick={() => void retrySync()}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

function SessionRecoveryPrompt() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );
  const routines = useAppStore((state) => state.routines);
  const completeActiveWorkoutSession = useAppStore(
    (state) => state.completeActiveWorkoutSession,
  );
  const cancelActiveWorkoutSession = useAppStore(
    (state) => state.cancelActiveWorkoutSession,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!activeWorkoutSession) return;

    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [activeWorkoutSession]);

  if (!activeWorkoutSession || location.pathname === "/active-workout") {
    return null;
  }

  const session = activeWorkoutSession;

  if (dismissedSessionId === session.id) return null;

  const hasBeenOpenForFourHours =
    nowMs - new Date(session.startedAt).getTime() >=
    4 * 60 * 60 * 1000;

  if (!hasBeenOpenForFourHours) return null;

  const routine = routines.find(
    (item) => item.id === session.routineId,
  );

  function dismiss(): void {
    setDismissedSessionId(session.id);
  }

  return (
    <div className="app-shell-recovery-overlay">
      <section
        className="app-shell-recovery-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-workout-recovery-title"
      >
        <p className="app-shell-recovery-eyebrow">Workout still active</p>
        <h2 id="active-workout-recovery-title">
          {routine?.name ?? "Your workout"}
        </h2>
        <p>
          This session has been open for more than four hours. What would you like to do?
        </p>
        <div className="app-shell-recovery-actions">
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              dismiss();
              navigate("/active-workout");
            }}
          >
            Resume workout
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              completeActiveWorkoutSession(
                getLastCompletedSetTime(session) ?? session.startedAt,
              );
              dismiss();
              navigate("/history");
            }}
          >
            Finish at last set
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={() => {
              cancelActiveWorkoutSession();
              dismiss();
            }}
          >
            Discard workout
          </button>
        </div>
      </section>
    </div>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-shell-main">
        <ActiveWorkoutBanner />
        {children}
      </main>
      <SessionRecoveryPrompt />
      <SyncStatusIndicator />
      <nav className="app-shell-nav" aria-label="Primary">
        <div className="app-shell-nav-inner">
          <NavLink className={getNavLinkClassName} to="/" end>
            <HomeIcon />
            <span>Home</span>
          </NavLink>
          <NavLink className={getNavLinkClassName} to="/routines">
            <RoutinesIcon />
            <span>Routines</span>
          </NavLink>
          <NavLink className={getNavLinkClassName} to="/exercises">
            <ExercisesIcon />
            <span>Exercises</span>
          </NavLink>
          <NavLink className={getNavLinkClassName} to="/history">
            <HistoryIcon />
            <span>History</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="app-route-loading" role="status" aria-live="polite">
          Loading page...
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/routines" element={<RoutinesPage />} />
                  <Route path="/routines/new" element={<NewRoutinePage />} />
                  <Route path="/routines/:routineId" element={<RoutineDetailPage />} />
                  <Route path="/routines/:routineId/edit" element={<EditRoutinePage />} />
                  <Route path="/exercises" element={<ExercisesPage />} />
                  <Route path="/exercises/new" element={<NewExercisePage />} />
                  <Route path="/exercises/:exerciseId/edit" element={<EditExercisePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/history/exercise/:exerciseId" element={<ExerciseHistoryPage />} />
                  <Route path="/data" element={<ImportExportPage />} />
                  <Route path="/active-workout" element={<ActiveWorkoutPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}
