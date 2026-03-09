import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getLogsForVariant,
  getVariantById,
} from "../store/selectors";
import RoutineExerciseCard from "../components/RoutineExersiceCard";
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
    return <p>Routine not found.</p>;
  }

  const sortedExerciseRefs = [...routine.exerciseRefs].sort(
    (a, b) => a.order - b.order,
  );

 return (
    <div className="routine-detail-page">
      <div className="routine-detail-container">
        <header className="routine-detail-header">
          <h1 className="routine-detail-title">{routine.name}</h1>
          {routine.description && (
            <p className="routine-detail-description">{routine.description}</p>
          )}
        </header>

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
                totalLogs={logsForVariant.length}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
