export const DASHBOARD_BACKGROUND_GRADIENTS = {
  top: {
    id: 'grad1',
    cx: '40%',
    cy: '-5%',
    rx: '70%',
    ry: '50%',
    fx: '40%',
    fy: '-5%',
    stops: [
      { offset: '0%', color: 'rgba(90,58,204,0.4)', opacity: '0.4' },
      { offset: '50%', color: 'rgba(90,58,204,0.1)', opacity: '0.1' },
      { offset: '100%', color: 'transparent', opacity: '0' },
    ],
  },
  bottom: {
    id: 'grad2',
    cx: '85%',
    cy: '105%',
    rx: '65%',
    ry: '45%',
    fx: '85%',
    fy: '105%',
    stops: [
      { offset: '0%', color: 'rgba(201,168,76,0.3)', opacity: '0.3' },
      { offset: '50%', color: 'rgba(201,168,76,0.08)', opacity: '0.08' },
      { offset: '100%', color: 'rgba(201,168,76,0)', opacity: '0' },
    ],
  },
} as const;
