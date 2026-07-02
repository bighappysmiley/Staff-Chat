import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import Avatar from '../components/Avatar.jsx';
import TopBar from '../components/TopBar.jsx';
import ProfileSettingsModal from '../components/ProfileSettingsModal.jsx';
import { OFFICIAL_SERVER_ID } from '../lib/constants.js';

// Staff-only overview of the whole Staff Chat instance. Read-only insights plus
// a shortcut into Official Updates to post product news.
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubServers = onSnapshot(collection(db, 'servers'), (snap) =>
      setServers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubUsers();
      unsubServers();
    };
  }, []);

  const staffCount = users.filter((u) => u.isStaff).length;

  return (
    <div className="page">
      <TopBar subtitle="Staff admin" onOpenProfile={() => setShowProfile(true)} />

      <main className="admin-main">
        <h1>Staff admin</h1>
        <p className="muted">
          A live overview of everyone and everything on Staff Chat.
        </p>

        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-card__num">{users.length}</div>
            <div className="stat-card__label">Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{servers.length}</div>
            <div className="stat-card__label">Servers</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{staffCount}</div>
            <div className="stat-card__label">Staff</div>
          </div>
        </section>

        <p>
          <button
            className="btn btn--primary"
            onClick={() => navigate(`/servers/${OFFICIAL_SERVER_ID}`)}
          >
            📣 Post to Official Updates
          </button>
        </p>

        <div className="admin-columns">
          <section className="admin-panel">
            <h2>Users</h2>
            <div className="admin-list">
              {users.map((u) => (
                <div key={u.id} className="admin-list__row">
                  <Avatar name={u.username} src={u.photoURL} size={32} />
                  <div className="admin-list__main">
                    <div className="admin-list__title">
                      {u.username}
                      {u.isStaff && <span className="staff-tag">staff</span>}
                    </div>
                    <div className="muted small">{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="muted small admin-note">
              Promote a user to staff by setting <code>isStaff: true</code> on
              their <code>users/&#123;uid&#125;</code> doc (Firebase console or
              the <code>make-staff</code> script). It can&apos;t be done from
              the app, by design.
            </p>
          </section>

          <section className="admin-panel">
            <h2>Servers</h2>
            <div className="admin-list">
              {servers.map((s) => (
                <div key={s.id} className="admin-list__row">
                  <Avatar name={s.name} src={s.icon} size={32} />
                  <div className="admin-list__main">
                    <div className="admin-list__title">
                      {s.name}
                      {s.isOfficial && <span className="staff-tag">official</span>}
                    </div>
                    <div className="muted small">Invite: {s.inviteCode}</div>
                  </div>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => navigate(`/servers/${s.id}`)}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
