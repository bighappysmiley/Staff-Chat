import { useState } from 'react';
import Modal from './Modal.jsx';
import { createChannel } from '../lib/data.js';

export default function CreateChannelModal({ serverId, nextPosition, onClose, onDone }) {
  const [name, setName] = useState('');
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (name.trim().length < 1) {
      setError('Channel needs a name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const channelId = await createChannel(serverId, name, nextPosition, announcementOnly);
      onDone(channelId);
    } catch (err) {
      setError(err.message || 'Could not create channel.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create channel" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Channel name
          <div className="input-with-prefix">
            <span>#</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              autoFocus
              required
            />
          </div>
        </label>
        <p className="muted small">Spaces become dashes, e.g. “Team Updates” → team-updates.</p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={announcementOnly}
            onChange={(e) => setAnnouncementOnly(e.target.checked)}
          />
          <span>Announcement only — only admins &amp; moderators can post</span>
        </label>
        <button className="btn btn--primary btn--full" disabled={busy}>
          {busy ? 'Creating…' : 'Create channel'}
        </button>
      </form>
    </Modal>
  );
}
