import { useEffect, useState } from 'react';
import { CONFIG_TTL_MS, DEFAULT_CONFIG, fetchRemoteConfig, type OpWebConfig } from '../utils/remoteConfig';

// Returns the remote config, starting from the waitlist defaults so the UI can
// render immediately and settle once the fetch resolves. Refreshes when
// connectivity returns, when the tab becomes visible again, and on a timer, so
// a long-lived tab or installed PWA still picks up the launch flip.
export function useRemoteConfig(): OpWebConfig {
  const [config, setConfig] = useState<OpWebConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;

    const load = () => {
      fetchRemoteConfig().then(result => {
        if (active) {
          setConfig(result);
        }
      });
    };

    const loadIfVisible = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };

    load();
    // A PWA can start offline; retry once connectivity returns.
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', loadIfVisible);
    const timer = window.setInterval(loadIfVisible, CONFIG_TTL_MS);

    return () => {
      active = false;
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', loadIfVisible);
      window.clearInterval(timer);
    };
  }, []);

  return config;
}
