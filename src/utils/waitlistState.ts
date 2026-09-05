import { type OpWebMode } from './remoteConfig';
import { readStorage, writeStorage } from './safeStorage';

// Local record of where the user has got to with the desktop app waitlist, so
// prompts are not repeated at someone who has already signed up or said no.
//
// Dismissals are keyed by the remote-config mode: the launch is a new
// announcement, so a banner dismissed (or a waitlist joined) during the
// waitlist period must not suppress the launched-mode banner — the people who
// joined the waitlist are exactly the ones who asked to hear about the launch.

const JOINED_KEY = 'op_waitlist_joined';

const BANNER_DISMISSED_KEYS: Record<OpWebMode, string> = {
  waitlist: 'op_waitlist_banner_dismissed',
  launched: 'op_launched_banner_dismissed'
};

export const BANNER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export function hasJoinedWaitlist(): boolean {
  return readStorage(JOINED_KEY) !== null;
}

export function markJoinedWaitlist(): void {
  writeStorage(JOINED_KEY, new Date().toISOString());
}

export function isBannerSnoozed(mode: OpWebMode, now: number = Date.now()): boolean {
  const dismissedAt = Number(readStorage(BANNER_DISMISSED_KEYS[mode]));

  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) {
    return false;
  }

  return now - dismissedAt < BANNER_SNOOZE_MS;
}

export function snoozeBanner(mode: OpWebMode, now: number = Date.now()): void {
  writeStorage(BANNER_DISMISSED_KEYS[mode], String(now));
}
