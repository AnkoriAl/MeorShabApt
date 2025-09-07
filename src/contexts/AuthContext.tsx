import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { supabaseDataService } from '../services/supabaseDataService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, preferredName: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    let loadingResolved = false;
    console.log('[Auth] provider mounted');
    // Absolute safety valve in case anything hangs
    const safetyTimer = setTimeout(() => {
      if (!loadingResolved) {
        console.warn('[Auth] safety timer resolving loading state');
        setIsLoading(false);
        loadingResolved = true;
      }
    }, 3000);
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] getSession ->', !!session);
        if (session?.user) {
          let user = await supabaseDataService.getUserById(session.user.id);
          console.log('[Auth] profile fetch ->', !!user);
          if (!user) {
            // Attempt to create a minimal profile row, then retry
            try {
              await supabaseDataService.createUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'participant',
                status: 'active',
                preferredName: (session.user.email || 'user').split('@')[0]
              });
              user = await supabaseDataService.getUserById(session.user.id);
            } catch (e) {
              console.warn('[Auth] profile create fallback failed, using ephemeral user');
              user = {
                id: session.user.id,
                email: session.user.email || '',
                role: 'participant',
                createdAt: new Date(),
                status: 'active',
                preferredName: (session.user.email || 'user').split('@')[0]
              } as any;
            }
          }
          if (user) setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        loadingResolved = true;
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes, including initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange', event, !!session);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        console.log('[Auth] processing signed in user');
        
        // Create immediate ephemeral user to unblock UI
        const ephemeralUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'participant',
          createdAt: new Date(),
          status: 'active',
          preferredName: (session.user.email || 'user').split('@')[0]
        };
        setCurrentUser(ephemeralUser);
        setIsLoading(false);
        
        // Background: try to get user from database and update if found
        (async () => {
          try {
            console.log('[Auth] Attempting to fetch user from database...');
            const dbUser = await supabaseDataService.getUserById(session.user.id);
            console.log('[Auth] Database user fetched:', dbUser);
            if (dbUser) {
              console.log('[Auth] Updating user with database data, role:', dbUser.role);
              setCurrentUser(dbUser);
              return;
            }
          } catch (error) {
            console.log('[Auth] Could not fetch user from database:', error);
          }
          
          // If no database user found, create one
          try {
            await supabaseDataService.createUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'participant',
              status: 'active',
              preferredName: (session.user.email || 'user').split('@')[0]
            });
            const dbUser = await supabaseDataService.getUserById(session.user.id);
            if (dbUser) setCurrentUser(dbUser);
          } catch (_) {
            // Keep ephemeral user if DB sync fails
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
      if (!loadingResolved) {
        setIsLoading(false);
        loadingResolved = true;
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('[Auth] login called with email:', email);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );
      
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      console.log('[Auth] signInWithPassword result:', !!data?.user, error?.message);
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user) {
        // Create immediate ephemeral user to unblock UI
        const baseUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'participant',
          createdAt: new Date(),
          status: 'active',
          preferredName: (data.user.email || email).split('@')[0]
        };
        setCurrentUser(baseUser);
        setIsLoading(false);

        // In background, try to get user from database and update if found
        (async () => {
          try {
            console.log('[Auth] Login: Attempting to fetch user from database...');
            const dbUser = await supabaseDataService.getUserById(data.user.id);
            console.log('[Auth] Login: Database user fetched:', dbUser);
            if (dbUser) {
              console.log('[Auth] Login: Updating user with database data, role:', dbUser.role);
              setCurrentUser(dbUser);
              return;
            }
          } catch (error) {
            console.log('[Auth] Login: Could not fetch user from database:', error);
          }

          // If no database user found, create one
          try {
            await supabaseDataService.createUser({
              id: baseUser.id,
              email: baseUser.email,
              role: baseUser.role,
              status: baseUser.status,
              preferredName: baseUser.preferredName
            });
            const refreshed = await supabaseDataService.getUserById(baseUser.id);
            if (refreshed) setCurrentUser(refreshed);
          } catch (_) {
            // ignore background sync errors
          }
        })();

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, preferredName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        // If email already registered, try to sign in instead
        if (error.message?.toLowerCase().includes('already') || error.status === 400) {
          const loggedIn = await login(email, password);
          if (loggedIn) {
            // Ensure user profile exists
            const session = await supabase.auth.getUser();
            const authUser = session.data.user;
            if (authUser) {
              try {
                await supabaseDataService.createUser({
                  id: authUser.id,
                  email,
                  role: 'participant',
                  status: 'active',
                  preferredName
                });
              } catch (_) {}
            }
            return true;
          }
        }
        console.error('Signup error:', error.message);
        return false;
      }

      if (data.user) {
        try {
          // Create user record in our users table
          const user = await supabaseDataService.createUser({
            id: data.user.id,
            email,
            role: 'participant',
            status: 'active',
            preferredName,
          });

          if (user) {
            setCurrentUser(user);
            return true;
          }
        } catch (dbError) {
          console.error('Database error during signup:', dbError);
          // If database creation fails, we still have the auth user
          // Let's try to get the user from the database
          const existingUser = await supabaseDataService.getUserById(data.user.id);
          if (existingUser) {
            setCurrentUser(existingUser);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isLoading
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Authentication Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}