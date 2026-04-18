const DARK_JOB_CHECK_TILE_VISUALS = {
  actionIcon: 'rgba(212,212,224,0.35)',
  descriptionText: 'rgba(212,212,224,0.6)',
  serviceLabelText: 'rgba(233,233,242,0.92)',
  serviceDetailText: 'rgba(212,212,224,0.56)',
  serviceBackground: 'rgba(255,255,255,0.04)',
  serviceBorder: 'rgba(255,255,255,0.08)',
  serviceDot: '#38CC88',
  servicesLabelText: 'rgba(212,212,224,0.5)',
  actionBackground: 'rgba(201,168,76,0.16)',
  actionBorder: 'rgba(201,168,76,0.34)',
  actionText: '#E6CA73',
  footnoteText: 'rgba(212,212,224,0.48)',
} as const;

const LIGHT_JOB_CHECK_TILE_VISUALS = {
  actionIcon: 'rgba(86,75,61,0.48)',
  descriptionText: 'rgba(86,75,61,0.74)',
  serviceLabelText: 'rgba(58,53,45,0.94)',
  serviceDetailText: 'rgba(106,92,74,0.7)',
  serviceBackground: 'rgba(255,255,255,0.76)',
  serviceBorder: 'rgba(154,129,92,0.2)',
  serviceDot: '#2FAE79',
  servicesLabelText: 'rgba(106,92,74,0.66)',
  actionBackground: 'rgba(181,141,43,0.14)',
  actionBorder: 'rgba(181,141,43,0.32)',
  actionText: '#8C6A18',
  footnoteText: 'rgba(106,92,74,0.62)',
} as const;

export function getJobCheckTileVisuals(isLight: boolean) {
  return isLight ? LIGHT_JOB_CHECK_TILE_VISUALS : DARK_JOB_CHECK_TILE_VISUALS;
}
