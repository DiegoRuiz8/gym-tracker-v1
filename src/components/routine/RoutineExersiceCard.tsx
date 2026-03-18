import { Link } from "react-router-dom";
import type { Exercise, ExerciseVariant } from "../../types/exercise";
import type { WorkoutLog } from "../../types/log";
import type { Routine, RoutineExerciseRef } from "../../types/routine";
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
};

export default function RoutineExerciseCard({
  routine,
  exerciseRef,
  exercise,
  variant,
  lastLog,
}: Props) {
  const displayName = variant?.name ?? exercise?.name ?? "Unknown exercise";

  return (
    <article className="routine-exercise-card">
      <div className="routine-exercise-card-top">
        <h2 className="routine-exercise-title">{displayName}</h2>

        <Link
          to={`/history/variant/${exerciseRef.variantId}`}
          state={{ returnTo: `/routines/${routine.id}` }}
          className="routine-exercise-history-link"
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
          <strong>Latest:</strong> {formatSetPerformanceInline(lastLog)}
        </p>

        {lastLog?.date && (
          <p className="routine-exercise-latest-date">
            {formatLogDate(lastLog.date)}
          </p>
        )}
      </div>

      <div className="routine-exercise-actions">
        <Link
          to={`/routines/${routine.id}/log/${exerciseRef.variantId}`}
          className="routine-exercise-action routine-exercise-action-primary"
        >
          Log sets
        </Link>
      </div>
    </article>
  );
}
