import { useState, type FormEvent } from 'react';
import { ANALYTICS_EVENTS, capture } from '../../utils/analytics';
import { DEVICE_OPTIONS, submitWaitlist, type WaitlistTrigger } from '../../utils/waitlist';
import { markJoinedWaitlist } from '../../utils/waitlistState';

interface WaitlistFormProps {
  trigger: WaitlistTrigger;
  showDeviceSelect?: boolean;
  successMessage?: string;
  onSubmitted?: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputStyle = {
  flex: '1 1 12rem',
  minWidth: 0,
  padding: '0.5rem 0.6rem',
  border: '1px solid var(--color-border-medium)',
  borderRadius: '3px',
  backgroundColor: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  minHeight: '44px',
  boxSizing: 'border-box' as const
};

export function WaitlistForm({
  trigger,
  showDeviceSelect = true,
  successMessage = "thanks, you're on the list. i'll email you when the desktop app is ready.",
  onSubmitted
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [device, setDevice] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setError('');

    const result = await submitWaitlist({ email, trigger, device: device || undefined });

    if (result.ok) {
      markJoinedWaitlist();
      capture(ANALYTICS_EVENTS.WAITLIST_SUBMITTED, { trigger, device: device || null });
      setStatus('success');
      onSubmitted?.();
      return;
    }

    // The input is deliberately left as the user typed it so a failed send —
    // likely offline, in a PWA — costs them nothing to retry.
    capture(ANALYTICS_EVENTS.WAITLIST_SUBMIT_FAILED, { trigger, reason: result.error });
    setError(result.error);
    setStatus('error');
  };

  if (status === 'success') {
    return (
      <p
        role="status"
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5
        }}
      >
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'stretch' }}>
        <label htmlFor={`waitlist-email-${trigger}`} style={{ position: 'absolute', left: '-9999px' }}>
          email address
        </label>
        <input
          id={`waitlist-email-${trigger}`}
          type="email"
          required
          autoComplete="email"
          placeholder="your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          style={inputStyle}
        />

        {showDeviceSelect && (
          <>
            <label htmlFor={`waitlist-device-${trigger}`} style={{ position: 'absolute', left: '-9999px' }}>
              your device (optional)
            </label>
            <select
              id={`waitlist-device-${trigger}`}
              value={device}
              onChange={e => setDevice(e.target.value)}
              disabled={status === 'submitting'}
              style={{ ...inputStyle, flex: '0 1 10rem' }}
            >
              <option value="">device (optional)</option>
              {DEVICE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            flex: '0 0 auto',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: 'var(--color-interactive-focus)',
            color: 'var(--color-white)',
            fontSize: '0.875rem',
            fontWeight: '500',
            fontFamily: 'inherit',
            cursor: status === 'submitting' ? 'default' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
            minHeight: '44px'
          }}
        >
          {status === 'submitting' ? 'sending...' : 'join the waitlist'}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)'
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
