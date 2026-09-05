import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { WaitlistBanner } from '../../components/common/WaitlistBanner';
import { notifyPresetExported } from '../../utils/exportEvents';
import { resetRemoteConfigCache } from '../../utils/remoteConfig';
import { BANNER_SNOOZE_MS } from '../../utils/waitlistState';

describe('WaitlistBanner', () => {
  beforeEach(() => {
    resetRemoteConfigCache();
    (localStorage.getItem as any).mockReturnValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const exportPreset = async () => {
    await act(async () => {
      notifyPresetExported();
    });
  };

  it('stays hidden until a preset has been exported', async () => {
    render(<WaitlistBanner />);

    expect(screen.queryByRole('region', { name: /desktop app/i })).toBeNull();

    await exportPreset();

    expect(screen.getByRole('region', { name: /desktop app/i })).toBeInTheDocument();
  });

  it('shows the email form in waitlist mode', async () => {
    render(<WaitlistBanner />);
    await exportPreset();

    expect(screen.getByPlaceholderText('your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument();
  });

  it('does not show once the user has joined the waitlist', async () => {
    (localStorage.getItem as any).mockImplementation((key: string) =>
      key === 'op_waitlist_joined' ? '2026-01-01T00:00:00.000Z' : null
    );

    render(<WaitlistBanner />);
    await exportPreset();

    expect(screen.queryByRole('region', { name: /desktop app/i })).toBeNull();
  });

  it('does not show again within 14 days of being dismissed', async () => {
    (localStorage.getItem as any).mockImplementation((key: string) =>
      key === 'op_waitlist_banner_dismissed' ? String(Date.now() - 1000) : null
    );

    render(<WaitlistBanner />);
    await exportPreset();

    expect(screen.queryByRole('region', { name: /desktop app/i })).toBeNull();
  });

  it('shows again once the 14 day snooze has elapsed', async () => {
    (localStorage.getItem as any).mockImplementation((key: string) =>
      key === 'op_waitlist_banner_dismissed' ? String(Date.now() - BANNER_SNOOZE_MS - 1000) : null
    );

    render(<WaitlistBanner />);
    await exportPreset();

    expect(screen.getByRole('region', { name: /desktop app/i })).toBeInTheDocument();
  });

  it('offers a download link instead of a form once the desktop app has launched', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mode: 'launched', message: null, proUrl: 'https://example.test/pro' })
    });

    render(<WaitlistBanner />);
    await exportPreset();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /get the desktop app/i })).toHaveAttribute(
        'href',
        'https://example.test/pro'
      );
    });
    expect(screen.queryByPlaceholderText('your email')).toBeNull();
  });
});
