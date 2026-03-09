import type { WorkoutLog } from "../types/log";

export type SetInput = {
  reps: string;
  weight: string;
};

export function createEmptySetInput(): SetInput {
  return {
    reps: "",
    weight: "",
  };
}

export function createEmptySetInputs(count: number): SetInput[] {
  return Array.from({ length: count }, () => createEmptySetInput());
}

export function mapLogToSetInputs(log?: WorkoutLog): SetInput[] {
  if (!log || log.performedSets.length === 0) {
    return [];
  }

  return log.performedSets.map((set) => ({
    reps: String(set.reps),
    weight: String(set.weight),
  }));
}

export function buildInitialSetInputs(
  lastLog: WorkoutLog | undefined,
  prescriptionSetCount: number,
): SetInput[] {
  const lastLogSetInputs = mapLogToSetInputs(lastLog);

  const targetCount = Math.max(lastLogSetInputs.length, prescriptionSetCount);

  return Array.from({ length: targetCount }, (_, index) => {
    return lastLogSetInputs[index] ?? createEmptySetInput();
  });
}