import { Link } from "react-router-dom";
import type { Exercise, ExerciseVariant } from "../../types/exercise";
import type { WorkoutLog } from "../../types/log";
import type { Routine, RoutineExerciseRef } from "../../types/routine";
import { useAppStore } from "../../store/useAppStore";
import {
  formatLogDate,
  formatPrescriptionInline,
  formatSetPerformanceInline,
} from "../../utils/format";

type Props = {
  routine: Routine;
  exerciseRef: RoutineExerciseRef;
  exercise?: Exercise;
  variant?: ExerciseVariant;
  lastLog?: WorkoutLog;
  onBeforeNavigate?: () => void;
};

export default function RoutineExerciseCard({
  routine,
  exerciseRef,
  exercise,
  variant,
  lastLog,
  onBeforeNavigate,
}: Props) {
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const exerciseName = exercise?.name ?? "Unknown exercise";
  const variantName = variant?.name ?? "Unknown variant";

  function handleBeforeNavigate() {
    onBeforeNavigate?.();
  }

  return (
    <article className="routine-exercise-card">
      <div className="routine-exercise-card-top">
        <div className="routine-exercise-title-wrap">
          <h2 className="routine-exercise-title">
            {exerciseName}
            <span className="routine-exercise-title-separator"> — </span>
            <span className="routine-exercise-variant-inline">
              {variantName}
            </span>
          </h2>
        </div>

        <Link
          to={`/history/variant/${exerciseRef.variantId}`}
          state={{
            returnTo: `/routines/${routine.id}`,
            restoreDetailScroll: true,
          }}
          className="routine-exercise-history-link"
          onClick={handleBeforeNavigate}
        >
          History
        </Link>
      </div>

      <p className="routine-exercise-target">
        <strong>Target:</strong>{" "}
        {formatPrescriptionInline(exerciseRef.prescription)}
      </p>

      {exerciseRef.prescription.notes && (
        <p className="routine-exercise-note">
          <strong>Notes:</strong> {exerciseRef.prescription.notes}
        </p>
      )}

      <div className="routine-exercise-latest-row">
        <p className="routine-exercise-latest">
          <strong>Latest:</strong>{" "}
          {formatSetPerformanceInline(lastLog, preferredWeightUnit)}
        </p>

        {lastLog?.date && (
          <p className="routine-exercise-latest-date">
            {formatLogDate(lastLog.date)}
          </p>
        )}
      </div>
    </article>
  );
}
