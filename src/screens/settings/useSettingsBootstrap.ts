import React from 'react';
import { runSettingsBootstrap, type SettingsBootstrapCoreDeps } from './settingsBootstrapCore';

export function useSettingsBootstrap(deps: SettingsBootstrapCoreDeps) {
  React.useEffect(() => {
    let mounted = true;
    void runSettingsBootstrap(deps, () => mounted);

    return () => {
      mounted = false;
    };
  }, []);
}
