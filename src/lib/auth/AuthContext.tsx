'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthSessionUser,
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
} from '../firebase/authService';
import { User, DocumentItem, UserRole, PersonaType } from '@/types';
import { INITIAL_USERS, createSvgAvatar } from '../state/mockData';

interface AuthContextType {
  user: AuthSessionUser | null;
  activeProfile: User;
  isAuthenticated: boolean;
  authHydrated: boolean;
  isAdmin: boolean;
  isGuardian: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role?: UserRole,
    persona?: PersonaType
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchQuickCompanion: (companionId: string) => void;
  canAccessMedical: (targetUserId: string) => boolean;
  canViewDocument: (doc: DocumentItem) => boolean;
  canEditItinerary: () => boolean;
  canApproveExpenses: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pure RBAC Helper for granular document sharing verification
export function canViewDocumentWithUser(
  doc: DocumentItem,
  user: { uid?: string; id?: string; role?: string } | null,
  isGuardian = false
): boolean {
  if (doc.sharingScope === 'family_all') return true;
  const userId = user?.uid || user?.id;
  if (userId && doc.ownerId === userId) return true;
  if (isGuardian && (doc.ownerId === 'dadaji' || doc.ownerId === 'kabir')) return true;
  if (doc.sharingScope === 'planner_only' && user?.role === 'planner') return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<User>(INITIAL_USERS[0]);
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);

  // Sync with persistent local session if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sahyatri_active_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          const matched = INITIAL_USERS.find((u) => u.id === parsed.uid);
          if (matched) {
            setActiveProfile(matched);
          } else {
            setActiveProfile({
              id: parsed.uid,
              name: parsed.displayName || 'Traveler',
              role: parsed.role || 'planner',
              personaType: parsed.personaType || 'standard',
              relationship: parsed.role === 'planner' ? 'Trip Leader' : 'Companion',
              age: parsed.personaType === 'elderly' ? 70 : parsed.personaType === 'kid' ? 10 : 28,
              avatar: parsed.photoURL || createSvgAvatar((parsed.displayName || 'TR').slice(0, 2).toUpperCase(), '#0284c7', '#1d4ed8'),
              phone: '+91 98000 00000',
              batteryLevel: 90,
              voiceCredits: 100,
              preferences: {
                dietary: ['Vegetarian'],
                medical: [],
                mobility: { maxWalkingMeters: 3000, needsRampOrElevator: false, stairTolerance: 'normal' },
                pacePreference: 'moderate',
              },
            });
          }
        } catch {
          // ignore parsing error
        }
      }
      setAuthHydrated(true);
    }


    const unsubscribe = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setUser((prev) => ({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Traveler',
          photoURL: fbUser.photoURL,
          role: prev?.role || 'companion',
          personaType: prev?.personaType || 'standard',
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = user?.role === 'planner' || activeProfile.role === 'planner';
  const isGuardian = isAdmin || user?.uid === 'rohan';

  // Role-Based Access Control: Medical & Prescription Privacy
  const canAccessMedical = (targetUserId: string): boolean => {
    // 1. You can always view your own medical info
    if (activeProfile.id === targetUserId || user?.uid === targetUserId) {
      return true;
    }
    // 2. Family Guardian (Rohan) can view elderly Dadaji & young Kabir for safety
    if (isGuardian && (targetUserId === 'dadaji' || targetUserId === 'kabir')) {
      return true;
    }
    // 3. Other companions CANNOT view another person's private health records!
    return false;
  };

  // Role-Based Access Control: Granular Document Vault Sharing
  const canViewDocument = (doc: DocumentItem): boolean => {
    return canViewDocumentWithUser(doc, user || activeProfile, isGuardian);
  };

  const canEditItinerary = (): boolean => isAdmin;
  const canApproveExpenses = (): boolean => isAdmin;

  // Sign In / Sign Up Operations
  const handleSignInWithEmail = async (email: string, pass: string) => {
    const session = await loginWithEmail(email, pass);
    setUser(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(session));
    }
    const matched = INITIAL_USERS.find((u) => u.id === session.uid) || {
      id: session.uid,
      name: session.displayName || email.split('@')[0],
      role: session.role || 'planner',
      personaType: session.personaType || 'standard',
      relationship: session.role === 'planner' ? 'Trip Leader' : 'Companion',
      age: session.personaType === 'elderly' ? 70 : session.personaType === 'kid' ? 10 : 28,
      avatar: createSvgAvatar((session.displayName || email).slice(0, 2).toUpperCase(), '#0284c7', '#1d4ed8'),
      phone: '+91 98000 00000',
      batteryLevel: 90,
      voiceCredits: 100,
      preferences: {
        dietary: ['Vegetarian'],
        medical: [],
        mobility: { maxWalkingMeters: 3000, needsRampOrElevator: false, stairTolerance: 'normal' },
        pacePreference: 'moderate',
      },
    };
    setActiveProfile(matched);
    setIsAuthModalOpen(false);
  };

  const handleSignUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'companion',
    persona: PersonaType = 'standard'
  ) => {
    const session = await registerWithEmail(email, pass, name, role, persona);
    setUser(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(session));
    }
    const newProfile: User = {
      id: session.uid,
      name,
      role,
      personaType: persona,
      relationship: role === 'planner' ? 'Trip Leader' : 'Companion',
      age: persona === 'elderly' ? 70 : persona === 'kid' ? 10 : 28,
      avatar: createSvgAvatar(name.slice(0, 2).toUpperCase() || 'TR', '#0284c7', '#1d4ed8'),
      phone: '+91 98000 00000',
      preferences: {
        dietary: ['Vegetarian'],
        medical: [],
        mobility: { maxWalkingMeters: 2000, needsRampOrElevator: false, stairTolerance: 'normal' },
        pacePreference: 'moderate',
      },
    };
    setActiveProfile(newProfile);
    setIsAuthModalOpen(false);
  };

  const handleSignInWithGoogle = async () => {
    const session = await loginWithGoogle();
    setUser(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(session));
    }
    const matched = INITIAL_USERS.find((u) => u.id === session.uid);
    const googleProfile: User = matched || {
      id: session.uid,
      name: session.displayName || 'Google Companion',
      avatar: session.photoURL || createSvgAvatar('GC', '#0284c7', '#1d4ed8'),
      role: session.role || 'planner',
      personaType: session.personaType || 'standard',
      relationship: session.role === 'planner' ? 'Trip Leader' : 'Companion',
      age: 28,
      phone: '+91 98000 00000',
      batteryLevel: 90,
      voiceCredits: 100,
      preferences: {
        dietary: ['Vegetarian'],
        medical: [],
        mobility: { maxWalkingMeters: 3000, needsRampOrElevator: false, stairTolerance: 'normal' },
        pacePreference: 'moderate',
      },
    };
    setActiveProfile(googleProfile);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setActiveProfile(INITIAL_USERS[0]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sahyatri_active_session');
    }
    setIsAuthModalOpen(false);
  };


  // Quick Companion Switcher (For high-stakes evaluation / investor demos)
  const switchQuickCompanion = (companionId: string) => {
    const found = INITIAL_USERS.find((u) => u.id === companionId);
    if (!found) return;

    const session: AuthSessionUser = {
      uid: found.id,
      email: `${found.id}@traveler.sahyatri.ai`,
      displayName: found.name,
      photoURL: found.avatar,
      role: found.role,
      personaType: found.personaType,
    };

    setUser(session);
    setActiveProfile(found);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sahyatri_active_session', JSON.stringify(session));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        isAuthenticated: !!user,
        authHydrated,
        isAdmin,
        isGuardian,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        switchQuickCompanion,
        canAccessMedical,
        canViewDocument,
        canEditItinerary,
        canApproveExpenses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
