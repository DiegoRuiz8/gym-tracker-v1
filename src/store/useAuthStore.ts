import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { pullDataFromSupabase } from "../lib/syncService";
import { useAppStore } from "./useAppStore";
import { getDemoAppData } from "./seedData";
import {
  loadPersistedAppData,
  loadPersistedDemoData,
} from "./persistence";

const DEMO_MODE_STORAGE_KEY = "gym-tracker-v1-demo-mode";
const DEMO_DATA_VERSION_STORAGE_KEY = "gym-tracker-v1-demo-data-version";
const DEMO_DATA_VERSION = "2";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDemo: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
  resetDemo: () => void;
  initialize: () => Promise<void>;
}

function getEmptyAppData() {
  return {
    exercises: [],
    routines: [],
    workoutLogs: [],
    workoutSessions: [],
    activeWorkoutSession: null,
    preferredWeightUnit: "kg" as const,
  };
}

function isDemoModeEnabled(): boolean {
  return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
}

function getDemoData() {
  if (
    localStorage.getItem(DEMO_DATA_VERSION_STORAGE_KEY) !== DEMO_DATA_VERSION
  ) {
    localStorage.setItem(DEMO_DATA_VERSION_STORAGE_KEY, DEMO_DATA_VERSION);
    return getDemoAppData();
  }

  return loadPersistedDemoData()?.data ?? getDemoAppData();
}

async function loadAndApplyRemoteData(userId: string) {
  const remoteData = await pullDataFromSupabase(userId);
  if (remoteData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useAppStore.getState().replaceAppData(remoteData as any);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isDemo: false,

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    set({ user: data.user, session: data.session });
    await loadAndApplyRemoteData(data.user.id);

    return { error: null };
  },

  signInWithGoogle: async () => {
    const redirectTo =
      window.location.hostname === "localhost"
        ? "http://localhost:5173/"
        : "https://gym-tracker-v1.vercel.app/";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    if (get().isDemo) {
      localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      set({ user: null, session: null, isDemo: false });
      useAppStore
        .getState()
        .replaceAppData(loadPersistedAppData()?.data ?? getEmptyAppData());
      return;
    }

    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  enterDemo: () => {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    set({ user: null, session: null, isLoading: false, isDemo: true });
    useAppStore.getState().replaceAppData(getDemoData());
  },

  resetDemo: () => {
    localStorage.setItem(DEMO_DATA_VERSION_STORAGE_KEY, DEMO_DATA_VERSION);
    useAppStore.getState().replaceAppData(getDemoAppData());
  },

  initialize: async () => {
    if (isDemoModeEnabled()) {
      set({ user: null, session: null, isLoading: false, isDemo: true });
      useAppStore.getState().replaceAppData(getDemoData());
      return;
    }

    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      set({
        user: data.session.user,
        session: data.session,
        isLoading: false,
      });
      await loadAndApplyRemoteData(data.session.user.id);
    } else {
      set({
        user: null,
        session: null,
        isLoading: false,
      });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (get().isDemo) {
        return;
      }

      set({
        user: session?.user ?? null,
        session: session ?? null,
      });
    });
  },
}));
