import { useLayoutEffect, useRef, useState } from 'react';

// The message input box. Enter sends; Shift+Enter inserts a newline. The
// textarea grows to fit multi-line messages up to the CSS max-height, then
// scrolls internally.
export default function MessageComposer({ disabled, placeholder, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

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
        ref={textareaRef}
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
