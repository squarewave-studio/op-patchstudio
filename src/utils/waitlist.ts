// Desktop app waitlist sign-up.
//
// Posts to the squarewave.studio API, which allowlists this app's origin for
// CORS. This is an offline-capable PWA, so a failed post is expected and is
// reported back to the caller rather than thrown, leaving the form free to
// keep whatever the user typed.

export const WAITLIST_URL = 'https://squarewave.studio/api/waitlist';

export const WAITLIST_PRODUCT = 'op-patchstudio';
export const WAITLIST_SOURCE = 'legacy-web-app';

export type WaitlistTrigger =
  | 'post-export-banner'
  | 'recording-modal'
  | 'patch-size-limit'
  | 'offline-page'
  | 'desktop-page';

export const DEVICE_OPTIONS = ['OP-XY', 'OP-1 Field', 'OP-1', 'TP-7', 'other'] as const;

export interface WaitlistSubmission {
  email: string;
  trigger: WaitlistTrigger;
  device?: string;
}

export type WaitlistResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "that didn't go through. please check your connection and try again.";

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function submitWaitlist({ email, trigger, device }: WaitlistSubmission): Promise<WaitlistResult> {
  const trimmedEmail = email.trim();

  if (!isValidEmail(trimmedEmail)) {
    return { ok: false, error: 'please enter a valid email address.' };
  }

  try {
    const response = await fetch(WAITLIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmedEmail,
        product: WAITLIST_PRODUCT,
        source: WAITLIST_SOURCE,
        trigger,
        ...(device ? { device } : {})
      })
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body || body.ok !== true) {
      return { ok: false, error: (body && typeof body.error === 'string' && body.error) || GENERIC_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}
