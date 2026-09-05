import { useEffect, useState } from 'react';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { ANALYTICS_EVENTS, capture } from '../../utils/analytics';
import { onPresetExported } from '../../utils/exportEvents';
import { hasJoinedWaitlist, isBannerSnoozed, snoozeBanner } from '../../utils/waitlistState';
import { WaitlistForm } from './WaitlistForm';

const TRIGGER = 'post-export-banner' as const;

// Shown once a preset has actually been exported, so the pitch lands after the
// tool has done its job rather than before.
export function WaitlistBanner() {
  const config = useRemoteConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadedIn, setIsFadedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return onPresetExported(() => {
      // Having joined the waitlist only suppresses the waitlist pitch; the
      // launched-mode banner is news those same people asked for.
      if (config.mode === 'waitlist' && hasJoinedWaitlist()) return;
      if (isBannerSnoozed(config.mode)) return;
      setIsVisible(true);
    });
  }, [config.mode]);

  useEffect(() => {
    if (!isVisible) return;

    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_SHOWN, { context: TRIGGER, mode: config.mode });
    const timer = window.setTimeout(() => setIsFadedIn(true), 10);
    return () => window.clearTimeout(timer);
  }, [isVisible, config.mode]);

  const close = () => {
    setIsFadedIn(false);
    window.setTimeout(() => setIsVisible(false), 200);
  };

  const handleDismiss = () => {
    snoozeBanner(config.mode);
    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_DISMISSED, { context: TRIGGER });
    close();
  };

  const handleDownloadClick = () => {
    capture(ANALYTICS_EVENTS.PURCHASE_LINK_CLICKED, { source: TRIGGER });
  };

  if (!isVisible) return null;

  const isLaunched = config.mode === 'launched';

  return (
    <div
      role="region"
      aria-label="OP-PatchStudio desktop app"
      style={{
        position: 'fixed',
        bottom: isMobile ? '10px' : '20px',
        right: isMobile ? '10px' : '20px',
        left: isMobile ? '10px' : 'auto',
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-light)',
        borderRadius: '6px',
        padding: isMobile ? '12px' : '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxWidth: isMobile ? 'none' : '420px',
        color: 'var(--color-text-primary)',
        opacity: isFadedIn ? 1 : 0,
        transform: isFadedIn ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        fontFamily: '"Montserrat", "Arial", sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <strong
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '0.95rem',
              fontWeight: '500',
              color: 'var(--color-text-primary)'
            }}
          >
            {isLaunched ? 'the desktop app is out' : 'preset exported'}
          </strong>
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.4
            }}
          >
            {isLaunched
              ? "this web version is legacy. the OP-PatchStudio desktop app is where new features land, and it's available now."
              : "this web version is legacy, so it stays as it is. i'm building the OP-PatchStudio desktop app — macOS and windows first, linux to follow, then iOS and android. leave your email and i'll let you know when it's ready."}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="dismiss"
          style={{
            border: 'none',
            background: 'none',
            padding: '0 0.25rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.9rem'
          }}
        >
          <i className="fas fa-times" aria-hidden="true" />
        </button>
      </div>

      {isLaunched ? (
        <a
          href={config.proUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '3px',
            backgroundColor: 'var(--color-interactive-focus)',
            color: 'var(--color-white)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            minHeight: '44px',
            boxSizing: 'border-box'
          }}
        >
          get the desktop app
        </a>
      ) : (
        <WaitlistForm trigger={TRIGGER} onSubmitted={() => window.setTimeout(close, 4000)} />
      )}
    </div>
  );
}
