import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { sanitizeUsername } from '@/lib/formatters';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Keep a reference to the auth subscription so we only subscribe once
let authSubscription: { unsubscribe: () => void } | null = null;

async function ensureProfile(user: { id: string; user_metadata?: Record<string, string>; email?: string }) {
  // [G4] Sanitize username before storing
  const rawUsername = user.user_metadata?.username || user.email?.split('@')[0] || '';
  const username = sanitizeUsername(rawUsername);

  // Verifier si le profil existe deja
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('id', user.id)
    .single();

  if (!existing) {
    // Creer le profil
    await supabase.from('user_profiles').insert({
      id: user.id,
      username: username || 'randonneur_' + user.id.slice(-4),
    });
  } else if (!existing.username?.trim() && username) {
    // Mettre a jour si username vide
    await supabase.from('user_profiles')
      .update({ username })
      .eq('id', user.id);
  }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    try {
      // [A8] Subscribe FIRST so we don't miss auth changes during getSession()
      if (!authSubscription) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          set({
            session: newSession,
            user: newSession?.user ?? null,
          });
          if (newSession?.user) {
            ensureProfile(newSession.user);
          }
        });
        authSubscription = subscription;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        initialized: true,
      });

      // Ensure user profile exists in user_profiles table
      if (session?.user) {
        ensureProfile(session.user);
      }
    } catch {
      set({ isLoading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    set({ isLoading: false });
    return { error: error?.message ?? null };
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      const redirectUrl = makeRedirectUri({ scheme: 'randonnee-reunion' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }

      set({ isLoading: false });
      return { error: null };
    } catch {
      set({ isLoading: false });
      return { error: 'Connexion Google echouee' };
    }
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'randonnee-reunion://reset-password',
    });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    // Unsubscribe from auth state changes
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    set({ user: null, session: null, isLoading: false, initialized: false });
  },
}));
