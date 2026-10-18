import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
  User,
  Auth
} from 'firebase/auth';

// Default Firebase Configuration (reads from Vite environment variables or falls back to demo project)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoNaviFreightMaritimeAuth2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'navifreight-maritime.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'navifreight-maritime',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'navifreight-maritime.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef123456789'
};

// Check if valid production credentials are provided
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && 
    !import.meta.env.VITE_FIREBASE_API_KEY.includes('Demo')
  );
};

// Safe Firebase App Initialization
let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization note:', error);
  // Re-attempt minimal fallback
  app = initializeApp(firebaseConfig, 'navifreight-fallback');
  auth = getAuth(app);
}

export { app, auth };

// Auth Helper Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export Core Authentication Operations
export const firebaseAuth = {
  // Sign in with Email and Password
  signIn: async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  // Register with Email, Password & Display Name
  signUp: async (email: string, pass: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  },

  // Google OAuth Popup
  signInWithGoogle: async () => {
    return await signInWithPopup(auth, googleProvider);
  },

  // Anonymous Guest Sign-in
  signInGuest: async () => {
    return await signInAnonymously(auth);
  },

  // Sign out
  logOut: async () => {
    return await signOut(auth);
  },

  // Password Reset Email
  resetPassword: async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
  },

  // Auth State Listener
  onUserChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Current User Snapshot
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  }
};
