import { useState } from 'react';

// The message input box. Enter sends; Shift+Enter inserts a newline.
export default function MessageComposer({ disabled, placeholder, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setText('');
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      <textarea
        className="composer__input"
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        className="btn btn--primary"
        disabled={disabled || sending || !text.trim()}
        onClick={submit}
      >
        Send
      </button>
    </div>
  );
}
