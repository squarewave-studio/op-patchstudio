import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import posthog from 'posthog-js';
import { ANALYTICS_EVENTS, capture, initAnalytics, resetAnalytics } from '../../utils/analytics';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    register: vi.fn(),
    capture: vi.fn()
  }
}));

describe('analytics', () => {
  beforeEach(() => {
    resetAnalytics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('without a project key', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_POSTHOG_KEY', '');
    });

    it('does not initialise posthog', () => {
      initAnalytics();
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('silently no-ops on capture', () => {
      initAnalytics();
      expect(() => capture(ANALYTICS_EVENTS.APP_OPENED)).not.toThrow();
      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('with a project key', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    });

    it('initialises cookieless against the EU host', () => {
      initAnalytics();

      expect(posthog.init).toHaveBeenCalledWith('phc_test', {
        api_host: 'https://eu.i.posthog.com',
        persistence: 'memory',
        autocapture: false,
        capture_pageview: true,
        disable_session_recording: true
      });
    });

    it('registers the app identifier on every event', () => {
      initAnalytics();

      expect(posthog.register).toHaveBeenCalledWith(
        expect.objectContaining({ app: 'op-web' })
      );
    });

    it('initialises only once', () => {
      initAnalytics();
      initAnalytics();

      expect(posthog.init).toHaveBeenCalledTimes(1);
    });

    it('forwards captured events and properties', () => {
      initAnalytics();
      capture(ANALYTICS_EVENTS.PRESET_EXPORTED, { mode: 'drum', sampleCount: 3 });

      expect(posthog.capture).toHaveBeenCalledWith('multisample_exported', {
        mode: 'drum',
        sampleCount: 3
      });
    });

    it('swallows errors thrown by posthog', () => {
      initAnalytics();
      (posthog.capture as any).mockImplementationOnce(() => {
        throw new Error('network down');
      });

      expect(() => capture(ANALYTICS_EVENTS.APP_OPENED)).not.toThrow();
    });
  });
});
