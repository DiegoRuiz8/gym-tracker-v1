import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { getLogsForVariant } from "../store/selectors";
import {
  formatLogDate,
  formatSetPerformanceInline,
} from "../utils/format";
import "../styles/exercises-page.css";

export default function ExercisesPage() {
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);

  const exerciseGroups = useMemo(() => {
    return exercises
      .map((exercise) => {
        const variants = exerciseVariants.filter(
          (variant) => variant.exerciseId === exercise.id,
        );

        return {
          exercise,
          variants,
        };
      })
      .filter((group) => group.variants.length > 0);
  }, [exercises, exerciseVariants]);

  return (
    <div className="exercises-page">
      <div className="exercises-page-container">
        <header className="exercises-page-header">
          <h1 className="exercises-page-title">Exercises</h1>
          <p className="exercises-page-description">
            Browse your exercise library and inspect variant-specific history.
          </p>
        </header>

        {exerciseGroups.length === 0 ? (
          <p className="exercises-page-empty">No exercises found.</p>
        ) : (
          <div className="exercises-page-groups">
            {exerciseGroups.map(({ exercise, variants }) => (
              <section key={exercise.id} className="exercises-page-group">
                <h2 className="exercises-page-group-title">{exercise.name}</h2>

                <div className="exercises-page-variants">
                  {variants.map((variant) => {
                    const logs = getLogsForVariant(workoutLogs, variant.id);
                    const lastLog = logs[0];

                    return (
                      <div
                        key={variant.id}
                        className="exercises-page-variant-card"
                      >
                        <div className="exercises-page-variant-top">
                          <h3 className="exercises-page-variant-title">
                            {variant.name}
                          </h3>

                          <Link
                            className="exercises-page-variant-link"
                            to={`/history/variant/${variant.id}`}
                          >
                            View history
                          </Link>
                        </div>

                        <p className="exercises-page-variant-latest">
                          <strong>Latest:</strong>{" "}
                          {formatSetPerformanceInline(lastLog)}
                        </p>

                        <p className="exercises-page-variant-meta">
                          {formatLogDate(lastLog?.date)} • {logs.length} log
                          {logs.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}