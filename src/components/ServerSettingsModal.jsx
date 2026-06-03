import { useState } from 'react';
import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import { useMembers, useChannels } from '../hooks/useFirestore.js';
import {
  updateServerMeta,
  updateMemberRole,
  removeMember,
  deleteChannel,
  generateInviteCode,
} from '../lib/data.js';
import { resizeImageToDataUrl } from '../lib/image.js';
import { ROLES, ROLE_ORDER, ROLE_LABELS } from '../lib/constants.js';

// Admin-only server management: rename + icon + invite code, member roles, and
// channel cleanup.
export default function ServerSettingsModal({ server, currentUid, onClose }) {
  const [tab, setTab] = useState('general');
  const members = useMembers(server.id);
  const { channels } = useChannels(server.id);

  return (
    <Modal title={`${server.name} — settings`} onClose={onClose}>
      <div className="tabs">
        <button className={`tab ${tab === 'general' ? 'is-active' : ''}`} onClick={() => setTab('general')}>
          General
        </button>
        <button className={`tab ${tab === 'members' ? 'is-active' : ''}`} onClick={() => setTab('members')}>
          Members
        </button>
        <button className={`tab ${tab === 'channels' ? 'is-active' : ''}`} onClick={() => setTab('channels')}>
          Channels
        </button>
      </div>

      {tab === 'general' && <GeneralTab server={server} />}
      {tab === 'members' && (
        <MembersTab server={server} members={members} currentUid={currentUid} />
      )}
      {tab === 'channels' && <ChannelsTab server={server} channels={channels} />}
    </Modal>
  );
}

function GeneralTab({ server }) {
  const [name, setName] = useState(server.name);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function saveName() {
    setBusy(true);
    try {
      await updateServerMeta(server.id, { name: name.trim() });
      setStatus('Saved.');
    } finally {
      setBusy(false);
    }
  }

  async function onIconChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await updateServerMeta(server.id, { icon: dataUrl });
      setStatus('Icon updated.');
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCode() {
    setBusy(true);
    try {
      await updateServerMeta(server.id, { inviteCode: generateInviteCode() });
      setStatus('New invite code generated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-pane">
      <label>
        Server name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="settings-row">
        <Avatar name={server.name} src={server.icon} size={48} />
        <label className="btn btn--ghost file-btn">
          Change icon
          <input type="file" accept="image/*" onChange={onIconChange} hidden />
        </label>
      </div>

      <div className="invite-box">
        <div>
          <div className="muted small">Invite code</div>
          <div className="invite-code">{server.inviteCode}</div>
        </div>
        <div className="invite-actions">
          <button
            className="btn btn--ghost"
            onClick={() => navigator.clipboard?.writeText(server.inviteCode)}
          >
            Copy
          </button>
          <button className="btn btn--ghost" onClick={regenerateCode} disabled={busy}>
            Regenerate
          </button>
        </div>
      </div>

      <button className="btn btn--primary" onClick={saveName} disabled={busy}>
        Save changes
      </button>
      {status && <span className="muted small settings-status">{status}</span>}
    </div>
  );
}

function MembersTab({ server, members, currentUid }) {
  const sorted = [...members].sort((a, b) =>
    (a.username || '').localeCompare(b.username || '')
  );

  return (
    <div className="settings-pane">
      {sorted.map((m) => {
        const isOwner = m.uid === server.ownerId;
        const isSelf = m.uid === currentUid;
        return (
          <div key={m.uid} className="member-manage-row">
            <Avatar name={m.username} src={m.photoURL} size={32} />
            <span className="member-manage-row__name">
              {m.username}
              {isOwner && <span className="owner-tag">owner</span>}
            </span>
            <select
              value={m.role}
              disabled={isOwner}
              onChange={(e) => updateMemberRole(server.id, m.uid, e.target.value)}
            >
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <button
              className="icon-btn icon-btn--sm"
              title="Remove from server"
              disabled={isOwner || isSelf}
              onClick={() => {
                if (window.confirm(`Remove ${m.username} from ${server.name}?`)) {
                  removeMember(server.id, m.uid);
                }
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ChannelsTab({ server, channels }) {
  return (
    <div className="settings-pane">
      {channels.map((c) => (
        <div key={c.id} className="channel-manage-row">
          <span>
            <span className="channel-hash">#</span> {c.name}
          </span>
          <button
            className="icon-btn icon-btn--sm"
            title="Delete channel"
            disabled={channels.length <= 1}
            onClick={() => {
              if (window.confirm(`Delete #${c.name}? Messages will be lost.`)) {
                deleteChannel(server.id, c.id);
              }
            }}
          >
            🗑
          </button>
        </div>
      ))}
      {channels.length <= 1 && (
        <p className="muted small">A server must keep at least one channel.</p>
      )}
    </div>
  );
}
