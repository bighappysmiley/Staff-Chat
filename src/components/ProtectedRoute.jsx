import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Gate for authenticated routes. `requireStaff` additionally restricts to
// BigHappySmiley staff (the admin dashboard).
export default function ProtectedRoute({ children, requireStaff = false }) {
  const { firebaseUser, profile, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="full-center muted">Loading…</div>;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Signed in with Firebase Auth but the Firestore profile hasn't materialized
  // yet (rare race right after signup) — wait rather than bounce them out.
  if (!profile) {
    return <div className="full-center muted">Setting up your account…</div>;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
}
