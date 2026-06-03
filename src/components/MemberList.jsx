import Avatar from './Avatar.jsx';
import { ROLE_ORDER, ROLE_LABELS } from '../lib/constants.js';

// Right-hand column listing members grouped by role.
export default function MemberList({ members }) {
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    people: members
      .filter((m) => m.role === role)
      .sort((a, b) => (a.username || '').localeCompare(b.username || '')),
  })).filter((g) => g.people.length > 0);

  return (
    <aside className="member-list" aria-label="Members">
      {grouped.map(({ role, people }) => (
        <div key={role} className="member-group">
          <div className="member-group__heading">
            {ROLE_LABELS[role]} — {people.length}
          </div>
          {people.map((m) => (
            <div key={m.uid} className="member-row">
              <Avatar name={m.username} src={m.photoURL} size={28} />
              <span className="member-row__name">{m.username}</span>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
