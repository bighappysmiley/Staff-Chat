import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';

// A live list of the servers the signed-in user belongs to (the left rail).
export function useMyServers(uid) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setServers([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const q = query(
      collection(db, 'users', uid, 'memberships'),
      orderBy('joinedAt', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setServers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [uid]);

  return { servers, loading };
}

// Live metadata for a single server.
export function useServer(serverId) {
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setServer(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return onSnapshot(
      doc(db, 'servers', serverId),
      (snap) => {
        setServer(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [serverId]);

  return { server, loading };
}

// The signed-in user's membership doc (their role) for one server.
// `loading` distinguishes "still checking" from "definitely not a member".
export function useMyMembership(serverId, uid) {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId || !uid) {
      setMembership(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return onSnapshot(
      doc(db, 'servers', serverId, 'members', uid),
      (snap) => {
        setMembership(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      () => {
        setMembership(null);
        setLoading(false);
      }
    );
  }, [serverId, uid]);

  return { membership, loading };
}

// Live channel list for a server, ordered.
export function useChannels(serverId) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const q = query(
      collection(db, 'servers', serverId, 'channels'),
      orderBy('position', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [serverId]);

  return { channels, loading };
}

// Live members of a server.
export function useMembers(serverId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      return undefined;
    }
    return onSnapshot(
      collection(db, 'servers', serverId, 'members'),
      (snap) => setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setMembers([])
    );
  }, [serverId]);

  return members;
}

// Live messages for a channel, oldest first.
export function useMessages(serverId, channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId || !channelId) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const q = query(
      collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => {
        // 'estimate' fills in a local time for just-sent messages while the
        // server timestamp is pending, so new messages don't flicker undated.
        setMessages(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: 'estimate' }),
          }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [serverId, channelId]);

  return { messages, loading };
}
