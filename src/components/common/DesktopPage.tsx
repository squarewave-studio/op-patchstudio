import { useState, useEffect } from 'react';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { ANALYTICS_EVENTS, capture } from '../../utils/analytics';
import { hasJoinedWaitlist } from '../../utils/waitlistState';
import { WaitlistForm } from './WaitlistForm';

const TRIGGER = 'desktop-page' as const;

export function DesktopPage() {
  const config = useRemoteConfig();
  const [isMobile, setIsMobile] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setHasJoined(hasJoinedWaitlist());
    capture(ANALYTICS_EVENTS.UPGRADE_BANNER_SHOWN, { context: TRIGGER, mode: config.mode });
  }, [config.mode]);

  const isLaunched = config.mode === 'launched';

  const panelStyle = {
    background: 'var(--color-bg-primary)',
    borderRadius: '15px',
    boxShadow: '0 2px 8px var(--color-shadow-primary)',
    border: '1px solid var(--color-border-subtle)',
    overflow: 'hidden',
    margin: isMobile ? '0.5rem 0.5rem 1rem 0.5rem' : '2rem 2rem 1rem 2rem'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 1rem 0.5rem 1rem',
    borderBottom: '1px solid var(--color-border-medium)',
    backgroundColor: 'var(--color-bg-secondary)'
  };

  const titleStyle = {
    margin: 0,
    color: '#222',
    fontSize: '1.25rem',
    fontWeight: 300
  };

  const bodyStyle = {
    padding: isMobile ? '1rem' : '2rem'
  };

  const paragraphStyle = {
    color: 'var(--color-text-secondary)',
    fontSize: '1rem',
    lineHeight: 1.6,
    marginTop: 0
  };

  return (
    <>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>the desktop app</h3>
        </div>

        <div style={bodyStyle}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <p style={paragraphStyle}>
              i'm building OP-PatchStudio as a desktop app. it does what this web version does (the
              multisample editor and the drum tool) as a native application, without a browser tab
              between you and your samples.
            </p>

            <p style={paragraphStyle}>
              the multisample editor and the drum tool stay free in the desktop app. this web version
              also stays free and online, but it's now legacy: it no longer receives new features, and
              all my development time goes into the desktop app.
            </p>

            <p style={paragraphStyle}>
              if you've built presets here, you can take them with you. the library tab has an
              "export library" button that produces a file the desktop app imports.
            </p>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '6px'
              }}
            >
              {isLaunched ? (
                <a
                  href={config.proUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => capture(ANALYTICS_EVENTS.PURCHASE_LINK_CLICKED, { source: TRIGGER })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-interactive-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '1rem',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                >
                  get the desktop app
                </a>
              ) : hasJoined ? (
                <p style={{ ...paragraphStyle, margin: 0, fontSize: '0.9rem' }}>
                  you're already on the waitlist. i'll email you when the desktop app is ready.
                </p>
              ) : (
                <>
                  <p style={{ ...paragraphStyle, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    leave your email and i'll let you know when it's ready. i won't use it for anything
                    else.
                  </p>
                  <WaitlistForm trigger={TRIGGER} onSubmitted={() => setHasJoined(true)} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>support the project</h3>
        </div>

        <div style={bodyStyle}>
          <p style={{ ...paragraphStyle, fontSize: '0.9rem', margin: 0 }}>
            this web version is{' '}
            <a
              href="https://github.com/squarewave-studio/op-patchstudio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-interactive-primary)', textDecoration: 'underline' }}
            >
              open source
            </a>{' '}
            and free. if it's been useful, you can support the work on{' '}
            <a
              href="https://www.patreon.com/c/oppatchstudio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-interactive-primary)', textDecoration: 'underline' }}
            >
              patreon
            </a>{' '}
            or{' '}
            <a
              href="https://buymeacoffee.com/jxavierh"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-interactive-primary)', textDecoration: 'underline' }}
            >
              buy me a coffee
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
