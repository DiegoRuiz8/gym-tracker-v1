import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";

export default function DevSessionTestPage() {
  const routines = useAppStore((state) => state.routines);
  const activeWorkoutSession = useAppStore((state) => state.activeWorkoutSession);
  const workoutSessions = useAppStore((state) => state.workoutSessions);
  const startWorkoutSessionFromRoutine = useAppStore(
    (state) => state.startWorkoutSessionFromRoutine,
  );
  const completeActiveWorkoutSession = useAppStore(
    (state) => state.completeActiveWorkoutSession,
  );
  const cancelActiveWorkoutSession = useAppStore(
    (state) => state.cancelActiveWorkoutSession,
  );

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    routines[0]?.id ?? "",
  );

  const navigate = useNavigate();

  const handleStart = () => {
  if (!selectedRoutineId) return;
  startWorkoutSessionFromRoutine(selectedRoutineId);
  navigate("/active-workout");
};

  return (
    <main style={{ padding: "16px", maxWidth: 720, margin: "0 auto" }}>
      <h1>Dev Session Test</h1>

      <section
        style={{
          border: "1px solid #444",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2>Start Session</h2>

        {routines.length === 0 ? (
          <p>No routines found. Create at least one routine first.</p>
        ) : (
          <>
            <label htmlFor="routine-select">Choose routine</label>
            <br />
            <select
              id="routine-select"
              value={selectedRoutineId}
              onChange={(e) => setSelectedRoutineId(e.target.value)}
              style={{
                marginTop: 8,
                marginBottom: 12,
                padding: 8,
                width: "100%",
              }}
            >
              {routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
            </select>

            <button onClick={handleStart} disabled={!selectedRoutineId}>
              Start session from routine
            </button>
          </>
        )}
      </section>

      <section
        style={{
          border: "1px solid #444",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2>Active Session</h2>

        {!activeWorkoutSession ? (
          <p>No active session</p>
        ) : (
          <>
            <p>
              <strong>ID:</strong> {activeWorkoutSession.id}
            </p>
            <p>
              <strong>Status:</strong> {activeWorkoutSession.status}
            </p>
            <p>
              <strong>Date:</strong> {activeWorkoutSession.date}
            </p>
            <p>
              <strong>Started:</strong> {activeWorkoutSession.startedAt}
            </p>
            <p>
              <strong>Routine ID:</strong> {activeWorkoutSession.routineId ?? "—"}
            </p>
            <p>
              <strong>Exercises:</strong> {activeWorkoutSession.exercises.length}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={completeActiveWorkoutSession}>
                Complete session
              </button>
              <button onClick={cancelActiveWorkoutSession}>
                Cancel session
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Exercises in active session</h3>
            {activeWorkoutSession.exercises.length === 0 ? (
              <p>No exercises in session</p>
            ) : (
              <ul style={{ paddingLeft: 20 }}>
                {activeWorkoutSession.exercises.map((exercise) => (
                  <li key={exercise.id} style={{ marginBottom: 12 }}>
                    <p>
                      <strong>Exercise ID:</strong> {exercise.exerciseId}
                    </p>
                    <p>
                      <strong>Variant ID:</strong> {exercise.variantId}
                    </p>
                    <p>
                      <strong>Order:</strong> {exercise.order}
                    </p>
                    <p>
                      <strong>Tracking type:</strong> {exercise.trackingType}
                    </p>
                    <p>
                      <strong>Completed:</strong>{" "}
                      {exercise.isCompleted ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Sets planned:</strong> {exercise.performedSets.length}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section
        style={{
          border: "1px solid #444",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2>Saved Sessions</h2>
        <p>
          <strong>Total saved sessions:</strong> {workoutSessions.length}
        </p>

        {workoutSessions.length > 0 && (
          <ul style={{ paddingLeft: 20 }}>
            {workoutSessions.map((session) => (
              <li key={session.id} style={{ marginBottom: 12 }}>
                <p>
                  <strong>ID:</strong> {session.id}
                </p>
                <p>
                  <strong>Status:</strong> {session.status}
                </p>
                <p>
                  <strong>Date:</strong> {session.date}
                </p>
                <p>
                  <strong>Exercises:</strong> {session.exercises.length}
                </p>
                <p>
                  <strong>Ended:</strong> {session.endedAt ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}