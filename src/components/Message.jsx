import Avatar from './Avatar.jsx';

export function shortTime(ts) {
  const d = ts?.toDate?.();
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// One chat message. `compact` renders a follow-up from the same author without
// repeating the avatar/name — the time appears in the gutter on hover.
export default function Message({ message, compact, canDelete, onDelete }) {
  const time = shortTime(message.createdAt);

  if (compact) {
    return (
      <div className="msg msg--compact">
        <span className="msg__gutter-time">{time}</span>
        <div className="msg__body">
          <div className="msg__text">{message.text}</div>
        </div>
        {canDelete && (
          <button
            className="msg__delete icon-btn icon-btn--sm"
            title="Delete message"
            aria-label="Delete this message"
            onClick={() => onDelete(message.id)}
          >
            🗑
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="msg">
      <Avatar name={message.authorName} src={message.authorPhoto} size={38} />
      <div className="msg__body">
        <div className="msg__head">
          <span className="msg__author">{message.authorName}</span>
          <span className="msg__time">{time}</span>
        </div>
        <div className="msg__text">{message.text}</div>
      </div>
      {canDelete && (
        <button
          className="msg__delete icon-btn icon-btn--sm"
          title="Delete message"
          onClick={() => onDelete(message.id)}
        >
          🗑
        </button>
      )}
    </div>
  );
}
