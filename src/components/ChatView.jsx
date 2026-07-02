import { useEffect, useRef } from 'react';
import Message from './Message.jsx';
import MessageComposer from './MessageComposer.jsx';
import { useMessages } from '../hooks/useFirestore.js';
import { sendMessage, deleteMessage } from '../lib/data.js';

function dayLabel(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Build a render list with day dividers, and mark messages that continue the
// same author's run (within 5 min) so they render compactly.
function buildRows(messages) {
  const rows = [];
  let prev = null;
  for (const m of messages) {
    const d = m.createdAt?.toDate?.() || null;
    const prevD = prev?.createdAt?.toDate?.() || null;
    const day = d ? d.toDateString() : null;
    const prevDay = prevD ? prevD.toDateString() : null;

    if (d && day !== prevDay) {
      rows.push({ type: 'divider', id: `day-${day}`, label: dayLabel(d) });
    }
    const compact =
      prev &&
      prev.authorId === m.authorId &&
      d &&
      prevD &&
      day === prevDay &&
      d - prevD < 5 * 60 * 1000;

    rows.push({ type: 'msg', msg: m, compact: Boolean(compact) });
    prev = m;
  }
  return rows;
}

export default function ChatView({
  server,
  channel,
  profile,
  canPost,
  canModerateHere,
  isMemberHere,
  isStaff,
  permissionsLoading,
  onOpenMenu,
}) {
  const { messages, loading } = useMessages(server?.id, channel?.id);
  const bottomRef = useRef(null);

  // Keep the view pinned to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(text) {
    await sendMessage(server.id, channel.id, profile, text);
  }

  async function handleDelete(messageId) {
    if (!window.confirm('Delete this message?')) return;
    await deleteMessage(server.id, channel.id, messageId);
  }

  if (!channel) {
    return (
      <main className="chat">
        <header className="chat-header">
          <button
            className="icon-btn chat-header__menu"
            onClick={onOpenMenu}
            aria-label="Open channels menu"
          >
            ☰
          </button>
          <span className="chat-header__name">No channel selected</span>
        </header>
        <div className="chat--empty">
          <p className="muted">Pick a channel from the menu to start chatting.</p>
        </div>
      </main>
    );
  }

  const rows = buildRows(messages);

  let lockedText = null;
  if (!canPost) {
    lockedText =
      !isMemberHere && isStaff
        ? "You're viewing as Staff Chat staff — join this server to post."
        : `Only admins and moderators can post in #${channel.name}.`;
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <button
          className="icon-btn chat-header__menu"
          onClick={onOpenMenu}
          aria-label="Open channels menu"
        >
          ☰
        </button>
        <span className="chat-header__hash" aria-hidden="true">#</span>
        <span className="chat-header__name">{channel.name}</span>
        {channel.announcementOnly && (
          <span className="lock-badge" title="Only admins and moderators can post here">
            🔒 Announcements
          </span>
        )}
      </header>

      <div className="messages">
        {loading && <p className="muted messages__hint">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <div className="messages__welcome">
            <h3>Welcome to #{channel.name} 👋</h3>
            <p className="muted">
              {canPost
                ? 'This is the very beginning of the channel. Say hello!'
                : 'Nothing has been posted here yet.'}
            </p>
          </div>
        )}

        {rows.map((row) =>
          row.type === 'divider' ? (
            <div key={row.id} className="day-divider">{row.label}</div>
          ) : (
            <Message
              key={row.msg.id}
              message={row.msg}
              compact={row.compact}
              canDelete={canModerateHere || row.msg.authorId === profile.uid}
              onDelete={handleDelete}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {permissionsLoading ? null : canPost ? (
        <MessageComposer
          placeholder={`Message #${channel.name}  (Enter to send)`}
          onSend={handleSend}
        />
      ) : (
        <div className="composer-locked">🔒 {lockedText}</div>
      )}
    </main>
  );
}
