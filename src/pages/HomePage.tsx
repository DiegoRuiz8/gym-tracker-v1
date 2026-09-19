import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  disableWorkoutReminders,
  enableWorkoutReminders,
  getWorkoutReminderPermission,
  getWorkoutReminderPreference,
  requiresHomeScreenInstallForWorkoutReminders,
  type WorkoutReminderPermission,
} from "../lib/workoutNotifications";
import "../styles/simple-page.css";

type RoutineFilter = "All" | "Push" | "Pull" | "Legs" | "Upper" | "Lower";

const ROUTINE_FILTERS: RoutineFilter[] = [
  "All", "Push", "Pull", "Legs", "Upper", "Lower",
];

export default function HomePage() {
  const routines = useAppStore((state) => state.routines);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const setPreferredWeightUnit = useAppStore((state) => state.setPreferredWeightUnit);
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const signOut = useAuthStore((state) => state.signOut);
  const resetDemo = useAuthStore((state) => state.resetDemo);

  const [activeFilter, setActiveFilter] = useState<RoutineFilter>("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDemoReset, setConfirmingDemoReset] = useState(false);
  const [workoutReminderEnabled, setWorkoutReminderEnabled] = useState(
    getWorkoutReminderPreference,
  );
  const [workoutReminderPermission, setWorkoutReminderPermission] =
    useState<WorkoutReminderPermission>(getWorkoutReminderPermission);
  const requiresHomeScreenInstall =
    requiresHomeScreenInstallForWorkoutReminders();
  const reminderActivationBlocked =
    !workoutReminderEnabled &&
    (requiresHomeScreenInstall ||
      workoutReminderPermission === "denied" ||
      workoutReminderPermission === "unsupported");
  const reminderControlLabel = workoutReminderEnabled
    ? "Enabled"
    : requiresHomeScreenInstall
      ? "Install app"
      : workoutReminderPermission === "denied"
        ? "Blocked"
        : workoutReminderPermission === "unsupported"
          ? "Unavailable"
          : "Enable";
  const menuRef = useRef<HTMLDivElement>(null);

  const activeWorkoutSession = useAppStore((state) => state.activeWorkoutSession);
  const startWorkoutSessionFromRoutine = useAppStore((state) => state.startWorkoutSessionFromRoutine);

  // Cerrar menu al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDemoReset(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setConfirmingDemoReset(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const userInitials = useMemo(() => {
    if (isDemo) return "D";
    const email = user?.email ?? "";
    return email.split("@")[0].slice(0, 1).toUpperCase();
  }, [isDemo, user]);

  const visibleRoutines = useMemo(() => {
    if (activeFilter === "All") return routines.slice(0, 5);
    return routines.filter((routine) => {
      const dayType = (routine.dayType ?? "").toLowerCase();
      const name = routine.name.toLowerCase();
      const filter = activeFilter.toLowerCase();
      return dayType.includes(filter) || name.includes(filter);
    });
  }, [routines, activeFilter]);

  function handleRoutineWorkoutAction(routineId: string) {
    const isSameRoutineActive = activeWorkoutSession?.routineId === routineId;
    const hasOtherRoutineActive = activeWorkoutSession !== null && activeWorkoutSession?.routineId !== routineId;

    if (isSameRoutineActive || hasOtherRoutineActive) {
      navigate("/active-workout");
      return;
    }

    startWorkoutSessionFromRoutine(routineId);
    navigate("/active-workout");
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  function handleResetDemo() {
    resetDemo();
    setMenuOpen(false);
    setConfirmingDemoReset(false);
  }

  function handleMenuToggle() {
    setMenuOpen((isOpen) => {
      if (isOpen) {
        setConfirmingDemoReset(false);
      }
      return !isOpen;
    });
  }

  async function handleWorkoutReminderToggle() {
    if (workoutReminderEnabled) {
      await disableWorkoutReminders();
      setWorkoutReminderEnabled(false);
      return;
    }

    const permission = await enableWorkoutReminders();
    setWorkoutReminderPermission(permission);
    setWorkoutReminderEnabled(permission === "granted");
  }

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 className="simple-page-title simple-page-home-brand">LiftLog</h1>
            <p className="simple-page-description">
              Track routines, sets, reps, and progress in one place.
            </p>
            {isDemo ? (
              <p className="simple-page-demo-badge">
                Demo mode — local data only
              </p>
            ) : null}
          </div>

          {/* Avatar */}
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleMenuToggle}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-controls="account-settings-menu"
              className="simple-page-account-button"
            >
              {userInitials}
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="home-settings-scrim"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close account menu"
                />
                <div
                  id="account-settings-menu"
                  className="home-settings-panel"
                  role="dialog"
                  aria-label="Account settings"
                >
                  <div className="home-settings-handle" aria-hidden="true" />
                  <header className="home-settings-account">
                    <p className="home-settings-eyebrow">Account</p>
                    <p className="home-settings-email">{isDemo ? "Demo athlete" : user?.email}</p>
                  </header>

                  <section className="home-settings-section" aria-labelledby="preferences-heading">
                    <p id="preferences-heading" className="home-settings-eyebrow">Preferences</p>
                    <div className="home-settings-item">
                      <div className="home-settings-item-text">
                        <p className="home-settings-item-title">Weight unit</p>
                        <p className="home-settings-item-description">Choose how weights appear across the app.</p>
                      </div>
                      <div className="home-settings-unit-toggle" role="group" aria-label="Weight unit">
                        {(["kg", "lb"] as const).map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setPreferredWeightUnit(unit)}
                            className={`home-settings-unit-button ${preferredWeightUnit === unit ? "home-settings-unit-button-active" : ""}`}
                            aria-pressed={preferredWeightUnit === unit}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="home-settings-item home-settings-reminder">
                      <div className="home-settings-item-text">
                        <p className="home-settings-item-title">Workout reminder</p>
                        <p className="home-settings-item-description">
                          {requiresHomeScreenInstall
                            ? "Add LiftLog to your Home Screen to use reminders on iPhone or iPad."
                            : workoutReminderPermission === "denied"
                              ? "Allow notifications in browser settings to turn this on."
                              : workoutReminderPermission === "unsupported"
                                ? "Notifications are not supported in this browser."
                                : "Get one reminder while a workout is in progress."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleWorkoutReminderToggle()}
                        className={`home-settings-reminder-button ${workoutReminderEnabled ? "home-settings-reminder-button-active" : ""} ${reminderActivationBlocked ? "home-settings-reminder-button-blocked" : ""}`}
                        aria-pressed={workoutReminderEnabled}
                        disabled={reminderActivationBlocked}
                      >
                        {reminderControlLabel}
                      </button>
                    </div>
                  </section>

                  <section className="home-settings-section" aria-labelledby="data-heading">
                    <p id="data-heading" className="home-settings-eyebrow">Data</p>
                    <Link to="/data" onClick={() => setMenuOpen(false)} className="home-settings-data-link">
                      <span>
                        <span className="home-settings-item-title">Data &amp; backup</span>
                        <span className="home-settings-item-description">Export, restore, or get a JSON template.</span>
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </section>

                  <section className="home-settings-session" aria-labelledby="session-heading">
                    <p id="session-heading" className="home-settings-eyebrow">Session</p>
                    {isDemo ? (
                      confirmingDemoReset ? (
                        <div className="home-settings-confirm" role="alert">
                          <p>Reset demo data?</p>
                          <span>This removes the routines and history in this demo session.</span>
                          <div>
                            <button type="button" onClick={() => setConfirmingDemoReset(false)} className="home-settings-confirm-cancel">Cancel</button>
                            <button type="button" onClick={handleResetDemo} className="home-settings-confirm-action">Reset demo</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmingDemoReset(true)} className="home-settings-action home-settings-action-warning">
                          Reset demo data
                        </button>
                      )
                    ) : null}
                    <button type="button" onClick={() => void handleSignOut()} className="home-settings-action home-settings-action-danger">
                      {isDemo ? "Exit demo" : "Sign out"}
                    </button>
                  </section>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <section className="simple-page-card simple-page-card-compact" aria-labelledby="home-overview-title">
          <div className="simple-page-card-body simple-page-card-body-compact">
            <h2 id="home-overview-title" className="simple-page-card-title">Welcome back</h2>
            <p className="simple-page-card-text">
              Start from a routine, log your sets, and track your progress over time.
            </p>
          </div>
        </section>

        <section className="simple-page-card" aria-labelledby="home-routines-title">
          <div className="simple-page-card-body">
            <div className="simple-page-routines-top">
              <h2 id="home-routines-title" className="simple-page-card-title simple-page-routines-title">
                Your routines
              </h2>
              <Link to="/routines" className="simple-page-btn simple-page-btn-secondary simple-page-routines-view-all-btn">
                View all
              </Link>
              <p className="simple-page-card-text simple-page-routines-subtext">
                Quick access to start your next workout.
              </p>
            </div>

            {routines.length > 0 && (
              <div className="simple-page-routine-filters" role="tablist" aria-label="Routine filters">
                {ROUTINE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`simple-page-routine-filter-chip ${activeFilter === filter ? "simple-page-routine-filter-chip-active" : ""}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}

            {routines.length === 0 ? (
              <div className="simple-page-empty-block">
                <p className="simple-page-card-text">You don't have any routines yet.</p>
                <Link to="/routines/new" className="simple-page-btn simple-page-btn-primary">Create routine</Link>
              </div>
            ) : visibleRoutines.length === 0 ? (
              <div className="simple-page-empty-block">
                <p className="simple-page-card-text">No routines match the selected filter.</p>
              </div>
            ) : (
              <div className="simple-page-home-routines">
                {visibleRoutines.map((routine) => (
                  <article
                    key={routine.id}
                    className="simple-page-home-routine-item simple-page-home-routine-item-clickable"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open routine ${routine.name}`}
                    onClick={() => navigate(`/routines/${routine.id}`, { state: { from: "home" } })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/routines/${routine.id}`, { state: { from: "home" } });
                      }
                    }}
                  >
                    <div className="simple-page-home-routine-header-row">
                      <div className="simple-page-home-routine-main">
                        <h3 className="simple-page-home-routine-title">{routine.name}</h3>
                      </div>
                      <div className="simple-page-home-routine-actions">
                        <button
                          type="button"
                          className={`home-routine-action-btn ${
                            activeWorkoutSession?.routineId === routine.id
                              ? "home-routine-action-btn-primary"
                              : activeWorkoutSession
                                ? "home-routine-action-btn-neutral"
                                : "home-routine-action-btn-secondary"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (activeWorkoutSession && activeWorkoutSession.routineId !== routine.id) {
                              navigate(`/routines/${routine.id}`);
                              return;
                            }
                            handleRoutineWorkoutAction(routine.id);
                          }}
                        >
                          {activeWorkoutSession?.routineId === routine.id
                            ? "Resume workout"
                            : activeWorkoutSession
                              ? "Open routine"
                              : "Start workout"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
