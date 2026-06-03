import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import {
  OFFICIAL_SERVER_ID,
  OFFICIAL_SERVER_NAME,
  ROLES,
} from './constants.js';

// ---- small helpers ---------------------------------------------------------

// A compact snapshot of a user, denormalized onto members/messages so we can
// render names + avatars without an extra read per row.
function userCard(profile) {
  return {
    uid: profile.uid,
    username: profile.username || 'Unknown',
    photoURL: profile.photoURL || null,
  };
}

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars
export function generateInviteCode(length = 6) {
  let code = '';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i += 1) {
    code += INVITE_ALPHABET[values[i] % INVITE_ALPHABET.length];
  }
  return code;
}

// ---- membership ------------------------------------------------------------

// Writes the two records that represent "X is in server Y":
//   servers/{sid}/members/{uid}  — source of truth for permissions
//   users/{uid}/memberships/{sid} — denormalized mirror that powers the rail
async function writeMembership(profile, server, role) {
  const card = userCard(profile);
  await setDoc(doc(db, 'servers', server.id, 'members', profile.uid), {
    ...card,
    role,
    joinedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'users', profile.uid, 'memberships', server.id), {
    serverId: server.id,
    serverName: server.name,
    serverIcon: server.icon || null,
    isOfficial: server.isOfficial || false,
    role,
    joinedAt: serverTimestamp(),
  });
}

// ---- official server -------------------------------------------------------

// Idempotently make sure the shared "Official Updates" server exists, then drop
// the given user into it. The first person to ever sign up creates it (and
// becomes its owner); everyone after just joins as a member.
export async function ensureOfficialServerMembership(profile) {
  const serverRef = doc(db, 'servers', OFFICIAL_SERVER_ID);
  const snap = await getDoc(serverRef);

  if (!snap.exists()) {
    await setDoc(serverRef, {
      name: OFFICIAL_SERVER_NAME,
      icon: null,
      ownerId: profile.uid,
      inviteCode: generateInviteCode(),
      isOfficial: true,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'servers', OFFICIAL_SERVER_ID, 'channels', 'announcements'), {
      name: 'announcements',
      position: 0,
      createdAt: serverTimestamp(),
    });
  }

  const server = {
    id: OFFICIAL_SERVER_ID,
    name: OFFICIAL_SERVER_NAME,
    icon: snap.exists() ? snap.data().icon : null,
    isOfficial: true,
  };
  // The creator owns it (admin); everyone else is a member.
  const role = !snap.exists() ? ROLES.ADMIN : ROLES.MEMBER;
  await writeMembership(profile, server, role);
}

// ---- profiles --------------------------------------------------------------

export async function createUserProfile({ uid, email, username, photoURL = null }) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    username,
    photoURL,
    isStaff: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, fields) {
  await updateDoc(doc(db, 'users', uid), fields);
}

// ---- servers ---------------------------------------------------------------

export async function createServer(profile, { name, icon = null }) {
  const serverRef = doc(collection(db, 'servers'));
  const server = {
    id: serverRef.id,
    name: name.trim(),
    icon,
    isOfficial: false,
  };

  // Order matters: the server doc must exist before we write the owner's member
  // doc, because the security rule for that write reads servers/{id}.ownerId.
  await setDoc(serverRef, {
    name: server.name,
    icon,
    ownerId: profile.uid,
    inviteCode: generateInviteCode(),
    isOfficial: false,
    createdAt: serverTimestamp(),
  });
  await writeMembership(profile, server, ROLES.ADMIN);

  // Every server starts with a #general channel.
  await addDoc(collection(db, 'servers', serverRef.id, 'channels'), {
    name: 'general',
    position: 0,
    createdAt: serverTimestamp(),
  });

  return serverRef.id;
}

export async function findServerByInviteCode(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const q = query(
    collection(db, 'servers'),
    where('inviteCode', '==', normalized),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function joinByInviteCode(profile, code) {
  const server = await findServerByInviteCode(code);
  if (!server) {
    throw new Error('No server found for that invite code.');
  }
  const existing = await getDoc(
    doc(db, 'servers', server.id, 'members', profile.uid)
  );
  if (existing.exists()) {
    return server.id; // already a member — just open it
  }
  await writeMembership(
    profile,
    { id: server.id, name: server.name, icon: server.icon, isOfficial: server.isOfficial },
    ROLES.MEMBER
  );
  return server.id;
}

export async function leaveServer(uid, serverId) {
  await deleteDoc(doc(db, 'servers', serverId, 'members', uid));
  await deleteDoc(doc(db, 'users', uid, 'memberships', serverId));
}

export async function updateServerMeta(serverId, fields) {
  await updateDoc(doc(db, 'servers', serverId), fields);
  // Keep each member's rail mirror in sync with the new name/icon.
  const membersSnap = await getDocs(collection(db, 'servers', serverId, 'members'));
  await Promise.all(
    membersSnap.docs.map((m) => {
      const mirror = {};
      if (fields.name !== undefined) mirror.serverName = fields.name;
      if (fields.icon !== undefined) mirror.serverIcon = fields.icon;
      return updateDoc(doc(db, 'users', m.id, 'memberships', serverId), mirror).catch(
        () => {} // member may have removed their own mirror; ignore
      );
    })
  );
}

// ---- members ---------------------------------------------------------------

export async function updateMemberRole(serverId, uid, role) {
  await updateDoc(doc(db, 'servers', serverId, 'members', uid), { role });
  await updateDoc(doc(db, 'users', uid, 'memberships', serverId), { role }).catch(
    () => {}
  );
}

export async function removeMember(serverId, uid) {
  await deleteDoc(doc(db, 'servers', serverId, 'members', uid));
  // Best-effort: only the member themselves or staff can clear their mirror.
  await deleteDoc(doc(db, 'users', uid, 'memberships', serverId)).catch(() => {});
}

// ---- channels --------------------------------------------------------------

export async function createChannel(serverId, name, position = 0) {
  const ref = await addDoc(collection(db, 'servers', serverId, 'channels'), {
    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
    position,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameChannel(serverId, channelId, name) {
  await updateDoc(doc(db, 'servers', serverId, 'channels', channelId), {
    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
  });
}

export async function deleteChannel(serverId, channelId) {
  await deleteDoc(doc(db, 'servers', serverId, 'channels', channelId));
}

// ---- messages --------------------------------------------------------------

export async function sendMessage(serverId, channelId, profile, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(
    collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
    {
      ...userCard(profile),
      authorId: profile.uid,
      authorName: profile.username || 'Unknown',
      authorPhoto: profile.photoURL || null,
      text: trimmed,
      createdAt: serverTimestamp(),
    }
  );
}

export async function deleteMessage(serverId, channelId, messageId) {
  await deleteDoc(
    doc(db, 'servers', serverId, 'channels', channelId, 'messages', messageId)
  );
}
