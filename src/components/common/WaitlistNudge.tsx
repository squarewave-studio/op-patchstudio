import { useEffect, useState } from 'react';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { ANALYTICS_EVENTS, capture } from '../../utils/analytics';
import { type WaitlistTrigger } from '../../utils/waitlist';
import { hasJoinedWaitlist } from '../../utils/waitlistState';
import { WaitlistForm } from './WaitlistForm';

interface WaitlistNudgeProps {
  trigger: WaitlistTrigger;
  text: string;
  style?: React.CSSProperties;
}

// A single line at a point where the web version genuinely falls short. It
// expands the waitlist form in place rather than navigating away, and goes
// away with whatever is showing it — there is no separate dismiss.
export function WaitlistNudge({ trigger, text, style }: WaitlistNudgeProps) {
  const config = useRemoteConfig();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    if (hasJoinedWaitlist()) return;

    setIsHidden(false);
    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_SHOWN, { context: trigger, mode: config.mode });
  }, [trigger, config.mode]);

  if (isHidden) return null;

  const isLaunched = config.mode === 'launched';

  const handleOpen = () => {
    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_CLICKED, { context: trigger });
    setIsFormOpen(true);
  };

  const handleDownloadClick = () => {
    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_CLICKED, { context: trigger });
    capture(ANALYTICS_EVENTS.PURCHASE_LINK_CLICKED, { source: trigger });
  };

  const linkStyle = {
    border: 'none',
    background: 'none',
    padding: 0,
    color: 'var(--color-text-primary)',
    textDecoration: 'underline',
    cursor: 'pointer',
    font: 'inherit'
  };

  return (
    <div
      style={{
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.5,
        ...style
      }}
    >
      <span>
        {text}{' '}
        {isLaunched ? (
          <a
            href={config.proUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            style={{ color: 'var(--color-text-primary)', textDecoration: 'underline' }}
          >
            get the desktop app
          </a>
        ) : (
          !isFormOpen && (
            <button type="button" onClick={handleOpen} style={linkStyle}>
              join the waitlist
            </button>
          )
        )}
      </span>

      {isFormOpen && !isLaunched && (
        <div style={{ marginTop: '0.5rem' }}>
          <WaitlistForm trigger={trigger} showDeviceSelect={false} />
        </div>
      )}
    </div>
  );
}
