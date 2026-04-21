export const FULL_NATAL_GENERATION_STEPS = [
  'Preparing your birth details',
  'Reading your natal chart',
  'Building your career blueprint',
  'Checking the finished report',
] as const;

type OperationProgressStageLike = {
  title: string;
  detail: string;
  state: 'pending' | 'active' | 'complete' | 'failed';
};

type OperationProgressLike = {
  title?: string | null;
  subtitle?: string | null;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  stages?: OperationProgressStageLike[];
} | null;

export function resolveFullNatalLoaderContent(progress: OperationProgressLike) {
  const stages = progress?.stages?.filter((stage) => stage.title.trim().length > 0) ?? [];
  const activeIndex = stages.findIndex((stage) => stage.state === 'active' || stage.state === 'failed');
  const completedIndex = progress?.status === 'completed' && stages.length > 0 ? stages.length - 1 : -1;
  const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : completedIndex;
  const activeStage = resolvedActiveIndex >= 0 ? stages[resolvedActiveIndex] : null;

  return {
    title: progress?.title?.trim() || 'Building Career Blueprint',
    subtitle:
      activeStage?.detail?.trim() ||
      progress?.subtitle?.trim() ||
      'This can take a little while on the first run.',
    steps: stages.length > 0 ? stages.map((stage) => stage.title) : [...FULL_NATAL_GENERATION_STEPS],
    activeStepIndex: resolvedActiveIndex >= 0 ? resolvedActiveIndex : undefined,
  };
}

export type FullNatalAnalysisErrorCopy = {
  title: string;
  message: string;
  action: 'retry' | 'generate_natal_chart';
  actionLabel: string;
};

export function resolveFullNatalAnalysisErrorCopy(input: {
  status?: number | null;
  code?: string | null;
  message?: string | null;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}): FullNatalAnalysisErrorCopy {
  if (input.isTimeout || input.code === 'full_natal_llm_timeout') {
    return {
      title: 'Generation took too long',
      message: 'The report took longer than expected. Check your connection and retry in a moment.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  if (input.code === 'natal_chart_missing') {
    return {
      title: 'Natal chart required',
      message: 'Generate your natal chart first so we can build the full career report from current birth data.',
      action: 'generate_natal_chart',
      actionLabel: 'Generate Natal Chart',
    };
  }

  if (input.code === 'birth_profile_missing') {
    return {
      title: 'Birth profile required',
      message: 'Complete your birth profile first, then return here to generate the full career report.',
      action: 'generate_natal_chart',
      actionLabel: 'Complete Birth Profile',
    };
  }

  if (input.code === 'full_natal_llm_rate_limited') {
    return {
      title: 'Generator is busy',
      message: 'The report generator is temporarily busy. Retry in a few minutes.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  if (input.code === 'full_natal_llm_invalid_response') {
    return {
      title: 'Report validation failed',
      message: 'We could not validate the generated report. Retry to build a clean version.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  if (
    input.code === 'full_natal_llm_unavailable' ||
    input.code === 'full_natal_llm_unconfigured' ||
    input.status === 503
  ) {
    return {
      title: 'Generator unavailable',
      message: 'The report generator is temporarily unavailable. Retry in a few minutes.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  if (input.isNetworkError) {
    return {
      title: 'Server unavailable',
      message: 'We could not reach the server. Check your connection and retry.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  if (input.status === 502 || input.code === 'full_natal_llm_upstream_error') {
    return {
      title: 'Could not generate report',
      message: 'The report builder ran into a service issue. Retry in a moment.',
      action: 'retry',
      actionLabel: 'Retry',
    };
  }

  return {
    title: 'Could not load report',
    message: input.message?.trim() || 'Unable to load full career analysis right now.',
    action: 'retry',
    actionLabel: 'Retry',
  };
}

export function shouldShowProfileChangeNotice(
  notice: { profileUpdatedAt: string; expiresAt: string } | null | undefined,
  nowMs = Date.now(),
) {
  if (!notice) return false;
  const profileUpdatedAtMs = Date.parse(notice.profileUpdatedAt);
  const expiresAtMs = Date.parse(notice.expiresAt);
  return Number.isFinite(profileUpdatedAtMs) && Number.isFinite(expiresAtMs) && nowMs <= expiresAtMs;
}
