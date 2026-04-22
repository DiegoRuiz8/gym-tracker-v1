import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { pullDataFromSupabase } from '../lib/syncService'
import { useAppStore } from './useAppStore'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

async function loadAndApplyRemoteData(userId: string) {
  const remoteData = await pullDataFromSupabase(userId)
  if (remoteData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useAppStore.getState().replaceAppData(remoteData as any)
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    set({ user: data.user, session: data.session })
    await loadAndApplyRemoteData(data.user.id)

    return { error: null }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession()

    if (data.session?.user) {
      set({
        user: data.session.user,
        session: data.session,
        isLoading: false,
      })
      await loadAndApplyRemoteData(data.session.user.id)
    } else {
      set({
        user: null,
        session: null,
        isLoading: false,
      })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
      })
    })
  },
}))