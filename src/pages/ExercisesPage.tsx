import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getLogsForVariant } from "../store/selectors";
import { formatLogDate, formatSetPerformanceInline } from "../utils/format";
import "../styles/exercises-page.css";

const EXERCISES_SCROLL_KEY = "exercises-page-scroll-y";

export default function ExercisesPage() {
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [showInactive, setShowInactive] = useState(false);

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

  const categoryOptions = useMemo(() => {
    const categories = exercises
      .map((exercise) => exercise.category?.trim())
      .filter((category): category is string =>
        Boolean(category && category.length > 0),
      );

    return ["All categories", ...Array.from(new Set(categories)).sort()];
  }, [exercises]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredExerciseGroups = useMemo(() => {
    return exercises
      .map((exercise) => {
        const exerciseMatchesCategory =
          selectedCategory === "All categories" ||
          exercise.category === selectedCategory;

        if (!exerciseMatchesCategory) {
          return null;
        }

        const visibleVariants = exerciseVariants.filter((variant) => {
          if (variant.exerciseId !== exercise.id) {
            return false;
          }

          if (!showInactive && !variant.isActive) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const setupLabel = variant.gymLabel || variant.equipment || "";

          return (
            exercise.name.toLowerCase().includes(normalizedSearch) ||
            (exercise.category ?? "")
              .toLowerCase()
              .includes(normalizedSearch) ||
            (exercise.notes ?? "").toLowerCase().includes(normalizedSearch) ||
            (exercise.muscleGroups ?? []).some((muscle) =>
              muscle.toLowerCase().includes(normalizedSearch),
            ) ||
            variant.name.toLowerCase().includes(normalizedSearch) ||
            setupLabel.toLowerCase().includes(normalizedSearch) ||
            (variant.notes ?? "").toLowerCase().includes(normalizedSearch)
          );
        });

        const exerciseMatchesSearch =
          !normalizedSearch ||
          exercise.name.toLowerCase().includes(normalizedSearch) ||
          (exercise.category ?? "").toLowerCase().includes(normalizedSearch) ||
          (exercise.notes ?? "").toLowerCase().includes(normalizedSearch) ||
          (exercise.muscleGroups ?? []).some((muscle) =>
            muscle.toLowerCase().includes(normalizedSearch),
          );

        if (visibleVariants.length === 0 && !exerciseMatchesSearch) {
          return null;
        }

        return {
          exercise,
          variants: visibleVariants,
        };
      })
      .filter(
        (
          group,
        ): group is {
          exercise: (typeof exercises)[number];
          variants: typeof exerciseVariants;
        } => Boolean(group),
      );
  }, [
    exercises,
    exerciseVariants,
    normalizedSearch,
    selectedCategory,
    showInactive,
  ]);

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
            Manage your exercise library and variant history.
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
                placeholder="Search exercises or variants..."
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

        {filteredExerciseGroups.length === 0 ? (
          <div className="exercises-page-empty-state">
            <h2 className="exercises-page-empty-title">No exercises found</h2>
            <p className="exercises-page-empty-text">
              Try adjusting your search or filters, or create a new exercise.
            </p>
          </div>
        ) : (
          <div className="exercises-page-groups">
            {filteredExerciseGroups.map(({ exercise, variants }) => (
              <section key={exercise.id} className="exercises-page-group">
                <div className="exercises-page-group-top">
                  <div className="exercises-page-group-title-wrap">
                    <p className="exercises-page-group-kicker">Exercise</p>
                    <h2 className="exercises-page-group-title">
                      {exercise.name}
                    </h2>
                  </div>

                  <div className="exercises-page-group-actions">
                    <Link
                      to={`/exercises/${exercise.id}/edit`}
                      className="exercises-page-group-btn"
                      state={{ returnTo: "/exercises" }}
                      onClick={saveCurrentScroll}
                    >
                      Edit
                    </Link>

                    <Link
                      to={`/exercises/${exercise.id}/variants/new`}
                      className="exercises-page-group-btn exercises-page-group-btn-primary"
                      state={{ returnTo: "/exercises" }}
                      onClick={saveCurrentScroll}
                    >
                      + Variant
                    </Link>
                  </div>
                </div>

                {(exercise.category ||
                  exercise.muscleGroups?.length ||
                  exercise.notes) && (
                  <div className="exercises-page-group-meta">
                    {exercise.category && (
                      <p className="exercises-page-group-detail">
                        <strong>Category:</strong> {exercise.category}
                      </p>
                    )}

                    {exercise.muscleGroups &&
                      exercise.muscleGroups.length > 0 && (
                        <p className="exercises-page-group-detail">
                          <strong>Muscles:</strong>{" "}
                          {exercise.muscleGroups.join(", ")}
                        </p>
                      )}

                    {exercise.notes && (
                      <p className="exercises-page-group-detail">
                        <strong>Notes:</strong> {exercise.notes}
                      </p>
                    )}
                  </div>
                )}

                <div className="exercises-page-variants-header">
                  <span className="exercises-page-variants-label">
                    Variants
                    <span className="exercises-page-variants-count">
                      {variants.length}
                    </span>
                  </span>
                </div>

                {variants.length === 0 ? (
                  <div className="exercises-page-empty-variants">
                    <p className="exercises-page-empty-variants-text">
                      No visible variants yet.
                    </p>

                    <Link
                      to={`/exercises/${exercise.id}/variants/new`}
                      className="exercises-page-empty-variants-link"
                      state={{ returnTo: "/exercises" }}
                      onClick={saveCurrentScroll}
                    >
                      Create the first variant
                    </Link>
                  </div>
                ) : (
                  <div className="exercises-page-variants">
                    {variants.map((variant) => {
                      const logs = getLogsForVariant(workoutLogs, variant.id);
                      const lastLog = logs[0];
                      const setupLabel = variant.gymLabel || variant.equipment;

                      return (
                        <div
                          key={variant.id}
                          className="exercises-page-variant-card"
                        >
                          <div className="exercises-page-variant-top">
                            <div className="exercises-page-variant-title-wrap">
                              <h3 className="exercises-page-variant-title">
                                {variant.name}
                              </h3>

                              {!variant.isActive && (
                                <div className="exercises-page-variant-badges">
                                  <span className="exercises-page-badge exercises-page-badge-inactive">
                                    Inactive
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="exercises-page-variant-actions">
                              <Link
                                className="exercises-page-variant-link"
                                to={`/history/variant/${variant.id}`}
                                state={{ returnTo: "/exercises" }}
                                onClick={saveCurrentScroll}
                              >
                                History
                              </Link>

                              <Link
                                className="exercises-page-variant-link"
                                to={`/variants/${variant.id}/edit`}
                                state={{ returnTo: "/exercises" }}
                                onClick={saveCurrentScroll}
                              >
                                Edit
                              </Link>
                            </div>
                          </div>

                          {(setupLabel || variant.notes) && (
                            <div className="exercises-page-variant-info">
                              {setupLabel && (
                                <p className="exercises-page-variant-detail">
                                  <strong>Setup:</strong> {setupLabel}
                                </p>
                              )}

                              {variant.notes && (
                                <p className="exercises-page-variant-detail">
                                  <strong>Notes:</strong> {variant.notes}
                                </p>
                              )}
                            </div>
                          )}

                          <p className="exercises-page-variant-latest">
                            <strong>Latest:</strong>{" "}
                            {formatSetPerformanceInline(
                              lastLog,
                              preferredWeightUnit,
                            )}
                          </p>

                          <p className="exercises-page-variant-meta">
                            {formatLogDate(lastLog?.date)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
