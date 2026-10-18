import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../services/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  desk: string;
  company: string;
  isAnonymous: boolean;
  isFirebaseActive: boolean;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: string, company: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name?: string, role?: string, desk?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_GUEST: UserProfile = {
  uid: 'usr_guest_planner_01',
  email: 'planner.eastcoast@navifreight.io',
  displayName: 'User',
  photoURL: null,
  role: 'Logistics Planner',
  desk: 'East Coast Desk Active',
  company: 'NaviFreight Global Logistics',
  isAnonymous: true,
  isFirebaseActive: false
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Check saved session in localStorage
    const saved = localStorage.getItem('navifreight_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached session', e);
      }
    }
    return DEFAULT_GUEST;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isFirebaseConfigured();

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onUserChange(async (fbUser: User | null) => {
      if (fbUser) {
        const customRole = localStorage.getItem(`navifreight_role_${fbUser.uid}`) || 'Logistics Planner';
        const customDesk = localStorage.getItem(`navifreight_desk_${fbUser.uid}`) || 'East Coast Desk Active';
        const customComp = localStorage.getItem(`navifreight_comp_${fbUser.uid}`) || 'Steel & Power Procurement';

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
          photoURL: fbUser.photoURL,
          role: customRole,
          desk: customDesk,
          company: customComp,
          isAnonymous: fbUser.isAnonymous,
          isFirebaseActive: true
        };
        setCurrentUser(profile);
        localStorage.setItem('navifreight_user_session', JSON.stringify(profile));
      } else {
        // If not logged in via Firebase and no manual session exists
        const saved = localStorage.getItem('navifreight_user_session');
        if (!saved) {
          setCurrentUser(DEFAULT_GUEST);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isConfigured) {
        await firebaseAuth.signIn(email, pass);
      } else {
        // Fallback demo authentication when Firebase credentials are not yet linked to cloud
        await new Promise(r => setTimeout(r, 600));
        const username = email.split('@')[0] || 'User';
        const mockProfile: UserProfile = {
          uid: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
          photoURL: null,
          role: 'Logistics Planner',
          desk: 'East Coast Desk Active',
          company: 'Steel & Power Procurement',
          isAnonymous: false,
          isFirebaseActive: false
        };
        setCurrentUser(mockProfile);
        localStorage.setItem('navifreight_user_session', JSON.stringify(mockProfile));
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err?.message || 'Failed to sign in. Please verify your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string, 
    pass: string, 
    name: string, 
    role: string = 'Logistics Planner', 
    company: string = 'Steel & Power Procurement'
  ) => {
    setError(null);
    setLoading(true);
    try {
      if (isConfigured) {
        const cred = await firebaseAuth.signUp(email, pass, name);
        if (cred.user) {
          localStorage.setItem(`navifreight_role_${cred.user.uid}`, role);
          localStorage.setItem(`navifreight_desk_${cred.user.uid}`, 'East Coast Desk Active');
          localStorage.setItem(`navifreight_comp_${cred.user.uid}`, company);
        }
      } else {
        await new Promise(r => setTimeout(r, 600));
        const mockProfile: UserProfile = {
          uid: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
          displayName: name || 'User',
          photoURL: null,
          role,
          desk: 'East Coast Desk Active',
          company,
          isAnonymous: false,
          isFirebaseActive: false
        };
        setCurrentUser(mockProfile);
        localStorage.setItem('navifreight_user_session', JSON.stringify(mockProfile));
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || 'Registration failed. Please check your details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isConfigured) {
        await firebaseAuth.signInWithGoogle();
      } else {
        await new Promise(r => setTimeout(r, 700));
        const mockProfile: UserProfile = {
          uid: 'usr_google_' + Math.random().toString(36).substring(2, 9),
          email: 'google.planner@navifreight.io',
          displayName: 'Google Authenticated User',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          role: 'Senior Freight Charterer',
          desk: 'East Coast Desk Active',
          company: 'NaviFreight Global Fleet Desk',
          isAnonymous: false,
          isFirebaseActive: false
        };
        setCurrentUser(mockProfile);
        localStorage.setItem('navifreight_user_session', JSON.stringify(mockProfile));
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Google sign-in was cancelled or failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async (
    name: string = 'User', 
    role: string = 'Logistics Planner', 
    desk: string = 'East Coast Desk Active'
  ) => {
    setError(null);
    setLoading(true);
    try {
      if (isConfigured) {
        await firebaseAuth.signInGuest();
      } else {
        await new Promise(r => setTimeout(r, 400));
        const mockProfile: UserProfile = {
          uid: 'usr_guest_' + Math.random().toString(36).substring(2, 8),
          email: 'guest.planner@navifreight.io',
          displayName: name,
          photoURL: null,
          role,
          desk,
          company: 'NaviFreight Maritime Sandbox',
          isAnonymous: true,
          isFirebaseActive: false
        };
        setCurrentUser(mockProfile);
        localStorage.setItem('navifreight_user_session', JSON.stringify(mockProfile));
      }
    } catch (err: any) {
      console.error('Guest login error:', err);
      setError(err?.message || 'Guest session initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        await firebaseAuth.logOut();
      }
    } catch (err) {
      console.warn('Signout warning:', err);
    } finally {
      localStorage.removeItem('navifreight_user_session');
      setCurrentUser(DEFAULT_GUEST);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        isConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsGuest,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
