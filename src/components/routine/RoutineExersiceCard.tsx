// src/components/routine/RoutineExersiceCard.tsx

import { useNavigate } from "react-router-dom";
import type { Exercise } from "../../types/exercise";
import type { WorkoutLog } from "../../types/log";
import type { Routine, RoutineExerciseRef } from "../../types/routine";
import { useAppStore } from "../../store/useAppStore";
import {
  formatLogDate,
  formatPrescriptionInline,
  formatSetPerformanceInline,
} from "../../utils/format";
import ExercisePhotoToggle from "../exercise/ExercisePhotoToggle";

type Props = {
  routine: Routine;
  exerciseRef: RoutineExerciseRef;
  exercise?: Exercise;
  images: string[];
  lastLog?: WorkoutLog;
  onBeforeNavigate?: () => void;
};

export default function RoutineExerciseCard({
  routine,
  exerciseRef,
  exercise,
  images,
  lastLog,
  onBeforeNavigate,
}: Props) {
  const navigate = useNavigate();
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const exerciseName = exercise?.name ?? "Unknown exercise";

  function handleCardClick() {
    onBeforeNavigate?.();
    navigate(`/history/exercise/${exerciseRef.exerciseId}`, {
      state: {
        returnTo: `/routines/${routine.id}`,
        restoreDetailScroll: true,
      },
    });
  }

  return (
    <article
      className="routine-exercise-card"
      role="button"
      tabIndex={0}
      aria-label={`View history for ${exerciseName}`}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div
        className="routine-exercise-photo-wrap"
        onClick={(event) => event.stopPropagation()}
      >
        <ExercisePhotoToggle
          images={images}
          alt={exerciseName}
          mode="compact"
          onPlaceholderClick={() => {
            onBeforeNavigate?.();
            navigate(`/exercises/${exerciseRef.exerciseId}/edit`, {
              state: {
                returnTo: `/routines/${routine.id}`,
                scrollToExerciseDbSection: true,
              },
            });
          }}
        />
      </div>

      <h2 className="routine-exercise-title">{exerciseName}</h2>

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
