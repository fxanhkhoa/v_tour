import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import { User, UserRole } from '../types';
import appletConfig from '../../firebase-applet-config.json';

// Load config from Vite client environment variables or fallback to firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || ''
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// In-memory token cache as required by OAuth / Workspace guidelines (NEVER stored in localStorage)
let inMemoryGoogleAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return inMemoryGoogleAccessToken;
}

export function setGoogleAccessToken(token: string | null): void {
  inMemoryGoogleAccessToken = token;
}

export function isFirebaseClientConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseClientApp(): FirebaseApp | null {
  if (app) return app;
  if (!isFirebaseClientConfigured()) return null;

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    return app;
  } catch (err) {
    console.warn('Firebase client app initialization error:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const firebaseApp = getFirebaseClientApp();
  if (!firebaseApp) return null;

  try {
    auth = getAuth(firebaseApp);
    // Clear in-memory token on auth state changed if user signed out
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        inMemoryGoogleAccessToken = null;
      }
    });
    return auth;
  } catch (err) {
    console.warn('Firebase Auth initialization error:', err);
    return null;
  }
}

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    // Request contacts scope for Google Contacts integration
    googleProvider.addScope('https://www.googleapis.com/auth/contacts');
  }
  return googleProvider;
}

export interface GoogleLoginResult {
  user: User;
  token: string;
  firebaseUser?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
}

/**
 * Perform Google Login via Firebase Auth popup and synchronize with backend
 */
export async function signInWithGoogleViaFirebase(
  role: UserRole = 'traveler'
): Promise<GoogleLoginResult> {
  const firebaseAuth = getFirebaseAuth();

  // If Firebase config is present, use real Firebase popup auth
  if (firebaseAuth) {
    try {
      const provider = getGoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const fbUser: FirebaseUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Extract and cache OAuth access token in memory
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }

      // Verify and sync with backend
      const res = await fetch('/api/auth/google-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: idToken,
          email: fbUser.email,
          name: fbUser.displayName || 'Google User',
          picture: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.displayName || 'Google User')}`,
          role: role,
          firebaseUid: fbUser.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Failed to authenticate Google user with backend.');
      }

      return {
        user: data.user,
        token: data.token || idToken,
        firebaseUser: {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL
        }
      };
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      // Helpful error explanations
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. The Google popup was closed before completing.');
      }
      if (err.code === 'auth/popup-blocked') {
        throw new Error('The popup window was blocked by your browser. Please allow popups for this site.');
      }
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        throw new Error(
          'Google Sign-in provider is not enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Enable Google.'
        );
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error(
          `This domain (${window.location.hostname}) is not in Firebase authorized domains. Add it in Firebase Console > Authentication > Settings > Authorized domains.`
        );
      }
      throw err;
    }
  }

  // If Firebase environment keys are not configured yet, notify user with exact guidance or fallback
  throw new Error(
    'Firebase Client keys are missing in .env (VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID). Please add them to your environment variables or Firebase setup.'
  );
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    try {
      await firebaseSignOut(firebaseAuth);
      setGoogleAccessToken(null);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
  }
}

/**
 * Prompt traveler to authorize Google Contacts OAuth scope and return in-memory accessToken
 */
export async function requestGoogleContactsPermission(): Promise<string> {
  const existingToken = getGoogleAccessToken();
  if (existingToken) return existingToken;

  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized. Please ensure Firebase configuration is set.');
  }

  const provider = getGoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(firebaseAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Contacts access token from Google OAuth.');
    }
    setGoogleAccessToken(credential.accessToken);
    return credential.accessToken;
  } catch (err: any) {
    console.error('Google Contacts Authorization Error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Authorization cancelled. Google Contacts popup was closed.');
    }
    throw err;
  }
}

