import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WAITLIST_URL, isValidEmail, submitWaitlist } from '../../utils/waitlist';

describe('submitWaitlist', () => {
  beforeEach(() => {
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

  it('posts the agreed payload shape', async () => {
    respondWith({ ok: true });

    await submitWaitlist({ email: 'someone@example.com', trigger: 'post-export-banner', device: 'OP-XY' });

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(WAITLIST_URL);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual({
      email: 'someone@example.com',
      product: 'op-patchstudio',
      source: 'legacy-web-app',
      trigger: 'post-export-banner',
      device: 'OP-XY'
    });
  });

  it('omits the device when none was chosen and trims the email', async () => {
    respondWith({ ok: true });

    await submitWaitlist({ email: '  someone@example.com  ', trigger: 'desktop-page' });

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.email).toBe('someone@example.com');
    expect(body).not.toHaveProperty('device');
  });

  it('rejects an invalid email without hitting the network', async () => {
    const result = await submitWaitlist({ email: 'not-an-email', trigger: 'offline-page' });

    expect(result).toEqual({ ok: false, error: 'please enter a valid email address.' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports a failure when the request throws', async () => {
    (global.fetch as any).mockRejectedValue(new Error('offline'));

    const result = await submitWaitlist({ email: 'someone@example.com', trigger: 'recording-modal' });

    expect(result.ok).toBe(false);
  });

  it('surfaces the error the API returns', async () => {
    respondWith({ ok: false, error: 'already signed up' }, true);

    const result = await submitWaitlist({ email: 'someone@example.com', trigger: 'patch-size-limit' });

    expect(result).toEqual({ ok: false, error: 'already signed up' });
  });

  it('reports a failure on a non-ok response with an unreadable body', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('not json'))
    });

    const result = await submitWaitlist({ email: 'someone@example.com', trigger: 'desktop-page' });

    expect(result.ok).toBe(false);
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.co', ' someone@example.com '])('accepts %s', email => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['', 'someone', 'someone@', '@example.com', 'some one@example.com'])('rejects %s', email => {
    expect(isValidEmail(email)).toBe(false);
  });
});
