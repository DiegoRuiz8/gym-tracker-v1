// src/pages/RoutineDetailPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { getExerciseById, getLogsForExercise } from "../store/selectors";
import {
  getExerciseDbCatalog,
  getImagesForExercise,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import RoutineExerciseCard from "../components/routine/RoutineExersiceCard";
import PageBackButton from "../components/navigation/PageBackButton";
import { useTranslation } from "../i18n/useTranslation";
import "../styles/routine-detail.css";

type RoutineDetailLocationState = {
  from?: "home";
  fromRoutinesList?: boolean;
  restoreDetailScroll?: boolean;
};

const getRoutineDetailScrollKey = (routineId: string) =>
  `routine-detail-scroll-y:${routineId}`;

export default function RoutineDetailPage() {
  const { t } = useTranslation();
  const { routineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);

  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );
  const startWorkoutSessionFromRoutine = useAppStore(
    (state) => state.startWorkoutSessionFromRoutine,
  );

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  const routine = useMemo(
    () => routines.find((item) => item.id === routineId),
    [routines, routineId],
  );
  const locationState =
    (location.state as RoutineDetailLocationState | null) ?? null;
  const fallbackTo = locationState?.from === "home" ? "/" : "/routines";

  useEffect(() => {
    if (!routineId) {
      return;
    }

    if (locationState?.restoreDetailScroll) {
      const savedScroll = sessionStorage.getItem(
        getRoutineDetailScrollKey(routineId),
      );
      const parsed = Number(savedScroll);

      if (savedScroll !== null && !Number.isNaN(parsed)) {
        let animationFrame: number | undefined;
        let attempts = 0;

        const restoreScroll = () => {
          window.scrollTo(0, parsed);

          attempts += 1;
          if (attempts < 20) {
            animationFrame = window.requestAnimationFrame(restoreScroll);
          }
        };

        animationFrame = window.requestAnimationFrame(restoreScroll);

        return () => {
          if (animationFrame !== undefined) {
            window.cancelAnimationFrame(animationFrame);
          }
        };
      }
    }

    window.scrollTo(0, 0);
  }, [routineId, locationState]);

  if (!routine) {
    return (
      <div className="routine-detail-page">
        <div className="routine-detail-container">
          <div className="routine-detail-back-row">
            <PageBackButton fallbackTo={fallbackTo} />
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

  const safeRoutine = routine;

  function saveCurrentDetailScroll() {
    sessionStorage.setItem(
      getRoutineDetailScrollKey(safeRoutine.id),
      String(window.scrollY),
    );
  }

  const sortedExerciseRefs = [...safeRoutine.exerciseRefs].sort(
    (a, b) => a.order - b.order,
  );

  const hasActiveWorkout = activeWorkoutSession !== null;
  const isSameRoutineActive =
    activeWorkoutSession?.routineId === safeRoutine.id;
  const hasOtherRoutineActive =
    hasActiveWorkout && activeWorkoutSession?.routineId !== safeRoutine.id;

  function handlePrimaryWorkoutAction() {
    if (isSameRoutineActive) {
      navigate("/active-workout");
      return;
    }

    if (hasOtherRoutineActive) {
      navigate("/active-workout");
      return;
    }

    startWorkoutSessionFromRoutine(safeRoutine.id);
    navigate("/active-workout");
  }

  return (
    <div className="routine-detail-page">
      <div className="routine-detail-container">
        <header className="routine-detail-header">
          <div className="routine-detail-back-row">
            <PageBackButton fallbackTo={fallbackTo} />
          </div>

          <div className="routine-detail-header-top">
            <div className="routine-detail-title-wrap">
              <h1 className="routine-detail-title">{safeRoutine.name}</h1>
            </div>

            <Link
              to={`/routines/${safeRoutine.id}/edit`}
              state={{
                returnTo: `/routines/${safeRoutine.id}`,
                restoreDetailScroll: true,
                scrollToAddExercise: true,
              }}
              className="routine-detail-add-exercise-btn"
              onClick={saveCurrentDetailScroll}
            >
              <span aria-hidden="true">+</span>
              <span>{t("Add exercise")}</span>
            </Link>

            {safeRoutine.description && (
              <p className="routine-detail-description">
                {safeRoutine.description}
              </p>
            )}
          </div>
        </header>

        <section className="routine-detail-workout-cta">
          <button
            type="button"
            className="routine-detail-start-btn"
            onClick={handlePrimaryWorkoutAction}
            aria-label={
              isSameRoutineActive || hasOtherRoutineActive
                ? t("Resume")
                : t("Start workout")
            }
          >
            {isSameRoutineActive
              ? t("Resume")
              : hasOtherRoutineActive
                ? t("Resume")
                : t("Train")}
          </button>

          {hasOtherRoutineActive && (
            <p className="routine-detail-workout-note">
              {t("You already have an active workout in progress.")}
            </p>
          )}
        </section>

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
              const logsForExercise = getLogsForExercise(
                workoutLogs,
                ref.exerciseId,
              );
              const lastLog = logsForExercise[0];
              const images = getImagesForExercise(
                exercise?.exerciseDbId,
                catalog,
              );

              return (
                <RoutineExerciseCard
                  key={ref.id}
                  routine={safeRoutine}
                  exerciseRef={ref}
                  exercise={exercise}
                  images={images}
                  lastLog={lastLog}
                  onBeforeNavigate={saveCurrentDetailScroll}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
