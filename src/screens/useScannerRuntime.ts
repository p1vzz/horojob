import React from 'react';
import { ensureAuthSession } from '../services/authSession';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';
import { useJobAnalysis, useJobPreflight } from '../hooks/queries/useJobAnalysis';
import type { AppNavigationProp, AppRouteProp, ScannerImportedMeta } from '../types/navigation';
import {
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
  buildHistoryScanDisplay,
  buildScanMetaFromResult,
  normalizeScannerInitialUrl,
  resolveHistorySelection,
  resolveLastScanRestore,
  resolvePreflightGate,
  resolveSessionCacheHit,
  type ScannerHistoryDisplay,
} from './scannerRuntimeCore';

type UseScannerRuntimeArgs = {
  navigation: AppNavigationProp<'Scanner'>;
  route: AppRouteProp<'Scanner'>;
};

type ActiveScannerSnapshot = {
  url: string;
  analysis: JobAnalyzeSuccessResponse | null;
  scanMeta: ScannerImportedMeta | null;
  errorState: ScannerErrorState | null;
};

export function useScannerRuntime(args: UseScannerRuntimeArgs) {
  const { navigation, route } = args;
  const { mutateAsync: runPreflightMutation } = useJobPreflight();
  const { mutateAsync: runAnalysisMutation } = useJobAnalysis();
  const [url, setUrl] = React.useState('');
  const [analysis, setAnalysis] = React.useState<JobAnalyzeSuccessResponse | null>(null);
  const [phase, setPhase] = React.useState<ScannerPhase>('idle');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorState, setErrorState] = React.useState<ScannerErrorState | null>(null);
  const [scanMeta, setScanMeta] = React.useState<ScannerImportedMeta | null>(null);
  const [historyEntry, setHistoryEntry] = React.useState<JobScanHistoryEntry | null>(null);
  const initialImportedAnalysisRef = React.useRef(route.params?.importedAnalysis);
  const initialUrlRef = React.useRef(normalizeScannerInitialUrl(route.params?.initialUrl));
  const initialHistoryEntryRef = React.useRef(route.params?.historyEntry);
  const inFlightRef = React.useRef(false);
  const activeScanSnapshotRef = React.useRef<ActiveScannerSnapshot | null>(null);
  const activeStateRef = React.useRef<ActiveScannerSnapshot>({
    url: '',
    analysis: null,
    scanMeta: null,
    errorState: null,
  });
  const historyEntryRef = React.useRef<JobScanHistoryEntry | null>(null);

  React.useEffect(() => {
    activeStateRef.current = {
      url,
      analysis,
      scanMeta,
      errorState,
    };
  }, [analysis, errorState, scanMeta, url]);

  React.useEffect(() => {
    historyEntryRef.current = historyEntry;
  }, [historyEntry]);

  React.useEffect(() => {
    let mounted = true;
    const skipRestore =
      Boolean(initialImportedAnalysisRef.current) ||
      Boolean(initialHistoryEntryRef.current) ||
      initialUrlRef.current.length > 0;

    void (async () => {
      try {
        const session = await ensureAuthSession();
        const cached = await loadLastJobScanForUser(session.user.id);
        if (!mounted) {
          return;
        }

        if (skipRestore || historyEntryRef.current) {
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
    activeScanSnapshotRef.current = null;
    setHistoryEntry(null);
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
          await saveJobScanHistoryEntryForUser(session.user.id, {
            url: storageUrl,
            analysis: importedAnalysis,
            meta: importedMeta,
          });
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

  React.useEffect(() => {
    const selectedHistoryEntry = route.params?.historyEntry;
    if (!selectedHistoryEntry) {
      return;
    }

    if (!historyEntryRef.current) {
      activeScanSnapshotRef.current = activeStateRef.current;
    }

    const selection = resolveHistorySelection(selectedHistoryEntry);
    setHistoryEntry(selectedHistoryEntry);
    setUrl(selection.url);

    if (selection.kind === 'blocked') {
      setAnalysis(null);
      setScanMeta(null);
      setErrorState(selection.errorState);
      navigation.setParams({ historyEntry: undefined });
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

    navigation.setParams({ historyEntry: undefined });
  }, [navigation, route.params?.historyEntry]);

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
    activeScanSnapshotRef.current = null;
    setHistoryEntry(null);
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
      const preflight = await runPreflightMutation({ url: trimmedUrl });
      const gate = resolvePreflightGate(preflight);
      if (gate.kind === 'blocked') {
        setErrorState(gate.errorState);
        return;
      }

      setPhase(gate.phase);
      const result = await runAnalysisMutation({ url: trimmedUrl });
      const nextMeta = buildScanMetaFromResult(preflight, result);
      setAnalysis(result);
      setScanMeta(nextMeta);
      saveSessionJobScanForUser(session.user.id, trimmedUrl, {
        analysis: result,
        meta: nextMeta,
      });

      try {
        await saveJobScanHistoryEntryForUser(session.user.id, {
          url: trimmedUrl,
          analysis: result,
          meta: nextMeta,
        });
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
  }, [runAnalysisMutation, runPreflightMutation]);

  const onRunFullAnalysis = React.useCallback(async () => {
    const trimmedUrl = normalizeScannerInitialUrl(url);
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
    activeScanSnapshotRef.current = null;
    setHistoryEntry(null);
    setUrl(trimmedUrl);
    setErrorState(null);
    setIsLoading(true);

    try {
      const session = await ensureAuthSession();
      setPhase('preflight');
      const preflight = await runPreflightMutation({ url: trimmedUrl });
      const gate = resolvePreflightGate(preflight);
      if (gate.kind === 'blocked') {
        setErrorState(gate.errorState);
        return;
      }

      setPhase('scoring');
      const result = await runAnalysisMutation({
        url: trimmedUrl,
        options: { scanDepth: 'full' },
      });
      const nextMeta = buildScanMetaFromResult(preflight, result);
      setAnalysis(result);
      setScanMeta(nextMeta);
      saveSessionJobScanForUser(session.user.id, trimmedUrl, {
        analysis: result,
        meta: nextMeta,
      });

      try {
        await saveJobScanHistoryEntryForUser(session.user.id, {
          url: trimmedUrl,
          analysis: result,
          meta: nextMeta,
        });
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
  }, [runAnalysisMutation, runPreflightMutation, url]);

  React.useEffect(() => {
    const initialUrl = normalizeScannerInitialUrl(route.params?.initialUrl);
    if (!initialUrl) {
      return;
    }

    setUrl(initialUrl);
    activeScanSnapshotRef.current = null;
    setHistoryEntry(null);
    if (route.params?.autoStart) {
      void runScan(initialUrl);
    }

    navigation.setParams({
      initialUrl: undefined,
      autoStart: undefined,
    });
  }, [navigation, route.params?.autoStart, route.params?.initialUrl, runScan]);

  const onScanPress = React.useCallback(async () => {
    await runScan(url);
  }, [runScan, url]);

  const onReturnToActiveScan = React.useCallback(() => {
    const snapshot = activeScanSnapshotRef.current;
    setHistoryEntry(null);
    activeScanSnapshotRef.current = null;

    if (!snapshot) {
      setUrl('');
      setAnalysis(null);
      setScanMeta(null);
      setErrorState(null);
      return;
    }

    setUrl(snapshot.url);
    setAnalysis(snapshot.analysis);
    setScanMeta(snapshot.scanMeta);
    setErrorState(snapshot.errorState);
  }, []);

  const historicalScan: ScannerHistoryDisplay | null = React.useMemo(
    () => buildHistoryScanDisplay(historyEntry),
    [historyEntry]
  );

  return {
    analysis,
    errorState,
    historicalScan,
    isLoading,
    onReturnToActiveScan,
    onRunFullAnalysis,
    onScanPress,
    phase,
    scanMeta,
    setUrl,
    url,
  };
}
