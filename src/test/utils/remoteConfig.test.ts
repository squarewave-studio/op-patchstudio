import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CONFIG_URL,
  DEFAULT_CONFIG,
  fetchRemoteConfig,
  resetRemoteConfigCache
} from '../../utils/remoteConfig';

describe('fetchRemoteConfig', () => {
  beforeEach(() => {
    resetRemoteConfigCache();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const respondWith = (body: unknown, ok = true) => {
    (global.fetch as any).mockResolvedValue({
      ok,
      json: () => Promise.resolve(body)
    });
  };

  it('requests the config with no-store and a cache-busting version param', async () => {
    respondWith({ mode: 'waitlist', message: null, proUrl: 'https://example.test/pro' });

    await fetchRemoteConfig();

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toMatch(new RegExp(`^${CONFIG_URL}\\?v=\\d+$`));
    expect(options).toEqual({ cache: 'no-store' });
  });

  it('returns the launched config when the server reports it', async () => {
    respondWith({ mode: 'launched', message: 'out now', proUrl: 'https://example.test/pro' });

    await expect(fetchRemoteConfig()).resolves.toEqual({
      mode: 'launched',
      message: 'out now',
      proUrl: 'https://example.test/pro'
    });
  });

  it('falls back to defaults for unknown modes and missing fields', async () => {
    respondWith({ mode: 'something-else', message: '' });

    await expect(fetchRemoteConfig()).resolves.toEqual(DEFAULT_CONFIG);
  });

  it('falls back to defaults when the request fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('offline'));

    await expect(fetchRemoteConfig()).resolves.toEqual(DEFAULT_CONFIG);
  });

  it('falls back to defaults on a non-ok response', async () => {
    respondWith({ mode: 'launched' }, false);

    await expect(fetchRemoteConfig()).resolves.toEqual(DEFAULT_CONFIG);
  });

  it('fetches at most once per session', async () => {
    respondWith({ mode: 'waitlist', message: null, proUrl: DEFAULT_CONFIG.proUrl });

    await fetchRemoteConfig();
    await fetchRemoteConfig();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
