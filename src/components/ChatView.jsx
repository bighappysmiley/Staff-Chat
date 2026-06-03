import { useEffect, useRef } from 'react';
import Message from './Message.jsx';
import MessageComposer from './MessageComposer.jsx';
import { useMessages } from '../hooks/useFirestore.js';
import { sendMessage, deleteMessage } from '../lib/data.js';
import { canModerate } from '../lib/constants.js';

export default function ChatView({ server, channel, profile, myRole }) {
  const { messages, loading } = useMessages(server?.id, channel?.id);
  const bottomRef = useRef(null);

  // Keep the view pinned to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!channel) {
    return (
      <main className="chat-view chat-view--empty">
        <p className="muted">Pick a channel to start chatting.</p>
      </main>
    );
  }

  async function handleSend(text) {
    await sendMessage(server.id, channel.id, profile, text);
  }

  async function handleDelete(messageId) {
    await deleteMessage(server.id, channel.id, messageId);
  }

  const canModerateHere = canModerate(myRole);

  return (
    <main className="chat-view">
      <header className="chat-header">
        <span className="channel-hash">#</span>
        <span className="chat-header__name">{channel.name}</span>
      </header>

      <div className="messages">
        {loading && <p className="muted messages__hint">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <div className="messages__welcome">
            <h3>Welcome to #{channel.name}</h3>
            <p className="muted">This is the start of the channel. Say hello!</p>
          </div>
        )}
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            canDelete={canModerateHere || message.authorId === profile.uid}
            onDelete={handleDelete}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        placeholder={`Message #${channel.name}`}
        onSend={handleSend}
      />
    </main>
  );
}
