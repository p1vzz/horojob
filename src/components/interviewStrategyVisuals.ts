export type InterviewStrategyWaveLayerSpec = {
  id: string;
  top: number;
  height: number;
  left: number;
  right: number;
  viewBoxHeight: number;
  path: string;
  strokeWidth: number;
  middleColor: string;
  duration: number;
  translateFrom: number;
  translateTo: number;
  opacityMin: number;
  opacityPeak: number;
  initialValue: number;
};

export const INTERVIEW_STRATEGY_WAVE_LAYER_SPECS: InterviewStrategyWaveLayerSpec[] = [
  {
    id: 'a',
    top: 70,
    height: 100,
    left: -82,
    right: -58,
    viewBoxHeight: 100,
    path: 'M 0 54 C 62 20, 144 88, 224 46 C 300 8, 360 92, 420 50',
    strokeWidth: 14,
    middleColor: 'rgba(255,255,255,0.30)',
    duration: 7600,
    translateFrom: -34,
    translateTo: 22,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
  {
    id: 'c',
    top: 44,
    height: 96,
    left: -76,
    right: -64,
    viewBoxHeight: 96,
    path: 'M 0 50 C 70 14, 150 82, 230 38 C 305 0, 360 86, 420 44',
    strokeWidth: 12,
    middleColor: 'rgba(233,241,255,0.26)',
    duration: 9100,
    translateFrom: 26,
    translateTo: -30,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
  {
    id: 'b',
    top: 152,
    height: 88,
    left: -68,
    right: -60,
    viewBoxHeight: 88,
    path: 'M 0 48 C 72 78, 144 12, 214 50 C 288 84, 352 18, 420 48',
    strokeWidth: 11,
    middleColor: 'rgba(188,205,255,0.24)',
    duration: 9800,
    translateFrom: 30,
    translateTo: -32,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
  {
    id: 'd',
    top: 186,
    height: 84,
    left: -74,
    right: -54,
    viewBoxHeight: 84,
    path: 'M 0 46 C 66 74, 138 16, 210 52 C 284 82, 350 22, 420 46',
    strokeWidth: 10,
    middleColor: 'rgba(210,223,255,0.22)',
    duration: 8450,
    translateFrom: -28,
    translateTo: 24,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
  {
    id: 'e',
    top: 286,
    height: 108,
    left: -66,
    right: -62,
    viewBoxHeight: 108,
    path: 'M 0 66 C 70 104, 150 30, 230 70 C 308 106, 362 34, 420 66',
    strokeWidth: 9,
    middleColor: 'rgba(255,255,255,0.20)',
    duration: 11200,
    translateFrom: 34,
    translateTo: -26,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
  {
    id: 'f',
    top: 332,
    height: 100,
    left: -70,
    right: -56,
    viewBoxHeight: 100,
    path: 'M 0 60 C 68 96, 146 26, 222 64 C 300 100, 360 28, 420 60',
    strokeWidth: 8,
    middleColor: 'rgba(170,194,255,0.20)',
    duration: 12700,
    translateFrom: -22,
    translateTo: 28,
    opacityMin: 0.01,
    opacityPeak: 0.02,
    initialValue: 0,
  },
];
