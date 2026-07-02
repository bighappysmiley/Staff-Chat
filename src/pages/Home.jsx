import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyServers } from '../hooks/useFirestore.js';
import Avatar from '../components/Avatar.jsx';
import TopBar from '../components/TopBar.jsx';
import AddServerModal from '../components/AddServerModal.jsx';
import ProfileSettingsModal from '../components/ProfileSettingsModal.jsx';
import { ROLE_LABELS } from '../lib/constants.js';

// The landing dashboard: every server you belong to, listed by name, plus big
// clear actions to create or join one. Official Updates is pinned first.
export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { servers, loading } = useMyServers(profile.uid);
  const [modal, setModal] = useState(null); // {type:'add', tab} | {type:'profile'}

  const official = servers.filter((s) => s.isOfficial);
  const others = servers.filter((s) => !s.isOfficial);
  const ordered = [...official, ...others];

  return (
    <div className="page">
      <TopBar onOpenProfile={() => setModal({ type: 'profile' })} />

      <main className="home">
        <section className="home-hero">
          <h1>Hi, {profile.username} 👋</h1>
          <p>Pick a server to start chatting, or add a new one.</p>
        </section>

        <section className="home-actions" aria-label="Add a server">
          <button
            className="action-card"
            onClick={() => setModal({ type: 'add', tab: 'create' })}
          >
            <span className="action-card__icon" aria-hidden="true">＋</span>
            <span className="action-card__title">Create a server</span>
            <span className="action-card__desc">
              Start a space for your team — you&apos;ll be the admin.
            </span>
          </button>
          <button
            className="action-card"
            onClick={() => setModal({ type: 'add', tab: 'join' })}
          >
            <span className="action-card__icon action-card__icon--join" aria-hidden="true">
              ⌘
            </span>
            <span className="action-card__title">Join with an invite code</span>
            <span className="action-card__desc">
              Got a code from your team? Enter it here.
            </span>
          </button>
        </section>

        <h2 className="home-section-title">Your servers</h2>

        {loading && <p className="muted">Loading your servers…</p>}

        {!loading && ordered.length === 0 && (
          <div className="home-empty">
            <p>You&apos;re not in any servers yet.</p>
            <p className="small">
              Create one above, or join with an invite code from your team.
            </p>
          </div>
        )}

        <div className="server-grid">
          {ordered.map((s) => (
            <button
              key={s.serverId}
              className={`server-card ${s.isOfficial ? 'server-card--pinned' : ''}`}
              onClick={() => navigate(`/servers/${s.serverId}`)}
            >
              <Avatar name={s.serverName} src={s.serverIcon} size={42} />
              <span className="server-card__info">
                <span className="server-card__name">{s.serverName}</span>
                <span className="server-card__meta">
                  {s.isOfficial && <span className="badge badge--official">Official</span>}
                  {s.role && (
                    <span className={`badge badge--${s.role}`}>
                      {ROLE_LABELS[s.role] || s.role}
                    </span>
                  )}
                </span>
              </span>
              <span className="server-card__go" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </main>

      {modal?.type === 'add' && (
        <AddServerModal
          initialTab={modal.tab}
          onClose={() => setModal(null)}
          onDone={(id) => {
            setModal(null);
            navigate(`/servers/${id}`);
          }}
        />
      )}
      {modal?.type === 'profile' && (
        <ProfileSettingsModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}
