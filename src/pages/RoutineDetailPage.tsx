import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getLogsForVariant,
  getVariantById,
} from "../store/selectors";
import RoutineExerciseCard from "../components/routine/RoutineExersiceCard";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/routine-detail.css";

export default function RoutineDetailPage() {
  const { routineId } = useParams();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);

  const routine = useMemo(
    () => routines.find((item) => item.id === routineId),
    [routines, routineId],
  );

  if (!routine) {
    return (
      <div className="routine-detail-page">
        <div className="routine-detail-container">
          <div className="routine-detail-back-row">
            <PageBackButton fallbackTo="/routines" />
          </div>

          <section className="routine-detail-empty-state" aria-live="polite">
            <p className="routine-detail-empty-title">Routine not found</p>
            <p className="routine-detail-empty-text">
              The routine you are trying to open does not exist or was removed.
            </p>
          </section>
        </div>
      </div>
    );
  }

  const sortedExerciseRefs = [...routine.exerciseRefs].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="routine-detail-page">
      <div className="routine-detail-container">
        <header className="routine-detail-header">
          <div className="routine-detail-back-row">
            <PageBackButton fallbackTo="/routines" />
          </div>

          <div className="routine-detail-header-top">
            <div className="routine-detail-title-wrap">
              <h1 className="routine-detail-title">{routine.name}</h1>

              {routine.description && (
                <p className="routine-detail-description">
                  {routine.description}
                </p>
              )}
            </div>
          </div>
        </header>

        {sortedExerciseRefs.length === 0 ? (
          <section className="routine-detail-empty-state" aria-live="polite">
            <p className="routine-detail-empty-title">No exercises yet</p>
            <p className="routine-detail-empty-text">
              Add exercises to this routine to start logging performance.
            </p>
          </section>
        ) : (
          <div className="routine-detail-list">
            {sortedExerciseRefs.map((ref) => {
              const exercise = getExerciseById(exercises, ref.exerciseId);
              const variant = getVariantById(exerciseVariants, ref.variantId);
              const logsForVariant = getLogsForVariant(workoutLogs, ref.variantId);
              const lastLog = logsForVariant[0];

              return (
                <RoutineExerciseCard
                  key={ref.id}
                  routine={routine}
                  exerciseRef={ref}
                  exercise={exercise}
                  variant={variant}
                  lastLog={lastLog}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}