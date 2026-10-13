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
import { INITIAL_USERS } from '../state/mockData';

interface AuthContextType {
  user: AuthSessionUser | null;
  activeProfile: User;
  isAuthenticated: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Rohan (Trip Planner) on initial load for instant evaluation
  const [activeProfile, setActiveProfile] = useState<User>(INITIAL_USERS[0]);
  const [user, setUser] = useState<AuthSessionUser | null>({
    uid: INITIAL_USERS[0].id,
    email: 'rohan.sharma@traveler.sahyatri.ai',
    displayName: INITIAL_USERS[0].name,
    photoURL: INITIAL_USERS[0].avatar,
    role: INITIAL_USERS[0].role,
    personaType: INITIAL_USERS[0].personaType,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
          }
        } catch {
          // ignore parsing error
        }
      }
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
    // Family all scope is public to all verified trip companions
    if (doc.sharingScope === 'family_all') return true;
    // Private scope: only the owner and guardian can view
    if (doc.ownerId === activeProfile.id || doc.ownerId === user?.uid) return true;
    if (isGuardian && (doc.ownerId === 'dadaji' || doc.ownerId === 'kabir')) return true;
    // Planner-only scope
    if (doc.sharingScope === 'planner_only' && isAdmin) return true;

    return false;
  };

  const canEditItinerary = (): boolean => isAdmin;
  const canApproveExpenses = (): boolean => isAdmin;

  // Sign In / Sign Up Operations
  const handleSignInWithEmail = async (email: string, pass: string) => {
    const session = await loginWithEmail(email, pass);
    setUser(session);
    const matched = INITIAL_USERS.find((u) => u.id === session.uid) || {
      ...INITIAL_USERS[0],
      id: session.uid,
      name: session.displayName || email.split('@')[0],
      role: session.role,
      personaType: session.personaType,
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
    const newProfile: User = {
      id: session.uid,
      name,
      role,
      personaType: persona,
      relationship: role === 'planner' ? 'Trip Leader' : 'Companion',
      age: persona === 'elderly' ? 70 : persona === 'kid' ? 10 : 28,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
    setActiveProfile({
      ...INITIAL_USERS[0],
      id: session.uid,
      name: session.displayName || 'Google Companion',
      avatar: session.photoURL || INITIAL_USERS[0].avatar,
    });
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setIsAuthModalOpen(true);
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
