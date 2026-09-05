import { readStorage, writeStorage } from './safeStorage';

// Local record of where the user has got to with the desktop app waitlist, so
// prompts are not repeated at someone who has already signed up or said no.

const JOINED_KEY = 'op_waitlist_joined';
const BANNER_DISMISSED_KEY = 'op_waitlist_banner_dismissed';

export const BANNER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export function hasJoinedWaitlist(): boolean {
  return readStorage(JOINED_KEY) !== null;
}

export function markJoinedWaitlist(): void {
  writeStorage(JOINED_KEY, new Date().toISOString());
}

export function isBannerSnoozed(now: number = Date.now()): boolean {
  const dismissedAt = Number(readStorage(BANNER_DISMISSED_KEY));

  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) {
    return false;
  }

  return now - dismissedAt < BANNER_SNOOZE_MS;
}

export function snoozeBanner(now: number = Date.now()): void {
  writeStorage(BANNER_DISMISSED_KEY, String(now));
}
