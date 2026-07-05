// src/lib/syncService.ts

import { supabase } from "./supabase";

type AppData = {
  exercises: unknown[];
  routines: unknown[];
  workoutLogs: unknown[];
  workoutSessions: unknown[];
  activeWorkoutSession: unknown | null;
  preferredWeightUnit: string;
};

export async function pushDataToSupabase(
  userId: string,
  data: AppData,
): Promise<void> {
  try {
    await supabase
      .from("user_data")
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
  } catch {
    // Fallo silencioso — offline o error de red
  }
}

export async function pullDataFromSupabase(
  userId: string,
): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}