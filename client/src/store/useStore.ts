import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Family } from '../../shared/schema';

interface AppState {
  family: Family | null;
  currentUser: User | null;
  demoUsers: User[];
  onboardingIntent: 'create' | 'join' | null;
  firebaseUid: string | null;
  pendingFamilyId: number | null;
  setFamily: (family: Family | null) => void;
  setCurrentUser: (user: User | null) => void;
  setDemoUsers: (users: User[]) => void;
  setOnboardingIntent: (intent: 'create' | 'join' | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setPendingFamilyId: (id: number | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      family: null,
      currentUser: null,
      demoUsers: [],
      onboardingIntent: null,
      firebaseUid: null,
      pendingFamilyId: null,
      setFamily: (family) => set({ family }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setDemoUsers: (users) => set({ demoUsers: users }),
      setOnboardingIntent: (intent) => set({ onboardingIntent: intent }),
      setFirebaseUid: (uid) => set({ firebaseUid: uid }),
      setPendingFamilyId: (id) => set({ pendingFamilyId: id }),
      logout: () => set({ family: null, currentUser: null, onboardingIntent: null, firebaseUid: null, pendingFamilyId: null, demoUsers: [] }),
    }),
    {
      name: 'chore-app-storage',
    }
  )
);
