import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesktopPage } from '../../components/common/DesktopPage';
import { resetRemoteConfigCache } from '../../utils/remoteConfig';

describe('DesktopPage', () => {
  beforeEach(() => {
    resetRemoteConfigCache();
    (localStorage.getItem as any).mockReturnValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explains what the desktop app is and the platform order', () => {
    render(<DesktopPage />);

    expect(screen.getByText('the desktop app')).toBeInTheDocument();
    expect(screen.getByText(/macOS and windows first, with linux to follow, then iOS and android/)).toBeInTheDocument();
  });

  it('says which tools stay free and that the web version is legacy', () => {
    render(<DesktopPage />);

    expect(
      screen.getByText(/the multisample editor and the drum tool stay free in the desktop app/)
    ).toBeInTheDocument();
    expect(screen.getByText(/it's now legacy/)).toBeInTheDocument();
  });

  it('embeds the waitlist form', () => {
    render(<DesktopPage />);

    expect(screen.getByPlaceholderText('your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument();
  });

  it('keeps a secondary donate link', () => {
    render(<DesktopPage />);

    expect(screen.getByText('support the project')).toBeInTheDocument();
    expect(screen.getByText('patreon')).toHaveAttribute('href', 'https://www.patreon.com/c/oppatchstudio');
    expect(screen.getByText('buy me a coffee')).toHaveAttribute('href', 'https://buymeacoffee.com/jxavierh');
  });

  it('acknowledges an existing sign-up instead of asking again', () => {
    (localStorage.getItem as any).mockImplementation((key: string) =>
      key === 'op_waitlist_joined' ? '2026-01-01T00:00:00.000Z' : null
    );

    render(<DesktopPage />);

    expect(screen.getByText(/you're already on the waitlist/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('your email')).toBeNull();
  });

  it('offers the download once the desktop app has launched', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mode: 'launched', message: null, proUrl: 'https://example.test/pro' })
    });

    render(<DesktopPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /get the desktop app/i })).toHaveAttribute(
        'href',
        'https://example.test/pro'
      );
    });
    expect(screen.queryByPlaceholderText('your email')).toBeNull();
  });
});
