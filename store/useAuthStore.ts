import { create } from 'zustand';
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  initialized: false,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ user: firebaseUser });

      if (firebaseUser) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          set({ isAdmin: adminDoc.exists(), loading: false, initialized: true });
        } catch {
          set({ isAdmin: false, loading: false, initialized: true });
        }
      } else {
        set({ isAdmin: false, loading: false, initialized: true });
      }
    });

    return unsubscribe;
  },
}));
