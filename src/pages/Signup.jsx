import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { friendlyAuthError } from './Login.jsx';

export default function Signup() {
  const { signup, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (firebaseUser) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const name = username.trim();
    if (name.length < 2) {
      setError('Please choose a username (at least 2 characters).');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await signup({ email: email.trim(), password, username: name });
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <div className="auth-logo" />
          <h1>Create your account</h1>
          <p className="muted">Join your team on Staff Chat</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="nickname"
            placeholder="How your team sees you"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
          />
        </label>

        <button className="btn btn--primary btn--full" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="muted auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
