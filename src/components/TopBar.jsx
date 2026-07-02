import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Shared header for full-page views (Home, staff admin). Brand on the left goes
// home; profile + sign out live on the right, always labeled.
export default function TopBar({ subtitle, onOpenProfile }) {
  const { profile, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate('/')} title="Go to your servers">
        <span className="logo-mark" aria-hidden="true" />
        <span className="brand__name">Staff Chat</span>
        {subtitle && <span className="brand__subtitle">{subtitle}</span>}
      </button>

      <div className="topbar__actions">
        {isStaff && (
          <button className="btn btn--soft btn--sm" onClick={() => navigate('/admin')}>
            ★ Staff admin
          </button>
        )}
        <button className="topbar__user" onClick={onOpenProfile} title="Edit your profile">
          <Avatar name={profile?.username} src={profile?.photoURL} size={30} />
          <span>{profile?.username}</span>
        </button>
        <button className="btn btn--ghost btn--sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
