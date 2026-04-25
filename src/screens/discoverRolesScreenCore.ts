export function resolveDiscoverRoleScoreValue(
  scoreValue: number | null | undefined,
  scoreLabel?: string | null,
) {
  if (typeof scoreValue === 'number' && Number.isFinite(scoreValue)) {
    return scoreValue;
  }

  if (typeof scoreLabel === 'string') {
    const match = scoreLabel.match(/(\d{1,3})/);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function resolveDiscoverRoleScoreLabel(
  scoreLabel: string | null | undefined,
  scoreValue: number | null | undefined,
) {
  if (typeof scoreLabel === 'string' && scoreLabel.trim().length > 0) {
    return scoreLabel.trim();
  }
  if (typeof scoreValue === 'number' && Number.isFinite(scoreValue)) {
    return `${Math.round(scoreValue)}%`;
  }
  return null;
}

export function resolveDiscoverRoleScoreTone(
  scoreValue: number | null | undefined,
  scoreLabel?: string | null,
) {
  const resolvedScore = resolveDiscoverRoleScoreValue(scoreValue, scoreLabel);

  if (resolvedScore === null) {
    return {
      textColor: 'rgba(212,212,224,0.78)',
      backgroundColor: 'rgba(212,212,224,0.12)',
    };
  }

  if (resolvedScore >= 85) {
    return {
      textColor: '#C9A84C',
      backgroundColor: 'rgba(201,168,76,0.18)',
    };
  }

  if (resolvedScore >= 70) {
    return {
      textColor: '#38CC88',
      backgroundColor: 'rgba(56,204,136,0.16)',
    };
  }

  if (resolvedScore >= 40) {
    return {
      textColor: 'rgba(212,212,224,0.78)',
      backgroundColor: 'rgba(212,212,224,0.12)',
    };
  }

  return {
    textColor: '#F58AA7',
    backgroundColor: 'rgba(245,138,167,0.16)',
  };
}

export function shouldShowDiscoverRoleLoadingCard(params: {
  isResolving: boolean;
  scoreLabel: string | null | undefined;
  hasMarket: boolean;
  hasDetail: boolean;
}) {
  return params.isResolving && (!params.scoreLabel || !params.hasMarket || !params.hasDetail);
}
