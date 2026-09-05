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

// Memoised so a successful fetch happens at most once per session. A failed
// fetch (this is an offline-capable PWA) is not memoised, so a later call —
// e.g. when connectivity returns — retries instead of pinning the defaults
// for the whole session.
let pending: Promise<OpWebConfig> | null = null;

export async function fetchRemoteConfig(): Promise<OpWebConfig> {
  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          pending = null;
          return DEFAULT_CONFIG;
        }
        return normaliseConfig(await response.json());
      } catch {
        pending = null;
        return DEFAULT_CONFIG;
      }
    })();
  }

  return pending;
}

// Test-only escape hatch for the once-per-session memoisation.
export function resetRemoteConfigCache(): void {
  pending = null;
}
