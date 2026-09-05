// localStorage can throw in private browsing modes and when storage is full,
// and is absent in some embedded webviews. Every access goes through here so a
// storage failure never breaks a render.
//
// Writes are mirrored into an in-memory map, so when localStorage rejects the
// write (private browsing) the value still holds for the current session —
// e.g. the waitlist banner will not re-appear on every export after the user
// has just submitted or dismissed it.

const memoryFallback = new Map<string, string>();

export function readStorage(key: string): string | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) {
      return stored;
    }
  } catch {
    // Fall through to the in-memory copy.
  }
  return memoryFallback.get(key) ?? null;
}

export function writeStorage(key: string, value: string): void {
  memoryFallback.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore: the in-memory copy above covers the current session.
  }
}

export function removeStorage(key: string): void {
  memoryFallback.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
