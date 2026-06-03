import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import {
  createUserProfile,
  ensureOfficialServerMembership,
} from '../lib/data.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // `authLoading` covers the initial Firebase auth check; `profileLoading`
  // covers fetching the Firestore profile once we know who they are.
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // React to login/logout.
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
      } else {
        setProfileLoading(true);
      }
    });
  }, []);

  // Live-subscribe to the signed-in user's Firestore profile so role/staff
  // changes (e.g. an admin promoting them) show up without a reload.
  useEffect(() => {
    if (!firebaseUser) return undefined;
    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setProfileLoading(false);
      },
      () => setProfileLoading(false)
    );
    return unsub;
  }, [firebaseUser]);

  async function signup({ email, password, username }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    await createUserProfile({
      uid: cred.user.uid,
      email,
      username,
      photoURL: null,
    });
    // Drop them into Official Updates immediately.
    await ensureOfficialServerMembership({
      uid: cred.user.uid,
      username,
      photoURL: null,
    });
    return cred.user;
  }

  async function login({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Self-heal on login (best-effort — never block sign-in on it):
    //  1. Recreate a missing Firestore profile (e.g. an Auth account whose user
    //     doc was deleted, or one created before profile-writing worked).
    //  2. Make sure the account is in Official Updates.
    try {
      const fallbackName =
        cred.user.displayName || cred.user.email?.split('@')[0] || 'User';
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      let profileData;
      if (snap.exists()) {
        profileData = snap.data();
      } else {
        profileData = {
          uid: cred.user.uid,
          email: cred.user.email,
          username: fallbackName,
          photoURL: null,
        };
        await createUserProfile(profileData);
      }
      await ensureOfficialServerMembership(profileData);
    } catch (err) {
      console.warn('Account sync skipped:', err);
    }
    return cred.user;
  }

  function logout() {
    return signOut(auth);
  }

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      // A convenience object the rest of the app passes around.
      currentUser: profile,
      isStaff: Boolean(profile?.isStaff),
      loading: authLoading || (firebaseUser && profileLoading),
      signup,
      login,
      logout,
    }),
    [firebaseUser, profile, authLoading, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
