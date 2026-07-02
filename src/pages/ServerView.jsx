import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  useServer,
  useChannels,
  useMyMembership,
  useMembers,
} from '../hooks/useFirestore.js';
import { leaveServer } from '../lib/data.js';
import { canModerate, canPostInChannel } from '../lib/constants.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatView from '../components/ChatView.jsx';
import CreateChannelModal from '../components/CreateChannelModal.jsx';
import ServerSettingsModal from '../components/ServerSettingsModal.jsx';
import ProfileSettingsModal from '../components/ProfileSettingsModal.jsx';

// A single server: sidebar (channels + members) on the left, chat on the right.
// On small screens the sidebar becomes a slide-in drawer.
export default function ServerView() {
  const { profile, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const { serverId, channelId } = useParams();

  const { server, loading: serverLoading } = useServer(serverId);
  const { channels } = useChannels(serverId);
  const { membership, loading: membershipLoading } = useMyMembership(
    serverId,
    profile.uid
  );
  const members = useMembers(serverId);

  const [modal, setModal] = useState(null); // 'channel' | 'settings' | 'profile'
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Land in the first channel once channels load.
  useEffect(() => {
    if (!serverId || channelId || channels.length === 0) return;
    navigate(`/servers/${serverId}/${channels[0].id}`, { replace: true });
  }, [serverId, channelId, channels, navigate]);

  // The sidebar drawer only makes sense below the desktop breakpoint (900px,
  // matched in index.css). If the viewport crosses back above it while open
  // (e.g. rotating a tablet), close it so its backdrop doesn't block clicks.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    function onChange(e) {
      if (e.matches) setDrawerOpen(false);
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const currentChannel = channels.find((c) => c.id === channelId) || null;
  const myRole = membership?.role;
  const isMemberHere = Boolean(membership);
  const canManage = myRole === 'admin' || isStaff;
  const canModerateHere = canModerate(myRole) || isStaff;
  const canPost =
    isMemberHere && (canPostInChannel(myRole, currentChannel) || isStaff);

  // Friendly dead-ends instead of a silently broken screen.
  if (!serverLoading && !server) {
    return (
      <NoticeScreen
        title="Server not found"
        body="It may have been deleted, or the link is wrong."
        onHome={() => navigate('/')}
      />
    );
  }
  if (!serverLoading && !membershipLoading && !isMemberHere && !isStaff) {
    return (
      <NoticeScreen
        title="You're not a member here"
        body="Ask a member for the invite code, then join from your dashboard."
        onHome={() => navigate('/')}
      />
    );
  }

  async function handleLeave() {
    if (!server || server.isOfficial) return;
    if (!window.confirm(`Leave ${server.name}?`)) return;
    await leaveServer(profile.uid, server.id);
    navigate('/', { replace: true });
  }

  return (
    <div className="server-shell">
      {drawerOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <Sidebar
        server={server}
        channels={channels}
        currentChannelId={channelId}
        members={members}
        myRole={myRole}
        canManage={canManage}
        profile={profile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreateChannel={() => setModal('channel')}
        onOpenSettings={() => setModal('settings')}
        onOpenProfile={() => setModal('profile')}
        onLeave={handleLeave}
        onLogout={logout}
      />

      <ChatView
        server={server}
        channel={currentChannel}
        profile={profile}
        canPost={canPost}
        canModerateHere={canModerateHere}
        isMemberHere={isMemberHere}
        isStaff={isStaff}
        permissionsLoading={membershipLoading}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      {modal === 'channel' && server && (
        <CreateChannelModal
          serverId={server.id}
          nextPosition={channels.length}
          onClose={() => setModal(null)}
          onDone={(id) => {
            setModal(null);
            navigate(`/servers/${server.id}/${id}`);
          }}
        />
      )}
      {modal === 'settings' && server && (
        <ServerSettingsModal
          server={server}
          currentUid={profile.uid}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'profile' && (
        <ProfileSettingsModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function NoticeScreen({ title, body, onHome }) {
  return (
    <div className="notice-screen">
      <div className="notice-card">
        <h2>{title}</h2>
        <p>{body}</p>
        <button className="btn btn--primary" onClick={onHome}>
          ← Back to your servers
        </button>
      </div>
    </div>
  );
}
