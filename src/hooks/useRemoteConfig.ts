import { useEffect, useState } from 'react';
import { DEFAULT_CONFIG, fetchRemoteConfig, type OpWebConfig } from '../utils/remoteConfig';

// Returns the remote config, starting from the waitlist defaults so the UI can
// render immediately and settle once the fetch resolves.
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

    load();
    // A PWA can start offline; retry once connectivity returns.
    window.addEventListener('online', load);

    return () => {
      active = false;
      window.removeEventListener('online', load);
    };
  }, []);

  return config;
}
