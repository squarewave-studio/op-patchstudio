import { useEffect, useState } from 'react';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { readStorage, writeStorage } from '../../utils/safeStorage';

// Keyed by mode: dismissing the legacy notice must not hide the launch notice.
const DISMISSED_KEYS = {
  waitlist: 'op_legacy_notice_dismissed',
  launched: 'op_launched_notice_dismissed'
} as const;

export const LEGACY_NOTICE_TEXT =
  "this web version is now legacy and no longer receives new features. i'm putting all new development into the OP-PatchStudio desktop app — macOS and windows first, linux to follow, then iOS and android.";

export const LAUNCHED_NOTICE_TEXT =
  'the OP-PatchStudio desktop app is available now. this web version stays online but no longer receives new features.';

export function LegacyNoticeBar() {
  const config = useRemoteConfig();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setIsDismissed(readStorage(DISMISSED_KEYS[config.mode]) !== null);
  }, [config.mode]);

  const handleDismiss = () => {
    setIsDismissed(true);
    writeStorage(DISMISSED_KEYS[config.mode], new Date().toISOString());
  };

  if (isDismissed) {
    return null;
  }

  const isLaunched = config.mode === 'launched';
  const text = config.message ?? (isLaunched ? LAUNCHED_NOTICE_TEXT : LEGACY_NOTICE_TEXT);
  const linkHref = isLaunched ? config.proUrl : 'https://squarewave.studio/op-patchstudio';
  const linkLabel = isLaunched ? 'get the desktop app' : 'read more';

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
        className="fas fa-info-circle"
        aria-hidden="true"
        style={{ marginTop: '0.15rem', color: 'var(--color-text-secondary)' }}
      />
      <span style={{ flex: 1 }}>
        {text}{' '}
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-text-primary)', textDecoration: 'underline' }}
        >
          {linkLabel}
        </a>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="dismiss legacy notice"
        style={{
          border: 'none',
          background: 'none',
          padding: '0 0.25rem',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        <i className="fas fa-times" aria-hidden="true" />
      </button>
    </div>
  );
}
