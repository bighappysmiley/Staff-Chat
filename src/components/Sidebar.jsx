import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { ROLE_LABELS, ROLE_ORDER } from '../lib/constants.js';

// Mirrors the 900px breakpoint in index.css where the sidebar becomes an
// off-canvas drawer. Used so a CLOSED drawer can be pulled out of the tab
// order (below 900px) without ever disabling the always-visible desktop panel.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 900px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

// The single left panel inside a server: back-to-home, server identity, labeled
// actions, channels, a collapsible member list, and your own user bar.
export default function Sidebar({
  server,
  channels,
  currentChannelId,
  members,
  myRole,
  canManage,
  profile,
  open,
  onClose,
  onCreateChannel,
  onOpenSettings,
  onOpenProfile,
  onLeave,
  onLogout,
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hiddenDrawer = isMobile && !open;
  const [membersOpen, setMembersOpen] = useState(true);
  const [copyStatus, setCopyStatus] = useState(null); // null | 'copied' | 'failed'

  function goChannel(id) {
    navigate(`/servers/${server.id}/${id}`);
    onClose();
  }

  async function copyInvite() {
    if (!server?.inviteCode) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(server.inviteCode);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus(null), 1800);
  }

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    people: members
      .filter((m) => m.role === role)
      .sort((a, b) => (a.username || '').localeCompare(b.username || '')),
  })).filter((g) => g.people.length > 0);

  return (
    <aside
      className={`sidebar ${open ? 'sidebar--open' : ''}`}
      // `inert` is a standard HTML attribute; React passes it straight to the
      // DOM. It removes the closed off-canvas drawer from the tab order and
      // hides it from screen readers without touching the always-visible
      // desktop panel (isMobile is false there, so hiddenDrawer is false).
      inert={hiddenDrawer ? true : undefined}
      aria-hidden={hiddenDrawer || undefined}
    >
      <div className="sidebar__top">
        <button className="back-link" onClick={() => navigate('/')}>
          ← All servers
        </button>
      </div>

      <div className="sidebar__server">
        <Avatar name={server?.name || '?'} src={server?.icon} size={40} />
        <div style={{ minWidth: 0 }}>
          <div className="sidebar__server-name" title={server?.name}>
            {server?.name || 'Loading…'}
          </div>
          {myRole && (
            <span className={`badge badge--${myRole}`}>
              {ROLE_LABELS[myRole] || myRole}
            </span>
          )}
        </div>
      </div>

      {(canManage || (server && !server.isOfficial)) && (
        <div className="sidebar__toolbar">
          {canManage && (
            <button className="btn btn--soft btn--sm" onClick={onOpenSettings}>
              ⚙ Settings
            </button>
          )}
          {server && !server.isOfficial && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={copyInvite}
              title="Copy this server's invite code to share with your team"
            >
              {copyStatus === 'copied' && '✓ Copied!'}
              {copyStatus === 'failed' && '⚠ Copy failed'}
              {!copyStatus && 'Copy invite code'}
            </button>
          )}
        </div>
      )}
      {copyStatus === 'failed' && (
        <p className="muted small sidebar__invite-fallback">
          Couldn&apos;t copy automatically — here&apos;s the code:{' '}
          <strong>{server.inviteCode}</strong>
        </p>
      )}

      <nav className="sidebar__scroll" aria-label="Channels and members">
        <div className="section-head">
          <span>Channels</span>
          {canManage && (
            <button
              className="icon-btn icon-btn--sm"
              title="Create a channel"
              aria-label="Create a channel"
              onClick={onCreateChannel}
            >
              ＋
            </button>
          )}
        </div>

        {channels.length === 0 && (
          <p className="muted small" style={{ padding: '4px 10px' }}>
            No channels yet.
          </p>
        )}

        {channels.map((channel) => (
          <button
            key={channel.id}
            className={`channel-item ${
              channel.id === currentChannelId ? 'is-active' : ''
            }`}
            onClick={() => goChannel(channel.id)}
          >
            <span className="channel-item__hash">#</span>
            <span className="channel-item__name">{channel.name}</span>
            {channel.announcementOnly && (
              <span
                className="channel-item__lock"
                title="Announcement channel — only admins & moderators can post"
              >
                🔒
              </span>
            )}
          </button>
        ))}

        <button
          className="section-head section-head--toggle"
          onClick={() => setMembersOpen((o) => !o)}
          aria-expanded={membersOpen}
        >
          <span>Members — {members.length}</span>
          <span className="chev" aria-hidden="true">{membersOpen ? '▾' : '▸'}</span>
        </button>

        {membersOpen &&
          grouped.map(({ role, people }) => (
            <div key={role}>
              {people.map((m) => (
                <div key={m.uid} className="member-row">
                  <Avatar name={m.username} src={m.photoURL} size={26} />
                  <span className="member-row__name">{m.username}</span>
                  {role !== 'member' && (
                    <span className={`badge badge--${role}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
      </nav>

      {server && !server.isOfficial && (
        <button className="sidebar__leave" onClick={onLeave}>
          Leave this server
        </button>
      )}

      <div className="sidebar__user">
        <button
          className="sidebar__me"
          onClick={onOpenProfile}
          title="Edit your profile"
        >
          <Avatar name={profile?.username} src={profile?.photoURL} size={30} />
          <span>{profile?.username}</span>
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
