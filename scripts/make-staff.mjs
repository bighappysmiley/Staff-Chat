// Promote a user to BigHappySmiley staff (global super-user).
//
// Staff status intentionally cannot be set from the app — it requires admin
// credentials. Run this once for yourself after signing up.
//
// Usage:
//   1. Download a service account key from Firebase Console →
//      Project settings → Service accounts → "Generate new private key".
//   2. Save it as serviceAccount.json in the project root (gitignored).
//   3. node scripts/make-staff.mjs someone@example.com
//
// Requires firebase-admin:  npm install --no-save firebase-admin

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-staff.mjs <email>');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  await readFile(new URL('../serviceAccount.json', import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

try {
  const user = await auth.getUserByEmail(email);
  await db.collection('users').doc(user.uid).set({ isStaff: true }, { merge: true });
  console.log(`✓ ${email} (${user.uid}) is now BigHappySmiley staff.`);
  process.exit(0);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
