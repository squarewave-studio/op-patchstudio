// Remote configuration for the legacy web app.
//
// The desktop app (OP-PatchStudio Pro) is announced from a small JSON file on
// squarewave.studio so the messaging can switch from "waitlist" to "launched"
// without redeploying this app. The fetch is best-effort: this is an offline
// capable PWA, so any failure falls back to the waitlist defaults.

export type OpWebMode = 'waitlist' | 'launched';

export interface OpWebConfig {
  mode: OpWebMode;
  message: string | null;
  proUrl: string;
}

export const CONFIG_URL = 'https://squarewave.studio/op-web-config.json';

export const DEFAULT_CONFIG: OpWebConfig = {
  mode: 'waitlist',
  message: null,
  proUrl: 'https://squarewave.studio/op-patchstudio'
};

function normaliseConfig(raw: unknown): OpWebConfig {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_CONFIG;
  }

  const value = raw as Partial<Record<keyof OpWebConfig, unknown>>;

  return {
    mode: value.mode === 'launched' ? 'launched' : 'waitlist',
    message: typeof value.message === 'string' && value.message.length > 0 ? value.message : null,
    proUrl: typeof value.proUrl === 'string' && value.proUrl.length > 0 ? value.proUrl : DEFAULT_CONFIG.proUrl
  };
}

// A successful fetch is cached for a short TTL, so a long-lived tab or an
// installed PWA still notices the waitlist -> launched flip without a reload.
// A failed fetch (this is an offline-capable PWA) is not cached at all, so a
// later call — e.g. when connectivity returns — retries; and once a config has
// been fetched successfully it is retained as the fallback, so a later failed
// refresh never downgrades the app back to the defaults mid-session.
export const CONFIG_TTL_MS = 5 * 60 * 1000;

let pending: Promise<OpWebConfig> | null = null;
let fetchedAt = 0;
let lastGood: OpWebConfig | null = null;

export async function fetchRemoteConfig(): Promise<OpWebConfig> {
  const isStale = fetchedAt > 0 && Date.now() - fetchedAt > CONFIG_TTL_MS;

  if (!pending || isStale) {
    pending = (async () => {
      try {
        const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          pending = null;
          return lastGood ?? DEFAULT_CONFIG;
        }
        const config = normaliseConfig(await response.json());
        fetchedAt = Date.now();
        lastGood = config;
        return config;
      } catch {
        pending = null;
        return lastGood ?? DEFAULT_CONFIG;
      }
    })();
  }

  return pending;
}

// Test-only escape hatch for the memoisation above.
export function resetRemoteConfigCache(): void {
  pending = null;
  fetchedAt = 0;
  lastGood = null;
}
