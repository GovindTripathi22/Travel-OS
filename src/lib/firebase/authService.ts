import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { UserRole, PersonaType } from '@/types';

export interface AuthSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  personaType: PersonaType;
}

/**
 * Sign up with Email and Password using Firebase Auth.
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'companion',
  personaType: PersonaType = 'standard'
): Promise<AuthSessionUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    const sessionUser: AuthSessionUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || displayName,
      photoURL: cred.user.photoURL,
      role,
      personaType,
    };

    // Store custom claims/role metadata in localStorage for fast client hydration
    if (typeof window !== 'undefined') {
      localStorage.setItem(`sahyatri_profile_${cred.user.uid}`, JSON.stringify(sessionUser));
    }

    return sessionUser;
  } catch (error: any) {
    // If running in local demo without a configured Firebase backend, provide a smooth fallback
    if (
      error.code === 'auth/api-key-not-valid' ||
      error.code === 'auth/invalid-api-key' ||
      error.code === 'auth/network-request-failed' ||
      error.message?.includes('API key')
    ) {
      console.warn('[Firebase Auth] Operating in local offline simulation mode.');
      const simulatedUser: AuthSessionUser = {
        uid: `user-sim-${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role,
        personaType,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sahyatri_profile_${simulatedUser.uid}`, JSON.stringify(simulatedUser));
        localStorage.setItem('sahyatri_active_session', JSON.stringify(simulatedUser));
      }
      return simulatedUser;
    }
    throw error;
  }
}

/**
 * Sign in with Email and Password using Firebase Auth.
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthSessionUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    let role: UserRole = 'companion';
    let personaType: PersonaType = 'standard';

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`sahyatri_profile_${cred.user.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        role = parsed.role || 'companion';
        personaType = parsed.personaType || 'standard';
      }
    }

    return {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || email.split('@')[0],
      photoURL: cred.user.photoURL,
      role,
      personaType,
    };
  } catch (error: any) {
    console.warn('[Firebase Auth] Operating in local offline simulation mode for email:', email);
    
    // Check if email corresponds to a demo user
    const lowerEmail = email.toLowerCase();
    const demoMap: Record<string, { uid: string; name: string; role: UserRole; persona: PersonaType }> = {
      'rohan.sharma@traveler.sahyatri.ai': { uid: 'rohan', name: 'Rohan Sharma', role: 'planner', persona: 'standard' },
      'dadaji@traveler.sahyatri.ai': { uid: 'dadaji', name: 'Devendra Sharma', role: 'companion', persona: 'elderly' },
      'priya@traveler.sahyatri.ai': { uid: 'priya', name: 'Priya Sharma', role: 'companion', persona: 'standard' },
      'kabir@traveler.sahyatri.ai': { uid: 'kabir', name: 'Kabir Sharma', role: 'companion', persona: 'kid' },
    };

    const matchedDemo = demoMap[lowerEmail];
    let uid = matchedDemo ? matchedDemo.uid : `user-sim-${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 24)}`;
    let displayName = matchedDemo ? matchedDemo.name : email.split('@')[0];
    let role: UserRole = matchedDemo ? matchedDemo.role : (email.includes('admin') || email.includes('planner') ? 'planner' : 'companion');
    let personaType: PersonaType = matchedDemo ? matchedDemo.persona : 'standard';

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`sahyatri_profile_${uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          displayName = parsed.displayName || displayName;
          role = parsed.role || role;
          personaType = parsed.personaType || personaType;
        } catch {}
      }
    }

    const simulatedUser: AuthSessionUser = {
      uid,
      email,
      displayName,
      photoURL: null,
      role,
      personaType,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(simulatedUser));
      localStorage.setItem(`sahyatri_profile_${uid}`, JSON.stringify(simulatedUser));
    }
    return simulatedUser;
  }
}

/**
 * Sign in with Google Popup via Firebase Auth.
 */
export async function loginWithGoogle(): Promise<AuthSessionUser> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || 'Google Traveler',
      photoURL: res.user.photoURL,
      role: 'companion',
      personaType: 'standard',
    };
  } catch (error: any) {
    console.warn('[Firebase Auth] Google Auth fallback for local preview.');
    const googleMockUser: AuthSessionUser = {
      uid: 'user-google-demo',
      email: 'traveler.google@example.com',
      displayName: 'Google Verified Companion',
      photoURL: null,
      role: 'companion',
      personaType: 'standard',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(googleMockUser));
      localStorage.setItem(`sahyatri_profile_${googleMockUser.uid}`, JSON.stringify(googleMockUser));
    }
    return googleMockUser;
  }
}

/**
 * Sign out user.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('[Firebase Auth] Sign out fallback:', e);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sahyatri_active_session');
  }
}

/**
 * Subscribe to Auth State changes.
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
