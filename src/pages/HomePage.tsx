import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const activeWorkoutSession = useAppStore((state) => state.activeWorkoutSession);
  const startWorkoutSessionFromRoutine = useAppStore((state) => state.startWorkoutSessionFromRoutine);

  // Cerrar menu al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const activeRoutine = activeWorkoutSession
    ? routines.find((routine) => routine.id === activeWorkoutSession.routineId)
    : null;

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
  }

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 className="simple-page-title">Lift Log</h1>
            <p className="simple-page-description">
              Track routines, sets, reps, and progress in one place.
            </p>
            {isDemo ? (
              <p style={{ margin: "8px 0 0", color: "#8ea2ff", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Demo mode — local data only
              </p>
            ) : null}
          </div>

          {/* Avatar */}
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Account menu"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9999px",
                backgroundColor: "#4f6ef7",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.05em",
              }}
            >
              {userInitials}
            </button>

            {menuOpen ? (
              <div style={{
                position: "absolute",
                top: "44px",
                right: 0,
                backgroundColor: "#1a1d27",
                border: "1px solid #2a2d3a",
                borderRadius: "12px",
                padding: "8px",
                minWidth: "220px",
                zIndex: 100,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}>
                {/* Email */}
                <div style={{ padding: "8px 12px 12px 12px", borderBottom: "1px solid #2a2d3a", marginBottom: "8px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#8b8fa8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#ffffff", wordBreak: "break-all" }}>{isDemo ? "Demo athlete" : user?.email}</p>
                </div>

                {/* Weight unit */}
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a2d3a", marginBottom: "8px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#8b8fa8" }}>Weight unit</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["kg", "lb"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setPreferredWeightUnit(unit)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: preferredWeightUnit === unit ? "#4f6ef7" : "#2a2d3a",
                          backgroundColor: preferredWeightUnit === unit ? "#4f6ef7" : "transparent",
                          color: preferredWeightUnit === unit ? "#ffffff" : "#8b8fa8",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data settings */}
                <Link
                  to="/data"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    color: "#e2e1ed",
                    fontSize: "14px",
                    textDecoration: "none",
                    marginBottom: "4px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#21242f"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Data settings
                </Link>

                {isDemo ? (
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#8ea2ff",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Reset demo data
                  </button>
                ) : null}

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#f87171",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {isDemo ? "Exit demo" : "Sign out"}
                </button>
              </div>
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

        {activeWorkoutSession && activeRoutine ? (
          <section className="simple-page-card simple-page-card-compact simple-page-active-workout-card" aria-labelledby="home-active-workout-title">
            <div className="simple-page-card-body simple-page-card-body-compact">
              <div className="simple-page-active-workout-top">
                <div>
                  <p className="simple-page-active-workout-kicker">Workout in progress</p>
                  <h2 id="home-active-workout-title" className="simple-page-card-title">{activeRoutine.name}</h2>
                </div>
                <button
                  type="button"
                  className="home-routine-action-btn home-routine-action-btn-primary"
                  onClick={() => navigate("/active-workout")}
                >
                  Resume workout
                </button>
              </div>
            </div>
          </section>
        ) : null}

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
