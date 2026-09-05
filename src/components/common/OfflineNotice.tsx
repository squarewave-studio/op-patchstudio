import { useEffect, useState } from 'react';

// This PWA keeps working offline, but anything that needs the network — saving
// feedback, the changelog, the waitlist itself — does not. There is no separate
// offline fallback page, so this stands in for one. It deliberately carries no
// waitlist form or link: both need the network, so offering them here would be
// a dead end.
export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.6rem 1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-light)',
        color: 'var(--color-text-secondary)',
        fontFamily: '"Montserrat", "Arial", sans-serif',
        fontSize: '0.85rem',
        lineHeight: 1.5
      }}
    >
      <i
        className="fas fa-plug"
        aria-hidden="true"
        style={{ marginTop: '0.15rem', color: 'var(--color-text-secondary)' }}
      />
      <div style={{ flex: 1 }}>
        you're offline. editing and export still work, but anything needing the network won't. the
        desktop app works fully offline by design.
      </div>
    </div>
  );
}
