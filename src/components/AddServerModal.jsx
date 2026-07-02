import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createServer, joinByInviteCode } from '../lib/data.js';

// Two-in-one: create a brand new server, or join an existing one by invite code.
export default function AddServerModal({ onClose, onDone, initialTab = 'join' }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const serverId = await joinByInviteCode(profile, code);
      onDone(serverId);
    } catch (err) {
      setError(err.message || 'Could not join that server.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Give your server a name (at least 2 characters).');
      return;
    }
    setBusy(true);
    try {
      const serverId = await createServer(profile, { name });
      onDone(serverId);
    } catch (err) {
      setError(err.message || 'Could not create the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a server" onClose={onClose}>
      <div className="tabs">
        <button
          className={`tab ${tab === 'join' ? 'is-active' : ''}`}
          onClick={() => setTab('join')}
        >
          Join with a code
        </button>
        <button
          className={`tab ${tab === 'create' ? 'is-active' : ''}`}
          onClick={() => setTab('create')}
        >
          Create new
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {tab === 'join' ? (
        <form onSubmit={handleJoin}>
          <label>
            Invite code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7P2QX"
              autoFocus
              required
            />
          </label>
          <p className="muted small">
            Ask an admin of the server for its invite code.
          </p>
          <button className="btn btn--primary btn--full" disabled={busy}>
            {busy ? 'Joining…' : 'Join server'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreate}>
          <label>
            Server name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp Staff"
              autoFocus
              required
            />
          </label>
          <p className="muted small">
            You&apos;ll be the admin. A <strong>#general</strong> channel and an
            invite code are created automatically.
          </p>
          <button className="btn btn--primary btn--full" disabled={busy}>
            {busy ? 'Creating…' : 'Create server'}
          </button>
        </form>
      )}
    </Modal>
  );
}
