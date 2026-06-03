// Shown when Firebase env vars are missing, so the first-run experience is a
// helpful checklist instead of a blank screen.
export default function SetupNotice() {
  return (
    <div className="full-center">
      <div className="setup-card">
        <h1>Staff Chat — almost there</h1>
        <p className="muted">
          Firebase isn&apos;t configured yet. Create a <code>.env</code> file in
          the project root (copy <code>.env.example</code>) and fill in your
          Firebase web config.
        </p>
        <ol>
          <li>
            Create a project at{' '}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              console.firebase.google.com
            </a>
          </li>
          <li>Enable <strong>Authentication → Email/Password</strong></li>
          <li>Create a <strong>Firestore</strong> database</li>
          <li>Add a <strong>Web app</strong> and copy its config into <code>.env</code></li>
          <li>Restart the dev server (<code>npm run dev</code>)</li>
        </ol>
        <p className="muted">
          Full instructions are in <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}
