// A circular avatar that falls back to a colored initial when there's no photo.
const COLORS = [
  '#5865f2', '#3ba55d', '#faa61a', '#ed4245',
  '#eb459e', '#9b59b6', '#1abc9c', '#e67e22',
];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name = '?', src = null, size = 40 }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt={name}
        style={style}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className="avatar avatar--fallback"
      style={{ ...style, backgroundColor: colorFor(name) }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
