import React from 'react';
import { runSettingsBootstrap, type SettingsBootstrapCoreDeps } from './settingsBootstrapCore';

type SettingsBootstrapLifecycle = {
  onStart?: () => void;
  onSettled?: () => void;
};

export function useSettingsBootstrap(deps: SettingsBootstrapCoreDeps, lifecycle: SettingsBootstrapLifecycle = {}) {
  React.useEffect(() => {
    let mounted = true;
    lifecycle.onStart?.();
    void runSettingsBootstrap(deps, () => mounted).finally(() => {
      if (mounted) {
        lifecycle.onSettled?.();
      }
    });

    return () => {
      mounted = false;
    };
  }, []);
}
