import { loadPersistedAppData, savePersistedAppData } from "./persistence";
import { migrateLegacyLogsToSessions } from "../utils/sessionMigration";

export function getInitialAppData() {
  const persisted = loadPersistedAppData();

  if (!persisted) {
    return {
      exercises: [],
      exerciseVariants: [],
      routines: [],
      workoutLogs: [],
      workoutSessions: [],
      activeWorkoutSession: null,
      preferredWeightUnit: "kg" as const,
    };
  }

  const shouldMigrateLegacyLogs =
    (persisted.version < 2 || persisted.data.workoutSessions.length === 0) &&
    persisted.data.workoutLogs.length > 0;

  if (shouldMigrateLegacyLogs) {
    const migratedSessions = migrateLegacyLogsToSessions(
      persisted.data.workoutLogs,
      persisted.data.exerciseVariants,
    );

    const migratedData = {
      ...persisted.data,
      workoutSessions: migratedSessions,
      activeWorkoutSession: null,
    };

    savePersistedAppData({
      version: 2,
      data: migratedData,
    });

    return migratedData;
  }

  return persisted.data;
}
