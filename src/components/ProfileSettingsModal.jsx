import { useState } from 'react';
import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { updateUserProfile, uploadAvatar } from '../lib/data.js';

// Lightweight profile editing — username and avatar only, by design.
export default function ProfileSettingsModal({ onClose }) {
  const { profile } = useAuth();
  const [username, setUsername] = useState(profile.username || '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function saveUsername() {
    if (username.trim().length < 2) {
      setStatus('Username must be at least 2 characters.');
      return;
    }
    setBusy(true);
    try {
      await updateUserProfile(profile.uid, { username: username.trim() });
      setStatus('Saved.');
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      const url = await uploadAvatar(profile.uid, file);
      await updateUserProfile(profile.uid, { photoURL: url });
      setStatus('Photo updated.');
    } catch (err) {
      setStatus(err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Your profile" onClose={onClose}>
      <div className="settings-pane">
        <div className="settings-row">
          <Avatar name={username} src={profile.photoURL} size={64} />
          <label className="btn btn--ghost file-btn">
            Change photo
            <input type="file" accept="image/*" onChange={onAvatarChange} hidden />
          </label>
        </div>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <label>
          Email
          <input value={profile.email} disabled />
        </label>

        <button className="btn btn--primary" onClick={saveUsername} disabled={busy}>
          Save changes
        </button>
        {status && <span className="muted small settings-status">{status}</span>}
      </div>
    </Modal>
  );
}
