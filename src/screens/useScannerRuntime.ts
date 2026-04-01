import React from 'react';
import { ensureAuthSession } from '../services/authSession';
import {
  analyzeJobUrl,
  preflightJobUrl,
  type JobAnalyzeSuccessResponse,
} from '../services/jobsApi';
import type { AppNavigationProp, AppRouteProp, ScannerImportedMeta } from '../types/navigation';
import {
  loadJobScanHistoryForUser,
  saveJobScanHistoryEntryForUser,
  type JobScanHistoryEntry,
} from '../utils/jobScanHistoryStorage';
import {
  clearLastJobScanForUser,
  loadLastJobScanForUser,
  saveLastJobScanForUser,
} from '../utils/jobScanStorage';
import {
  clearSessionJobScansForUser,
  loadSessionJobScanForUser,
  saveSessionJobScanForUser,
} from '../utils/jobScanSessionCache';
import {
  ERROR_TEXTS,
  parseApiError,
  type ScannerErrorState,
  type ScannerPhase,
} from './scannerUtils';
import {
  buildImportedScannerMeta,
  buildScanMetaFromResult,
  normalizeScannerInitialUrl,
  resolveHistorySelection,
  resolveLastScanRestore,
  resolvePreflightGate,
  resolveSessionCacheHit,
} from './scannerRuntimeCore';

type UseScannerRuntimeArgs = {
  navigation: AppNavigationProp<'Scanner'>;
  route: AppRouteProp<'Scanner'>;
};

export function useScannerRuntime(args: UseScannerRuntimeArgs) {
  const { navigation, route } = args;
  const [url, setUrl] = React.useState('');
  const [analysis, setAnalysis] = React.useState<JobAnalyzeSuccessResponse | null>(null);
  const [scanHistory, setScanHistory] = React.useState<JobScanHistoryEntry[]>([]);
  const [phase, setPhase] = React.useState<ScannerPhase>('idle');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorState, setErrorState] = React.useState<ScannerErrorState | null>(null);
  const [scanMeta, setScanMeta] = React.useState<ScannerImportedMeta | null>(null);
  const initialImportedAnalysisRef = React.useRef(route.params?.importedAnalysis);
  const initialUrlRef = React.useRef(normalizeScannerInitialUrl(route.params?.initialUrl));
  const inFlightRef = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;
    const skipRestore =
      Boolean(initialImportedAnalysisRef.current) || initialUrlRef.current.length > 0;

    void (async () => {
      try {
        const session = await ensureAuthSession();
        const [cached, history] = await Promise.all([
          loadLastJobScanForUser(session.user.id),
          loadJobScanHistoryForUser(session.user.id),
        ]);
        if (!mounted) {
          return;
        }

        setScanHistory(history);
        if (skipRestore) {
          return;
        }

        const restoreSelection = resolveLastScanRestore(cached);
        if (restoreSelection.kind === 'discard_challenge') {
          await clearLastJobScanForUser(session.user.id);
          return;
        }

        if (restoreSelection.kind !== 'restore') {
          return;
        }

        setAnalysis(restoreSelection.analysis);
        setScanMeta(restoreSelection.meta);
        setUrl((current) => (current.trim().length > 0 ? current : restoreSelection.url));
        saveSessionJobScanForUser(session.user.id, restoreSelection.url, {
          analysis: restoreSelection.analysis,
          meta: restoreSelection.meta,
        });
      } catch {
        // non-blocking cache restore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const importedAnalysis = route.params?.importedAnalysis;
    if (!importedAnalysis) {
      return;
    }

    let mounted = true;
    const importedMeta = buildImportedScannerMeta(importedAnalysis, route.params?.importedMeta);
    const importedUrl = normalizeScannerInitialUrl(route.params?.importedUrl);
    const storageUrl = importedUrl || 'Screenshot Upload';

    if (importedUrl) {
      setUrl(importedUrl);
    }
    setAnalysis(importedAnalysis);
    setScanMeta(importedMeta);
    setErrorState(null);

    void ensureAuthSession()
      .then(async (session) => {
        if (!mounted) {
          return;
        }

        saveSessionJobScanForUser(session.user.id, storageUrl, {
          analysis: importedAnalysis,
          meta: importedMeta,
        });

        try {
          const history = await saveJobScanHistoryEntryForUser(session.user.id, {
            url: storageUrl,
            analysis: importedAnalysis,
            meta: importedMeta,
          });
          if (!mounted) {
            return;
          }
          setScanHistory(history);
        } catch {
          // non-blocking history sync
        }
      })
      .catch(() => {
        // non-blocking session sync
      });

    navigation.setParams({
      importedAnalysis: undefined,
      importedMeta: undefined,
      importedUrl: undefined,
    });

    return () => {
      mounted = false;
    };
  }, [navigation, route.params?.importedAnalysis, route.params?.importedMeta, route.params?.importedUrl]);

  const runScan = React.useCallback(async (rawUrl: string) => {
    const trimmedUrl = normalizeScannerInitialUrl(rawUrl);
    if (!trimmedUrl) {
      setErrorState({
        code: 'invalid_url',
        message: ERROR_TEXTS.invalid_url,
        retryAt: null,
        usageContext: null,
      });
      return;
    }

    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setUrl(trimmedUrl);
    setErrorState(null);

    try {
      const session = await ensureAuthSession();
      const sessionResolution = resolveSessionCacheHit(
        loadSessionJobScanForUser(session.user.id, trimmedUrl)
      );
      if (sessionResolution.kind === 'discard_challenge') {
        clearSessionJobScansForUser(session.user.id);
      } else if (sessionResolution.kind === 'use_cached') {
        setAnalysis(sessionResolution.analysis);
        setScanMeta(sessionResolution.meta);
        return;
      }

      setIsLoading(true);
      setPhase('preflight');
      const preflight = await preflightJobUrl(trimmedUrl);
      const gate = resolvePreflightGate(preflight);
      if (gate.kind === 'blocked') {
        setErrorState(gate.errorState);
        return;
      }

      setPhase(gate.phase);
      const result = await analyzeJobUrl(trimmedUrl);
      const nextMeta = buildScanMetaFromResult(preflight, result);
      setAnalysis(result);
      setScanMeta(nextMeta);
      saveSessionJobScanForUser(session.user.id, trimmedUrl, {
        analysis: result,
        meta: nextMeta,
      });

      try {
        const history = await saveJobScanHistoryEntryForUser(session.user.id, {
          url: trimmedUrl,
          analysis: result,
          meta: nextMeta,
        });
        setScanHistory(history);
      } catch {
        // non-blocking history save
      }

      try {
        await saveLastJobScanForUser(session.user.id, {
          url: trimmedUrl,
          analysis: result,
          meta: nextMeta,
        });
      } catch {
        // non-blocking cache save
      }
    } catch (error) {
      setErrorState(parseApiError(error));
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setPhase('idle');
    }
  }, []);

  React.useEffect(() => {
    const initialUrl = normalizeScannerInitialUrl(route.params?.initialUrl);
    if (!initialUrl) {
      return;
    }

    setUrl(initialUrl);
    if (route.params?.autoStart) {
      void runScan(initialUrl);
    }

    navigation.setParams({
      initialUrl: undefined,
      autoStart: undefined,
    });
  }, [navigation, route.params?.autoStart, route.params?.initialUrl, runScan]);

  const onHistoryPress = React.useCallback((entry: JobScanHistoryEntry) => {
    const selection = resolveHistorySelection(entry);
    setUrl(selection.url);

    if (selection.kind === 'blocked') {
      setErrorState(selection.errorState);
      return;
    }

    setAnalysis(selection.analysis);
    setScanMeta(selection.meta);
    setErrorState(null);
    void ensureAuthSession()
      .then((session) => {
        saveSessionJobScanForUser(session.user.id, selection.url, {
          analysis: selection.analysis,
          meta: selection.meta,
        });
      })
      .catch(() => {
        // non-blocking session cache warmup
      });
  }, []);

  const onScanPress = React.useCallback(async () => {
    await runScan(url);
  }, [runScan, url]);

  return {
    analysis,
    errorState,
    isLoading,
    onHistoryPress,
    onScanPress,
    phase,
    scanHistory,
    scanMeta,
    setUrl,
    url,
  };
}
