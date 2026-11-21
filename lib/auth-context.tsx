'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isMasterAdminEmail, syncUserProfile } from './firebase-db';

interface AuthContextValue {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase().trim() || '';
        let resolvedIsAdmin = false;

        try {
          // 1. Check if user is the designated Master Admin
          if (email && isMasterAdminEmail(email)) {
            resolvedIsAdmin = true;

            // Auto-seed the master admin record in the admins collection if not present
            try {
              const masterDoc = await getDoc(doc(db, 'admins', email));
              if (!masterDoc.exists()) {
                await setDoc(doc(db, 'admins', email), {
                  email,
                  name: firebaseUser.displayName || (email === 'cavaxioglobals@gmail.com' ? 'Cavaxio Admin' : 'Ralph Rosellini'),
                  role: 'master_admin',
                  active: true,
                  addedBy: 'System Master Pre-configured',
                  addedAt: new Date().toISOString(),
                  updatedAt: serverTimestamp(),
                }, { merge: true });
              }
            } catch (seedErr) {
              console.warn('Could not auto-seed master admin document:', seedErr);
            }
          }

          // 2. Check if user's email has an active document in Firestore 'admins'
          if (!resolvedIsAdmin && email) {
            const emailAdminDoc = await getDoc(doc(db, 'admins', email));
            if (emailAdminDoc.exists()) {
              const data = emailAdminDoc.data();
              if (data?.active !== false) {
                resolvedIsAdmin = true;
              }
            }
          }

          // 3. Fallback check by UID in 'admins'
          if (!resolvedIsAdmin && firebaseUser.uid) {
            const uidAdminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
            if (uidAdminDoc.exists()) {
              const data = uidAdminDoc.data();
              if (data?.active !== false) {
                resolvedIsAdmin = true;
              }
            }
          }
        } catch (err) {
          console.error('Error resolving admin permissions:', err);
          // If Firestore query fails, fallback to hardcoded master admin check
          if (email && isMasterAdminEmail(email)) {
            resolvedIsAdmin = true;
          }
        }

        setIsAdmin(resolvedIsAdmin);

        // 4. Automatically save/update user profile in the 'users' collection (folder) in database
        try {
          await syncUserProfile(firebaseUser, resolvedIsAdmin);
        } catch (syncErr) {
          console.error('Failed to sync user profile into users collection:', syncErr);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
