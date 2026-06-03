import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config for the Staff Chat project.
//
// These values are committed on purpose: a Firebase web config is NOT a secret
// (it only identifies the project, and ends up in the public JS bundle anyway).
// Real protection comes from the Firestore security rules + login. Committing it
// means local dev and Netlify both work with zero environment setup.
//
// Environment variables (VITE_FIREBASE_*) still take precedence if set, so you
// can point a build at a different project without touching this file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD-oHh7p41OWKD_grfQgr5DlDHXs-I3Ch8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'staff-chat-d87e4.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'staff-chat-d87e4',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'staff-chat-d87e4.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '743113058087',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:743113058087:web:3d96620861bfb7682bab02',
};

// True once we have enough config to talk to Firebase (always true now that the
// project config is committed, but kept so the SetupNotice still works if the
// values are ever blanked out).
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
