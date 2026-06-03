import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';

// The far-left vertical strip of server icons (Discord-style). Official Updates
// is pinned to the top, then the user's other servers, then the "+" button.
export default function ServerRail({
  servers,
  currentServerId,
  isStaff,
  onAddServer,
  onOpenAdmin,
}) {
  const navigate = useNavigate();

  const official = servers.find((s) => s.isOfficial);
  const others = servers.filter((s) => !s.isOfficial);

  function ServerIcon({ server }) {
    const active = server.serverId === currentServerId;
    return (
      <button
        className={`rail-icon ${active ? 'is-active' : ''}`}
        title={server.serverName}
        onClick={() => navigate(`/servers/${server.serverId}`)}
      >
        <Avatar name={server.serverName} src={server.serverIcon} size={48} />
      </button>
    );
  }

  return (
    <nav className="server-rail" aria-label="Servers">
      {official && <ServerIcon server={official} />}
      {official && <div className="rail-divider" />}

      <div className="rail-scroll">
        {others.map((server) => (
          <ServerIcon key={server.serverId} server={server} />
        ))}
      </div>

      <button
        className="rail-icon rail-icon--action"
        title="Add a server"
        onClick={onAddServer}
      >
        +
      </button>

      {isStaff && (
        <button
          className="rail-icon rail-icon--action rail-icon--staff"
          title="Staff admin dashboard"
          onClick={onOpenAdmin}
        >
          ★
        </button>
      )}
    </nav>
  );
}
