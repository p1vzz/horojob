export type InterviewStrategyAlertContent = {
  title: string;
  message: string;
};

function errorStatus(error: unknown) {
  const status = (error as { status?: unknown })?.status;
  return typeof status === 'number' ? status : null;
}

function payloadErrorMessage(error: unknown) {
  const payload = (error as { payload?: unknown })?.payload;
  if (payload && typeof payload === 'object') {
    const message = (payload as Record<string, unknown>).error;
    if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  }
  return null;
}

function isTimeoutError(error: unknown) {
  const name = (error as { name?: unknown })?.name;
  if (name === 'FetchTimeoutError') return true;
  return error instanceof Error && error.message.toLowerCase().includes('timed out');
}

export function resolveInterviewStrategyPreparationAlert(error: unknown): InterviewStrategyAlertContent {
  const status = errorStatus(error);
  const apiMessage = payloadErrorMessage(error);
  const rawMessage = apiMessage ?? (error instanceof Error ? error.message.trim() : '');
  const normalizedMessage = rawMessage.toLowerCase();

  if (status === 401) {
    return {
      title: 'Sign In Required',
      message: 'Sign in again before Interview Strategy can prepare your windows.',
    };
  }

  if (status === 403) {
    return {
      title: 'Premium Required',
      message: 'Interview Strategy is available on the premium plan.',
    };
  }

  if (normalizedMessage.includes('birth profile not found') || normalizedMessage.includes('complete your birth profile')) {
    return {
      title: 'Birth Profile Required',
      message: 'Complete your birth profile first, then Interview Strategy can prepare your windows.',
    };
  }

  if (normalizedMessage.includes('natal chart not found') || normalizedMessage.includes('natal chart')) {
    return {
      title: 'Natal Chart Required',
      message: 'Your natal chart needs to finish preparing before Interview Strategy can update your windows.',
    };
  }

  if (normalizedMessage.includes('daily transit data unavailable')) {
    return {
      title: 'Transit Data Unavailable',
      message: 'Future transit data could not be prepared right now. Try again in a moment.',
    };
  }

  if (status === 404) {
    return {
      title: 'Profile Required',
      message: 'Complete your birth profile and natal chart first, then Interview Strategy can prepare your windows.',
    };
  }

  if (isTimeoutError(error)) {
    return {
      title: 'Still Generating',
      message: 'Future transit preparation can take up to a minute. Try again in a moment.',
    };
  }

  if (apiMessage) {
    return {
      title: 'Update Failed',
      message: apiMessage,
    };
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      title: 'Update Failed',
      message: error.message.trim(),
    };
  }

  return {
    title: 'Update Failed',
    message: 'Could not update Interview Strategy right now. Try again in a moment.',
  };
}
