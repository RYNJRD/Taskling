import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Family } from '@shared/schema';

interface AppState {
  family: Family | null;
  currentUser: User | null;
  onboardingIntent: 'create' | 'join' | null;
  setFamily: (family: Family) => void;
  setCurrentUser: (user: User) => void;
  setOnboardingIntent: (intent: 'create' | 'join' | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      family: null,
      currentUser: null,
      onboardingIntent: null,
      setFamily: (family) => set({ family }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setOnboardingIntent: (intent) => set({ onboardingIntent: intent }),
      logout: () => set({ family: null, currentUser: null, onboardingIntent: null }),
    }),
    {
      name: 'chore-app-storage',
    }
  )
);
