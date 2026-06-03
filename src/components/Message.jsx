import Avatar from './Avatar.jsx';

function formatTime(ts) {
  if (!ts?.toDate) return '';
  const date = ts.toDate();
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today at ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
}

export default function Message({ message, canDelete, onDelete }) {
  return (
    <div className="message">
      <Avatar name={message.authorName} src={message.authorPhoto} size={40} />
      <div className="message__body">
        <div className="message__meta">
          <span className="message__author">{message.authorName}</span>
          <span className="message__time">{formatTime(message.createdAt)}</span>
        </div>
        <div className="message__text">{message.text}</div>
      </div>
      {canDelete && (
        <button
          className="message__delete icon-btn icon-btn--sm"
          title="Delete message"
          onClick={() => onDelete(message.id)}
        >
          🗑
        </button>
      )}
    </div>
  );
}
