import type { WorkoutLog } from "../types/log";
import type { Prescription } from "../types/routine";


export function formatRepRange(min?: number, max?: number): string {
  if (min == null || max == null) return "—";
  return `${min}-${max}`;
}

export function formatPerformedSets(log?: WorkoutLog): string {
  if (!log || log.performedSets.length === 0) return "—";

  return log.performedSets.map((set) => set.reps).join(" / ");
}

export function formatTopWeight(log?: WorkoutLog): string {
  if (!log || log.performedSets.length === 0) return "—";

  const maxWeight = Math.max(...log.performedSets.map((set) => set.weight));
  return `${maxWeight} kg`;
}

export function formatLogDate(date?: string): string {
  if (!date) return "—";

  const parsed = new Date(date);

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
    parts.push(
      `${prescription.sets} × ${prescription.repRange.min}-${prescription.repRange.max}`
    );
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

export function formatLatestPerformance(log?: WorkoutLog): string {
  if (!log || log.performedSets.length === 0) {
    return "No logs yet";
  }

  return `${formatTopWeight(log)} • ${formatPerformedSets(log)}`;
}

export function formatSetPerformanceInline(log?: WorkoutLog): string {
  if (!log || log.performedSets.length === 0) {
    return "No logs yet";
  }

  const allWeights = log.performedSets.map((set) => set.weight);
  const allSameWeight = allWeights.every((weight) => weight === allWeights[0]);

  if (allSameWeight) {
    const reps = log.performedSets.map((set) => set.reps).join(" / ");
    return `${allWeights[0]}kg × ${reps}`;
  }

  return log.performedSets
    .map((set) => `${set.weight}kg × ${set.reps}`)
    .join(" • ");
}

export function formatPerformedSetsDetailed(log?: WorkoutLog): string[] {
  if (!log || log.performedSets.length === 0) {
    return [];
  }

  return log.performedSets.map(
    (set) => `${set.weight}kg × ${set.reps}`,
  );
}