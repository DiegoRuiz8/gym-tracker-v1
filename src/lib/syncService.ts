// src/lib/syncService.ts

import { supabase } from "./supabase";
import type { PersistedAppData } from "../store/persistence";

export type AppData = PersistedAppData["data"];

export type SyncResult =
  | { ok: true }
  | { ok: false; error: string; isOffline: boolean };

export type PullDataResult = {
  data: AppData | null;
  error: string | null;
  isOffline: boolean;
};

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function pushDataToSupabase(
  userId: string,
  data: AppData,
): Promise<SyncResult> {
  if (isOffline()) {
    return {
      ok: false,
      error: "You are offline. Changes are saved on this device.",
      isOffline: true,
    };
  }

  try {
    const { error } = await supabase
      .from("user_data")
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    if (error) {
      return {
        ok: false,
        error: error.message,
        isOffline: isOffline(),
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to sync changes.",
      isOffline: isOffline(),
    };
  }
}

export async function pullDataFromSupabase(
  userId: string,
): Promise<PullDataResult> {
  if (isOffline()) {
    return {
      data: null,
      error: "You are offline. Showing data saved on this device.",
      isOffline: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message, isOffline: isOffline() };
    }

    return {
      data: data?.data ? (data.data as AppData) : null,
      error: null,
      isOffline: false,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to load cloud data.",
      isOffline: isOffline(),
    };
  }
}
