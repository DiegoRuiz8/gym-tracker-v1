import type { WorkoutLog } from "../types/log";
import type { Prescription } from "../types/routine";
import type { WeightUnit } from "../store/persistence";
import type { WorkoutSessionExercise } from "../types/session";

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getLocalDateKey(dateString: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateString: string): Date {
  return parseDateOnly(getLocalDateKey(dateString));
}



export function kgToLb(valueKg: number): number {
  return Number((valueKg * 2.2046226218).toFixed(1));
}

export function lbToKg(valueLb: number): number {
  return Number((valueLb / 2.2046226218).toFixed(1));
}

function formatWeightValue(valueKg: number, unit: WeightUnit): string {
  const convertedValue = unit === "lb" ? kgToLb(valueKg) : valueKg;

  const rounded =
    Number.isInteger(convertedValue) ? String(convertedValue) : convertedValue.toFixed(1);

  return `${rounded}${unit}`;
}

export function getTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatRepRange(min?: number, max?: number): string {
  if (min == null || max == null) return "—";
  return min === max ? `${min}` : `${min}-${max}`;
}

export function formatPerformedSets(log?: WorkoutLog): string {
  if (!log || log.performedSets.length === 0) return "—";

  return log.performedSets.map((set) => set.reps).join(" / ");
}

export function formatTopWeight(
  log?: WorkoutLog,
  unit: WeightUnit = "kg",
): string {
  if (!log || log.performedSets.length === 0) return "—";

  const maxWeight = Math.max(...log.performedSets.map((set) => set.weight));
  return formatWeightValue(maxWeight, unit);
}

export function formatLogDate(date?: string): string {
  if (!date) return "—";

  const parsed = parseDateOnly(date);

  return parsed.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPrescriptionInline(prescription: Prescription): string {
  const parts: string[] = [];

  if (
    prescription.sets != null &&
    prescription.repRange?.min != null &&
    prescription.repRange?.max != null
  ) {
    const repText = formatRepRange(
      prescription.repRange.min,
      prescription.repRange.max,
    );

    parts.push(`${prescription.sets} × ${repText}`);
  } else if (prescription.sets != null) {
    parts.push(`${prescription.sets} sets`);
  }

  if (prescription.targetRIR != null) {
    parts.push(`RIR ${prescription.targetRIR}`);
  }

  if (prescription.restSeconds != null) {
    parts.push(`${prescription.restSeconds}s`);
  }

  return parts.length > 0 ? parts.join(" • ") : "No prescription";
}

export function formatLatestPerformance(
  log?: WorkoutLog,
  unit: WeightUnit = "kg",
): string {
  if (!log || log.performedSets.length === 0) {
    return "No logs yet";
  }

  return `${formatTopWeight(log, unit)} • ${formatPerformedSets(log)}`;
}

export function formatSetPerformanceInline(
  log?: WorkoutLog,
  unit: WeightUnit = "kg",
): string {
  if (!log || log.performedSets.length === 0) {
    return "No logs yet";
  }

  const allWeights = log.performedSets.map((set) => set.weight);
  const allSameWeight = allWeights.every((weight) => weight === allWeights[0]);

  if (allSameWeight) {
    const reps = log.performedSets.map((set) => set.reps).join(" / ");
    return `${formatWeightValue(allWeights[0], unit)} × ${reps}`;
  }

  return log.performedSets
    .map((set) => `${formatWeightValue(set.weight, unit)} × ${set.reps}`)
    .join(" • ");
}

export function formatPerformedSetsDetailed(
  log?: WorkoutLog,
  unit: WeightUnit = "kg",
): string[] {
  if (!log || log.performedSets.length === 0) {
    return [];
  }

  return log.performedSets.map(
    (set) => `${formatWeightValue(set.weight, unit)} × ${set.reps}`,
  );
}

export function formatSingleWeight(
  valueKg: number,
  unit: WeightUnit = "kg",
): string {
  return formatWeightValue(valueKg, unit);
}

export function getDateKey(date: string): string {
  return getLocalDateKey(date);
}

export function formatSessionExerciseSetsDetailed(
  exercise: WorkoutSessionExercise,
  unit: WeightUnit = "kg",
): string[] {
  const relevantSets = exercise.performedSets.filter((set) => {
    return (
      set.isCompleted &&
      (set.reps != null || set.weight != null || set.durationSeconds != null)
    );
  });

  return relevantSets.map((set) => {
    if (set.durationSeconds != null && set.weight != null) {
      return `${formatSingleWeight(set.weight, unit)} × ${set.durationSeconds}s`;
    }

    if (set.durationSeconds != null) {
      return `${set.durationSeconds}s`;
    }

    if (set.weight != null && set.reps != null) {
      return `${formatSingleWeight(set.weight, unit)} × ${set.reps}`;
    }

    if (set.reps != null) {
      return `${set.reps} reps`;
    }

    if (set.weight != null) {
      return formatSingleWeight(set.weight, unit);
    }

    return "—";
  });
}
