// src/pages/ExercisesPage.tsx

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getLogsForExercise } from "../store/selectors";
import { formatLogDate, formatSetPerformanceInline } from "../utils/format";
import {
  getExerciseDbCatalog,
  getImagesForExercise,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import ExercisePhotoToggle from "../components/exercise/ExercisePhotoToggle";
import "../styles/exercises-page.css";

const EXERCISES_SCROLL_KEY = "exercises-page-scroll-y";

export default function ExercisesPage() {
  const exercises = useAppStore((state) => state.exercises);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [showInactive, setShowInactive] = useState(false);
  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);
  const [openMenuExerciseId, setOpenMenuExerciseId] = useState<string | null>(
    null,
  );
  const openMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openMenuRef.current &&
        !openMenuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuExerciseId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(EXERCISES_SCROLL_KEY);

    if (!savedScroll) {
      return;
    }

    const parsed = Number(savedScroll);

    if (!Number.isNaN(parsed)) {
      window.scrollTo(0, parsed);
    }
  }, []);

  function saveCurrentScroll() {
    sessionStorage.setItem(EXERCISES_SCROLL_KEY, String(window.scrollY));
  }

  function handleToggleMenu(exerciseId: string) {
    setOpenMenuExerciseId((current) =>
      current === exerciseId ? null : exerciseId,
    );
  }

  function handleMenuLinkClick() {
    saveCurrentScroll();
    setOpenMenuExerciseId(null);
  }

  const categoryOptions = useMemo(() => {
    const categories = exercises
      .map((exercise) => exercise.category?.trim())
      .filter((category): category is string =>
        Boolean(category && category.length > 0),
      );

    return ["All categories", ...Array.from(new Set(categories)).sort()];
  }, [exercises]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesCategory =
        selectedCategory === "All categories" ||
        exercise.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!showInactive && !exercise.isActive) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const setupLabel = exercise.gymLabel || exercise.equipment || "";

      // Búsqueda en primaryMuscle + secondaryMuscleGroups
      const matchesPrimary = (exercise.primaryMuscle ?? "")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesSecondary = (exercise.secondaryMuscleGroups ?? []).some(
        (muscle) => muscle.toLowerCase().includes(normalizedSearch),
      );

      return (
        exercise.name.toLowerCase().includes(normalizedSearch) ||
        (exercise.category ?? "").toLowerCase().includes(normalizedSearch) ||
        (exercise.notes ?? "").toLowerCase().includes(normalizedSearch) ||
        matchesPrimary ||
        matchesSecondary ||
        setupLabel.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [exercises, normalizedSearch, selectedCategory, showInactive]);

  return (
    <div className="exercises-page">
      <div className="exercises-page-container">
        <header className="exercises-page-header">
          <div className="exercises-page-header-top">
            <h1 className="exercises-page-title">Exercises</h1>

            <Link
              to="/exercises/new"
              className="exercises-page-create-btn"
              onClick={saveCurrentScroll}
            >
              + New exercise
            </Link>
          </div>

          <p className="exercises-page-description">
            Manage your exercise library.
          </p>
        </header>

        <section
          className="exercises-page-filters"
          aria-label="Exercise filters"
        >
          <div className="exercises-page-filter-field exercises-page-filter-field-search">
            <label
              className="exercises-page-filter-label"
              htmlFor="exercise-search"
            >
              Search
            </label>

            <div className="exercises-page-filter-input-wrap">
              <input
                id="exercise-search"
                className="exercises-page-filter-input exercises-page-filter-input-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search exercises..."
              />

              {search.trim() && (
                <button
                  type="button"
                  className="exercises-page-filter-clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="exercises-page-filter-row">
            <div className="exercises-page-filter-field">
              <label
                className="exercises-page-filter-label"
                htmlFor="exercise-category-filter"
              >
                Category
              </label>
              <div className="exercises-page-filter-select-wrap">
                <select
                  id="exercise-category-filter"
                  className="exercises-page-filter-select"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="exercises-page-filter-checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              <span>Show inactive</span>
            </label>
          </div>
        </section>

        {filteredExercises.length === 0 ? (
          <div className="exercises-page-empty-state">
            <h2 className="exercises-page-empty-title">No exercises found</h2>
            <p className="exercises-page-empty-text">
              Try adjusting your search or filters, or create a new exercise.
            </p>
          </div>
        ) : (
          <div className="exercises-page-variants">
            {filteredExercises.map((exercise) => {
              const logs = getLogsForExercise(workoutLogs, exercise.id);
              const lastLog = logs[0];
              const setupLabel = exercise.gymLabel || exercise.equipment;
              const images = getImagesForExercise(
                exercise.exerciseDbId,
                catalog,
              );
              const isMenuOpen = openMenuExerciseId === exercise.id;

              const hasSecondary =
                exercise.secondaryMuscleGroups &&
                exercise.secondaryMuscleGroups.length > 0;

              return (
                <div key={exercise.id} className="exercises-page-variant-card">
                  <div className="exercises-page-variant-photo-float">
                    <ExercisePhotoToggle
                      images={images}
                      alt={exercise.name}
                      mode="compact"
                      onPlaceholderClick={() =>
                        navigate(`/exercises/${exercise.id}/edit`, {
                          state: { returnTo: "/exercises" },
                        })
                      }
                    />
                  </div>

                  <div className="exercises-page-variant-title-row">
                    <div className="exercises-page-variant-title-inline">
                      <h3 className="exercises-page-variant-title">
                        {exercise.name}
                      </h3>

                      {!exercise.isActive && (
                        <span className="exercises-page-badge exercises-page-badge-inactive">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div
                      className="exercises-page-kebab-wrap"
                      ref={isMenuOpen ? openMenuRef : undefined}
                    >
                      <button
                        type="button"
                        className="exercises-page-kebab-btn"
                        onClick={() => handleToggleMenu(exercise.id)}
                        aria-label={`More actions for ${exercise.name}`}
                        aria-expanded={isMenuOpen}
                      >
                        ⋮
                      </button>

                      {isMenuOpen && (
                        <div className="exercises-page-kebab-menu">
                          <Link
                            to={`/history/exercise/${exercise.id}`}
                            className="exercises-page-kebab-menu-item"
                            state={{ returnTo: "/exercises" }}
                            onClick={handleMenuLinkClick}
                          >
                            History
                          </Link>

                          <Link
                            to={`/exercises/${exercise.id}/edit`}
                            className="exercises-page-kebab-menu-item"
                            state={{ returnTo: "/exercises" }}
                            onClick={handleMenuLinkClick}
                          >
                            Edit
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {(exercise.category ||
                    exercise.primaryMuscle ||
                    hasSecondary ||
                    setupLabel ||
                    exercise.notes) && (
                    <div className="exercises-page-variant-info">
                      {exercise.category && (
                        <p className="exercises-page-variant-detail">
                          <strong>Category:</strong> {exercise.category}
                        </p>
                      )}

                      {exercise.primaryMuscle && (
                        <p className="exercises-page-variant-detail">
                          <strong>Primary muscle:</strong>{" "}
                          {exercise.primaryMuscle}
                        </p>
                      )}

                      {hasSecondary && (
                        <p className="exercises-page-variant-detail">
                          <strong>Secondary:</strong>{" "}
                          {exercise.secondaryMuscleGroups!.join(", ")}
                        </p>
                      )}

                      {setupLabel && (
                        <p className="exercises-page-variant-detail">
                          <strong>Setup:</strong> {setupLabel}
                        </p>
                      )}

                      {exercise.notes && (
                        <p className="exercises-page-variant-detail">
                          <strong>Notes:</strong> {exercise.notes}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="exercises-page-variant-latest">
                    <strong>Latest:</strong>{" "}
                    {formatSetPerformanceInline(lastLog, preferredWeightUnit)}
                  </p>

                  <p className="exercises-page-variant-meta">
                    {formatLogDate(lastLog?.date)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}