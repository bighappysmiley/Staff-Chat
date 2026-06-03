import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { canManageServer, ROLE_LABELS } from '../lib/constants.js';

// The second column: server name + channel list at the top, and the signed-in
// user's identity bar pinned to the bottom.
export default function ChannelSidebar({
  server,
  channels,
  currentChannelId,
  myRole,
  profile,
  onCreateChannel,
  onOpenServerSettings,
  onOpenProfile,
  onLeaveServer,
  onLogout,
}) {
  const navigate = useNavigate();
  const isAdmin = canManageServer(myRole);

  return (
    <aside className="channel-sidebar">
      <header className="channel-sidebar__header">
        <span className="channel-sidebar__name" title={server?.name}>
          {server?.name || 'Loading…'}
        </span>
        {isAdmin && (
          <button
            className="icon-btn"
            title="Server settings"
            onClick={onOpenServerSettings}
          >
            ⚙
          </button>
        )}
      </header>

      <div className="channel-list">
        <div className="channel-list__heading">
          <span>Channels</span>
          {isAdmin && (
            <button
              className="icon-btn icon-btn--sm"
              title="Create channel"
              onClick={onCreateChannel}
            >
              +
            </button>
          )}
        </div>

        {channels.length === 0 && (
          <p className="channel-list__empty muted">No channels yet.</p>
        )}

        {channels.map((channel) => (
          <button
            key={channel.id}
            className={`channel-item ${
              channel.id === currentChannelId ? 'is-active' : ''
            }`}
            onClick={() => navigate(`/servers/${server.id}/${channel.id}`)}
          >
            <span className="channel-hash">#</span>
            <span className="channel-name">{channel.name}</span>
          </button>
        ))}
      </div>

      <div className="channel-sidebar__footer-actions">
        {myRole && (
          <span className="role-pill" data-role={myRole}>
            {ROLE_LABELS[myRole]}
          </span>
        )}
        {server && !server.isOfficial && (
          <button className="link-btn" onClick={onLeaveServer}>
            Leave server
          </button>
        )}
      </div>

      <div className="user-bar">
        <button className="user-bar__identity" onClick={onOpenProfile} title="Edit profile">
          <Avatar name={profile?.username} src={profile?.photoURL} size={32} />
          <span className="user-bar__name">{profile?.username}</span>
        </button>
        <button className="icon-btn" title="Sign out" onClick={onLogout}>
          ⎋
        </button>
      </div>
    </aside>
  );
}
