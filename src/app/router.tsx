import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import HomePage from "../pages/HomePage";
import RoutinesPage from "../pages/RoutinesPage";
import RoutineDetailPage from "../pages/RoutineDetailPage";
import ExercisesPage from "../pages/ExercisesPage";
import HistoryPage from "../pages/HistoryPage";
import VariantHistoryPage from "../pages/VariantHistoryPage";
import NewRoutinePage from "../pages/NewRoutinePage";
import EditRoutinePage from "../pages/EditRoutinePage";
import NewExercisePage from "../pages/NewExercisePage";
import NewVariantPage from "../pages/NewVariantPage";
import EditVariantPage from "../pages/EditVariantPage";
import EditExercisePage from "../pages/EditExercisePage";
import ImportExportPage from "../pages/ImportExportPage";
import ActiveWorkoutPage from "../pages/ActiveWorkoutPage";
import LoginPage from "../pages/LoginPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import "../styles/app-shell.css";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-shell-main">
        {children}
      </main>
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
                <Route path="/exercises/:exerciseId/variants/new" element={<NewVariantPage />} />
                <Route path="/variants/:variantId/edit" element={<EditVariantPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/history/variant/:variantId" element={<VariantHistoryPage />} />
                <Route path="/exercises/:exerciseId/edit" element={<EditExercisePage />} />
                <Route path="/data" element={<ImportExportPage />} />
                <Route path="/active-workout" element={<ActiveWorkoutPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}