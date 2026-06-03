import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  useMyServers,
  useServer,
  useChannels,
  useMyMembership,
  useMembers,
} from '../hooks/useFirestore.js';
import { leaveServer } from '../lib/data.js';
import ServerRail from '../components/ServerRail.jsx';
import ChannelSidebar from '../components/ChannelSidebar.jsx';
import ChatView from '../components/ChatView.jsx';
import MemberList from '../components/MemberList.jsx';
import AddServerModal from '../components/AddServerModal.jsx';
import CreateChannelModal from '../components/CreateChannelModal.jsx';
import ServerSettingsModal from '../components/ServerSettingsModal.jsx';
import ProfileSettingsModal from '../components/ProfileSettingsModal.jsx';

export default function Dashboard() {
  const { profile, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const { serverId, channelId } = useParams();

  const { servers, loading: serversLoading } = useMyServers(profile.uid);
  const { server } = useServer(serverId);
  const { channels } = useChannels(serverId);
  const membership = useMyMembership(serverId, profile.uid);
  const members = useMembers(serverId);

  const [modal, setModal] = useState(null); // 'add' | 'channel' | 'settings' | 'profile'

  // Default into a server: the official one if we have it, else the first.
  useEffect(() => {
    if (serverId || serversLoading || servers.length === 0) return;
    const target = servers.find((s) => s.isOfficial) || servers[0];
    if (target) navigate(`/servers/${target.serverId}`, { replace: true });
  }, [serverId, servers, serversLoading, navigate]);

  // Default into a channel once channels load.
  useEffect(() => {
    if (!serverId || channelId || channels.length === 0) return;
    navigate(`/servers/${serverId}/${channels[0].id}`, { replace: true });
  }, [serverId, channelId, channels, navigate]);

  const currentChannel = channels.find((c) => c.id === channelId) || null;
  const myRole = membership?.role;

  async function handleLeave() {
    if (!server || server.isOfficial) return;
    if (!window.confirm(`Leave ${server.name}?`)) return;
    await leaveServer(profile.uid, server.id);
    navigate('/', { replace: true });
  }

  return (
    <div className="app-shell">
      <ServerRail
        servers={servers}
        currentServerId={serverId}
        isStaff={isStaff}
        onAddServer={() => setModal('add')}
        onOpenAdmin={() => navigate('/admin')}
      />

      <ChannelSidebar
        server={server}
        channels={channels}
        currentChannelId={channelId}
        myRole={myRole}
        profile={profile}
        onCreateChannel={() => setModal('channel')}
        onOpenServerSettings={() => setModal('settings')}
        onOpenProfile={() => setModal('profile')}
        onLeaveServer={handleLeave}
        onLogout={logout}
      />

      <ChatView
        server={server}
        channel={currentChannel}
        profile={profile}
        myRole={myRole}
      />

      <MemberList members={members} />

      {modal === 'add' && (
        <AddServerModal
          onClose={() => setModal(null)}
          onDone={(id) => {
            setModal(null);
            navigate(`/servers/${id}`);
          }}
        />
      )}
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
