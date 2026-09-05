import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitlistNudge } from '../../components/common/WaitlistNudge';
import { resetRemoteConfigCache } from '../../utils/remoteConfig';

describe('WaitlistNudge', () => {
  beforeEach(() => {
    resetRemoteConfigCache();
    (localStorage.getItem as any).mockReturnValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a single line with a waitlist link and no form until asked', () => {
    render(<WaitlistNudge trigger="recording-modal" text="recording is limited here." />);

    expect(screen.getByText(/recording is limited here/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('your email')).toBeNull();
  });

  it('opens the embedded form in place when the link is used', async () => {
    render(<WaitlistNudge trigger="patch-size-limit" text="this set is large." />);

    await userEvent.click(screen.getByRole('button', { name: /join the waitlist/i }));

    expect(screen.getByPlaceholderText('your email')).toBeInTheDocument();
  });

  it('stays out of the way once the user has joined the waitlist', () => {
    (localStorage.getItem as any).mockImplementation((key: string) =>
      key === 'op_waitlist_joined' ? '2026-01-01T00:00:00.000Z' : null
    );

    render(<WaitlistNudge trigger="offline-page" text="you're offline." />);

    expect(screen.queryByText(/you're offline/)).toBeNull();
  });

  it('links to the download once the desktop app has launched', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mode: 'launched', message: null, proUrl: 'https://example.test/pro' })
    });

    render(<WaitlistNudge trigger="recording-modal" text="recording is limited here." />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /get the desktop app/i })).toHaveAttribute(
        'href',
        'https://example.test/pro'
      );
    });
    expect(screen.queryByRole('button', { name: /join the waitlist/i })).toBeNull();
  });
});
