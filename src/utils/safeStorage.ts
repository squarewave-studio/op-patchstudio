// localStorage can throw in private browsing modes and when storage is full,
// and is absent in some embedded webviews. Every access goes through here so a
// storage failure never breaks a render.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore: the feature using this degrades to "not remembered".
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
