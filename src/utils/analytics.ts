import posthog from 'posthog-js';

// Cookieless product analytics.
//
// PostHog runs with in-memory persistence, so nothing is written to cookies or
// localStorage and no consent banner is required. The project key comes from
// the build environment; without it every call here is a silent no-op, which
// keeps local development and forks free of analytics.

const POSTHOG_HOST = 'https://eu.i.posthog.com';

// Event names are shared with the EP-PatchStudio desktop app where an
// equivalent action exists, so both products can be analysed together. The
// `app` super property separates them.
export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  PAGE_VIEWED: 'page_viewed',
  SAMPLE_IMPORTED: 'sample_imported',
  PRESET_EXPORTED: 'multisample_exported',
  SAMPLES_EXPORTED: 'samples_exported',
  UPGRADE_BANNER_SHOWN: 'upgrade_banner_shown',
  UPGRADE_BANNER_CLICKED: 'upgrade_banner_clicked',
  UPGRADE_BANNER_DISMISSED: 'upgrade_banner_dismissed',
  WAITLIST_SUBMITTED: 'waitlist_submitted',
  WAITLIST_SUBMIT_FAILED: 'waitlist_submit_failed',
  PURCHASE_LINK_CLICKED: 'purchase_link_clicked'
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

let isEnabled = false;

export function initAnalytics(): void {
  if (isEnabled) return;

  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  if (!apiKey) return;

  try {
    posthog.init(apiKey, {
      api_host: POSTHOG_HOST,
      persistence: 'memory',
      autocapture: false,
      capture_pageview: true,
      disable_session_recording: true
    });

    posthog.register({
      app: 'op-web',
      $app_version: __APP_VERSION__
    });

    isEnabled = true;
  } catch {
    // Analytics must never break the app.
    isEnabled = false;
  }
}

export function capture(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (!isEnabled) return;

  try {
    posthog.capture(event, properties);
  } catch {
    // Ignore.
  }
}

// Test-only escape hatch for the init guard.
export function resetAnalytics(): void {
  isEnabled = false;
}
