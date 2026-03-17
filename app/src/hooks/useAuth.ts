import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, session, isLoading, initialized, initialize, signIn, signUp, signInWithGoogle, signOut } =
    useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
