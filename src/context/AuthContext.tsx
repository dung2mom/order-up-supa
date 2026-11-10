import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null; url?: string }>;
  signInWithDemo: (customName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onLoginSuccess?: () => void }> = ({
  children,
  onLoginSuccess,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();

  // Fetch or sync public.users record
  const fetchProfile = useCallback(async (userId: string, currentUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else if (currentUser) {
        // Fallback upsert if trigger was not instantaneous
        const fallbackProfile = {
          id: currentUser.id,
          email: currentUser.email || null,
          name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split('@')[0] ||
            'Student',
          avatar_url:
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            null,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('users').upsert(fallbackProfile);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // 0. Handle OAuth callback hash if returned directly to parent window
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data }) => {
            if (data?.session && mounted) {
              setSession(data.session);
              setUser(data.session.user);
              fetchProfile(data.session.user.id, data.session.user);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          });
      }
    }

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
        if (event === 'SIGNED_IN') {
          onLoginSuccess?.();
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    // 3. Listen for OAuth success message from popup window (/auth/callback)
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        const hashStr = (event.data.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(hashStr);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (data?.session && mounted) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchProfile(data.session.user.id, data.session.user);
            onLoginSuccess?.();
          }
        } else {
          // If authorization code or already set in storage
          const { data } = await supabase.auth.getSession();
          if (data?.session && mounted) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchProfile(data.session.user.id, data.session.user);
            onLoginSuccess?.();
          }
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [fetchProfile, onLoginSuccess, supabase]);

  // Popup-based Google Sign In (Prevents iframe 403 error)
  const signInWithGoogle = async (): Promise<{ error: Error | null; url?: string }> => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (!data?.url) {
        return { error: new Error('Failed to retrieve authentication URL') };
      }

      // Open Google OAuth directly in a popup window so it does not navigate the iframe
      const width = 520;
      const height = 650;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);

      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        return {
          error: new Error('popup_blocked'),
          url: data.url,
        };
      }

      // Poll for popup closure
      return new Promise<{ error: Error | null }>((resolve) => {
        let resolved = false;
        const checkTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkTimer);
            if (!resolved) {
              resolved = true;
              const { data: sessData } = await supabase.auth.getSession();
              if (sessData?.session?.user) {
                setUser(sessData.session.user);
                setSession(sessData.session);
                await fetchProfile(sessData.session.user.id, sessData.session.user);
                onLoginSuccess?.();
              }
              resolve({ error: null });
            }
          }
        }, 800);

        setTimeout(() => {
          if (!resolved) {
            clearInterval(checkTimer);
            resolved = true;
            resolve({ error: null });
          }
        }, 120000);
      });
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Instant demo student login (100% fail-proof, no popups or external consent needed)
  const signInWithDemo = async (customName?: string): Promise<{ error: Error | null }> => {
    try {
      setIsLoading(true);
      const studentName = customName || 'Cafe Student (학생)';
      const demoEmail = 'student@cafetalk.local';
      const demoId = 'a0000000-0000-0000-0000-000000000001';

      const demoProfile: UserProfile = {
        id: demoId,
        email: demoEmail,
        name: studentName,
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CafeStudent',
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('users').upsert(demoProfile);
      } catch (err) {
        console.warn('Demo profile upsert notice:', err);
      }

      setProfile(demoProfile);

      const mockUser: any = {
        id: demoId,
        email: demoEmail,
        user_metadata: {
          full_name: studentName,
          name: studentName,
          avatar_url: demoProfile.avatar_url,
        },
      };

      setUser(mockUser);
      setSession({
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as any);

      onLoginSuccess?.();
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.warn('SignOut error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithDemo,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
