import { Link } from "react-router-dom";
import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine, RoutineExerciseRef } from "../types/routine";
import {
  formatLogDate,
  formatPrescriptionInline,
  formatSetPerformanceInline,
} from "../utils/format";

type RoutineExerciseCardProps = {
  routine: Routine;
  exerciseRef: RoutineExerciseRef;
  exercise?: Exercise;
  variant?: ExerciseVariant;
  lastLog?: WorkoutLog;
  totalLogs: number;
};

export default function RoutineExerciseCard({
  routine,
  exerciseRef,
  variant,
  lastLog,
  totalLogs,
}: RoutineExerciseCardProps) {
  return (
    <div className="routine-exercise-card">
      <div className="routine-exercise-card-top">
        <h3 className="routine-exercise-title">
          {variant?.name ?? "Unknown variant"}
        </h3>

        <Link
          className="routine-exercise-history-link"
          to={`/history/variant/${exerciseRef.variantId}`}
        >
          View history
        </Link>
      </div>

      <p className="routine-exercise-target">
        <strong>Target:</strong>{" "}
        {formatPrescriptionInline(exerciseRef.prescription)}
      </p>

      {exerciseRef.prescription.notes && (
        <p className="routine-exercise-note">
          {exerciseRef.prescription.notes}
        </p>
      )}

      <p className="routine-exercise-latest">
        <strong>Latest:</strong> {formatSetPerformanceInline(lastLog)}
      </p>

      <p className="routine-exercise-meta">
        {formatLogDate(lastLog?.date)} • {totalLogs} log
        {totalLogs === 1 ? "" : "s"}
      </p>

      <Link
        className="routine-exercise-action"
        to={`/routines/${routine.id}/log/${exerciseRef.variantId}`}
      >
        Record sets
      </Link>
    </div>
  );
}