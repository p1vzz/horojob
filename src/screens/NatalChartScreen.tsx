import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, Line } from 'react-native-svg';
import { loadOnboardingForUser } from '../utils/onboardingStorage';
import { loadNatalChartCacheForUser, saveNatalChartCacheForUser } from '../utils/natalChartStorage';
import { FullScreenCosmicLoader } from '../components/loaders/FullScreenCosmicLoader';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { fetchCareerInsights, fetchNatalChart, type CareerInsightsResponse } from '../services/astrologyApi';
import type { AppNavigationProp } from '../types/navigation';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { NatalPremiumInsightsCard } from '../components/NatalPremiumInsightsCard';

type ChartPlanet = {
  name: string;
  sign: string;
  full_degree: number;
  is_retro?: string | boolean;
  [key: string]: unknown;
};

type ChartHouse = {
  house_id: number;
  sign: string;
  planets?: ChartPlanet[];
  degree?: number;
  full_degree?: number;
  start_degree?: number;
  norm_degree?: number;
  [key: string]: unknown;
};

type ChartAspect = {
  aspecting_planet: string;
  aspected_planet: string;
  type: string;
  orb?: number;
  diff?: number;
};

type NatalApiResponse = {
  chart?: {
    houses?: ChartHouse[];
    aspects?: ChartAspect[];
  };
  meta?: {
    location?: {
      placeName?: string;
    };
  };
};

type PlanetPresentation = {
  planet: string;
  sign: string;
  glyph: string;
  color: string;
  houseId?: number;
  retrograde?: boolean;
};

type PlanetPoint = {
  name: string;
  degree: number;
  glyph: string;
  x: number;
  y: number;
  color: string;
  aspectX: number;
  aspectY: number;
};

type InsightCard = {
  title: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  glyph: string;
  glyphColor: string;
  description: string;
};

type HouseCusp = {
  houseId: number;
  degree: number;
};

type HouseLabelPoint = {
  houseId: number;
  x: number;
  y: number;
};

type AspectLine = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
};

type AxisLabel = {
  key: string;
  label: string;
  x: number;
  y: number;
};

const ZODIAC_SIGNS = [
  '\u2648\uFE0E',
  '\u2649\uFE0E',
  '\u264A\uFE0E',
  '\u264B\uFE0E',
  '\u264C\uFE0E',
  '\u264D\uFE0E',
  '\u264E\uFE0E',
  '\u264F\uFE0E',
  '\u2650\uFE0E',
  '\u2651\uFE0E',
  '\u2652\uFE0E',
  '\u2653\uFE0E',
];

const SIGN_INDEX: Record<string, number> = {
  aries: 0,
  ari: 0,
  taurus: 1,
  tau: 1,
  gemini: 2,
  gem: 2,
  cancer: 3,
  can: 3,
  leo: 4,
  virgo: 5,
  vir: 5,
  libra: 6,
  lib: 6,
  scorpio: 7,
  sco: 7,
  sagittarius: 8,
  sag: 8,
  capricorn: 9,
  cap: 9,
  aquarius: 10,
  aqu: 10,
  pisces: 11,
  pis: 11,
};

const FALLBACK_PLACEMENTS: PlanetPresentation[] = [
  { planet: 'Sun', sign: 'Leo', glyph: '\u2609', color: '#E6D96B' },
  { planet: 'Moon', sign: 'Cancer', glyph: '\u263D', color: '#AEB6D8' },
  { planet: 'Mercury', sign: 'Virgo', glyph: '\u263F', color: '#65B8FF' },
  { planet: 'Venus', sign: 'Libra', glyph: '\u2640', color: '#38CC88' },
  { planet: 'Mars', sign: 'Aries', glyph: '\u2642', color: '#FF6B8A' },
  { planet: 'Jupiter', sign: 'Sagittarius', glyph: '\u2643', color: '#8C7CFF' },
];

const FALLBACK_INSIGHTS: InsightCard[] = [
  {
    title: 'Career Driver',
    tag: 'Core',
    tagColor: '#C9A84C',
    tagBg: 'rgba(201,168,76,0.18)',
    glyph: '\u2726',
    glyphColor: '#C9A84C',
    description: 'Your chart suggests leadership potential in visible, high-impact roles.',
  },
  {
    title: 'Work Style',
    tag: 'Approach',
    tagColor: '#65B8FF',
    tagBg: 'rgba(101,184,255,0.16)',
    glyph: '\u2698',
    glyphColor: '#65B8FF',
    description: 'Detail-oriented thinking supports structured analysis and communication.',
  },
];

const PLANET_STYLE: Record<string, { glyph: string; color: string }> = {
  Sun: { glyph: '\u2609', color: '#E6D96B' },
  Moon: { glyph: '\u263D', color: '#AEB6D8' },
  Mercury: { glyph: '\u263F', color: '#65B8FF' },
  Venus: { glyph: '\u2640', color: '#38CC88' },
  Mars: { glyph: '\u2642', color: '#FF6B8A' },
  Jupiter: { glyph: '\u2643', color: '#8C7CFF' },
  Saturn: { glyph: '\u2644', color: '#A2B0FF' },
  Uranus: { glyph: '\u2645', color: '#6A5BFF' },
  Neptune: { glyph: '\u2646', color: '#66D0FF' },
  Pluto: { glyph: '\u2647', color: '#FF9FB4' },
  Node: { glyph: '\u260A', color: '#C9A84C' },
  Chiron: { glyph: '\u26B7', color: '#A2B0FF' },
  'Part of Fortune': { glyph: '\u2297', color: '#D3B25D' },
};

const CHART_SIZE = 292;
const CHART_CENTER = CHART_SIZE / 2;
const ZODIAC_OUTER_RADIUS = 124;
const ZODIAC_INNER_RADIUS = 106;
const HOUSE_OUTER_RADIUS = 96;
const HOUSE_INNER_RADIUS = 66;
const ASPECT_RADIUS = 58;
const PLANET_RING_RADIUS = 90;
const SIGN_LABEL_RADIUS = 115;
const HOUSE_LABEL_RADIUS = 80;
const AXIS_LABEL_RADIUS = ZODIAC_OUTER_RADIUS + 10;
const { width, height } = Dimensions.get('window');
const AnimatedSvgLine = Animated.createAnimatedComponent(Line);

const PLACEMENT_PRIORITY = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'node',
  'chiron',
  'partoffortune',
];

function getPlanetStyle(name: string) {
  const normalized = normalizePlanetName(name);
  if (normalized === 'node') return PLANET_STYLE.Node;
  if (normalized === 'partoffortune') return PLANET_STYLE['Part of Fortune'];
  if (normalized === 'chiron') return PLANET_STYLE.Chiron;
  return PLANET_STYLE[name] ?? { glyph: '\u2736', color: '#AEB6D8' };
}

function toCircleDegree(degree: number) {
  const normalized = degree % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function signToIndex(sign: string) {
  return SIGN_INDEX[sign.trim().toLowerCase()] ?? 0;
}

function normalizePlanetName(planetName: string) {
  const normalized = planetName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('northnode') || normalized.includes('truenode') || normalized.includes('meannode')) {
    return 'node';
  }
  if (normalized === 'dragonhead') return 'node';
  return normalized;
}

function isRetrograde(value: string | boolean | undefined) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === 'retrograde' || normalized === 'retro' || normalized === 'r' || normalized === 'rx';
}

function placementPriority(name: string) {
  const normalized = normalizePlanetName(name);
  const index = PLACEMENT_PRIORITY.indexOf(normalized);
  return index === -1 ? PLACEMENT_PRIORITY.length + 1 : index;
}

function degreeToRadian(degree: number, ascDegree: number) {
  return ((toCircleDegree(degree - ascDegree) + 180) * Math.PI) / 180;
}

function polarPoint(radius: number, degree: number, ascDegree: number) {
  const angle = degreeToRadian(degree, ascDegree);
  return {
    x: CHART_CENTER + Math.cos(angle) * radius,
    y: CHART_CENTER + Math.sin(angle) * radius,
  };
}

function readHouseDegree(house: ChartHouse | undefined): number | null {
  if (!house) return null;
  const signBaseDegree = signToIndex(house.sign) * 30;
  const directDegree = parseFiniteNumber(house.full_degree);
  if (directDegree !== null) return toCircleDegree(directDegree);

  const candidateKeys = ['degree', 'start_degree', 'norm_degree', 'longitude', 'cusp', 'cusp_degree'];
  for (const key of candidateKeys) {
    const value = parseFiniteNumber(house[key]);
    if (value === null) continue;
    if (value >= 0 && value <= 30) {
      return toCircleDegree(signBaseDegree + value);
    }
    return toCircleDegree(value);
  }

  return null;
}

function buildHouseCusps(houses: ChartHouse[]): HouseCusp[] {
  const byId = new Map(houses.map((house) => [house.house_id, house]));
  const houseOne = byId.get(1);
  const fallbackAscDegree = signToIndex(houseOne?.sign ?? 'Aries') * 30;

  return Array.from({ length: 12 }, (_, i) => {
    const houseId = i + 1;
    const house = byId.get(houseId);
    const explicit = readHouseDegree(house);
    return {
      houseId,
      degree: explicit ?? toCircleDegree(fallbackAscDegree + i * 30),
    };
  });
}

function buildHouseLabelPoints(cusps: HouseCusp[], ascDegree: number): HouseLabelPoint[] {
  return cusps.map((cusp, i) => {
    const next = cusps[(i + 1) % cusps.length];
    const span = toCircleDegree(next.degree - cusp.degree);
    const middle = toCircleDegree(cusp.degree + span / 2);
    const point = polarPoint(HOUSE_LABEL_RADIUS, middle, ascDegree);
    return {
      houseId: cusp.houseId,
      x: point.x,
      y: point.y,
    };
  });
}

function aspectColor(type: string) {
  const value = type.trim().toLowerCase();
  if (
    value.includes('square') ||
    value.includes('opposition') ||
    value.includes('quincunx') ||
    value.includes('sesqui')
  ) {
    return 'rgba(255,92,107,0.78)';
  }
  if (value.includes('trine') || value.includes('sextile') || value.includes('quintile')) {
    return 'rgba(56,204,136,0.82)';
  }
  return 'rgba(101,184,255,0.8)';
}

function buildPlanetPoints(planets: ChartPlanet[], ascDegree: number): PlanetPoint[] {
  const base = planets.slice(0, 12);
  if (base.length === 0) return [];

  const sorted = [...base].sort((a, b) => a.full_degree - b.full_degree);
  const points: PlanetPoint[] = [];
  const clusterThreshold = 8;
  let cursor = 0;

  while (cursor < sorted.length) {
    let end = cursor + 1;
    while (end < sorted.length && sorted[end].full_degree - sorted[end - 1].full_degree < clusterThreshold) {
      end += 1;
    }

    const cluster = sorted.slice(cursor, end);
    cluster.forEach((planet, index) => {
      const radialShift = index === 0 ? 0 : (Math.ceil(index / 2) * 6 + (index > 4 ? 2 : 0)) * (index % 2 === 1 ? 1 : -1);
      const radius = PLANET_RING_RADIUS + radialShift;
      const style = getPlanetStyle(planet.name);
      const point = polarPoint(radius, planet.full_degree, ascDegree);
      const aspectPoint = polarPoint(ASPECT_RADIUS, planet.full_degree, ascDegree);

      points.push({
        name: planet.name,
        degree: planet.full_degree,
        glyph: style.glyph,
        color: style.color,
        x: point.x,
        y: point.y,
        aspectX: aspectPoint.x,
        aspectY: aspectPoint.y,
      });
    });

    cursor = end;
  }

  return points;
}

function buildAspectLines(aspects: ChartAspect[], planetPoints: PlanetPoint[]): AspectLine[] {
  const byName = new Map(planetPoints.map((point) => [normalizePlanetName(point.name), point]));
  const seenPairs = new Set<string>();

  return aspects
    .slice(0, 40)
    .map((aspect, index) => {
      const fromName = normalizePlanetName(aspect.aspecting_planet);
      const toName = normalizePlanetName(aspect.aspected_planet);
      const pairKey = [fromName, toName].sort().join(':');
      const aspectKey = `${pairKey}:${aspect.type.trim().toLowerCase()}`;
      if (seenPairs.has(aspectKey)) return null;
      seenPairs.add(aspectKey);

      const from = byName.get(fromName);
      const to = byName.get(toName);
      if (!from || !to) return null;
      const baseStroke = 0.9;
      const orb = typeof aspect.orb === 'number' ? Math.max(0, Math.min(aspect.orb, 12)) : 6;
      const emphasis = 1 - orb / 12;

      return {
        key: `${aspect.aspecting_planet}-${aspect.aspected_planet}-${aspect.type}-${index}`,
        x1: from.aspectX,
        y1: from.aspectY,
        x2: to.aspectX,
        y2: to.aspectY,
        color: aspectColor(aspect.type),
        strokeWidth: baseStroke + emphasis * 0.9,
      } satisfies AspectLine;
    })
    .filter((line): line is AspectLine => Boolean(line));
}

function buildAxisLabels(houseCusps: HouseCusp[], ascDegree: number): AxisLabel[] {
  const asc = houseCusps.find((house) => house.houseId === 1)?.degree ?? ascDegree;
  const mc = houseCusps.find((house) => house.houseId === 10)?.degree ?? toCircleDegree(asc + 270);

  const entries = [
    { key: 'asc', label: 'AC', degree: asc },
    { key: 'dc', label: 'DC', degree: toCircleDegree(asc + 180) },
    { key: 'mc', label: 'MC', degree: mc },
    { key: 'ic', label: 'IC', degree: toCircleDegree(mc + 180) },
  ];

  return entries.map((item) => {
    const point = polarPoint(AXIS_LABEL_RADIUS, item.degree, ascDegree);
    const clampPadding = 12;
    const x = Math.min(CHART_SIZE - clampPadding, Math.max(clampPadding, point.x));
    return { ...item, x, y: point.y };
  });
}

function buildInsights(aspects: ChartAspect[]): InsightCard[] {
  const cards = aspects.slice(0, 4).map((aspect, index) => {
    const palette = [
      { tagColor: '#C9A84C', tagBg: 'rgba(201,168,76,0.18)', glyphColor: '#C9A84C' },
      { tagColor: '#65B8FF', tagBg: 'rgba(101,184,255,0.16)', glyphColor: '#65B8FF' },
      { tagColor: '#38CC88', tagBg: 'rgba(56,204,136,0.16)', glyphColor: '#38CC88' },
      { tagColor: '#FF6B8A', tagBg: 'rgba(255,107,138,0.16)', glyphColor: '#FF6B8A' },
    ][index % 4];

    const orbText = typeof aspect.orb === 'number' ? ` Orb ${aspect.orb}\u00B0.` : '';

    return {
      title: `${aspect.aspecting_planet} ${aspect.type} ${aspect.aspected_planet}`,
      tag: 'Aspect',
      tagColor: palette.tagColor,
      tagBg: palette.tagBg,
      glyph: '\u2736',
      glyphColor: palette.glyphColor,
      description: `This aspect describes how your internal drives interact in work and ambition.${orbText}`,
    };
  });

  return cards.length > 0 ? cards : FALLBACK_INSIGHTS;
}

function mapCareerInsights(payload: CareerInsightsResponse): InsightCard[] {
  const palette = [
    { tagColor: '#C9A84C', tagBg: 'rgba(201,168,76,0.18)', glyphColor: '#C9A84C' },
    { tagColor: '#65B8FF', tagBg: 'rgba(101,184,255,0.16)', glyphColor: '#65B8FF' },
    { tagColor: '#38CC88', tagBg: 'rgba(56,204,136,0.16)', glyphColor: '#38CC88' },
    { tagColor: '#FF6B8A', tagBg: 'rgba(255,107,138,0.16)', glyphColor: '#FF6B8A' },
  ];

  const cards = payload.insights.slice(0, 5).map((item, index) => {
    const p = palette[index % palette.length];
    const firstAction = item.actions[0];
    const description = firstAction ? `${item.description} Next: ${firstAction}` : item.description;
    return {
      title: item.title,
      tag: item.tag || (payload.tier === 'premium' ? 'Premium' : 'AI'),
      tagColor: p.tagColor,
      tagBg: p.tagBg,
      glyph: '\u2736',
      glyphColor: p.glyphColor,
      description,
    } satisfies InsightCard;
  });

  return cards.length > 0 ? cards : FALLBACK_INSIGHTS;
}

export const NatalChartScreen = () => {
  const { theme } = useThemeMode();

  const navigation = useNavigation<AppNavigationProp<'NatalChart'>>();
  const [apiPayload, setApiPayload] = useState<NatalApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'chart' | 'insights'>('chart');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [aiInsightCards, setAiInsightCards] = useState<InsightCard[] | null>(null);

  const headerEnter = useRef(new Animated.Value(0)).current;
  const placementsEnter = useRef(new Animated.Value(0)).current;
  const insightsEnter = useRef(new Animated.Value(0)).current;
  const signCascade = useRef(ZODIAC_SIGNS.map(() => new Animated.Value(0))).current;
  const houseCascade = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  const axisCascade = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;

  const houses = useMemo(() => apiPayload?.chart?.houses ?? [], [apiPayload]);
  const aspects = useMemo(() => apiPayload?.chart?.aspects ?? [], [apiPayload]);
  const houseCusps = useMemo(() => buildHouseCusps(houses), [houses]);
  const ascDegree = useMemo(
    () => houseCusps.find((house) => house.houseId === 1)?.degree ?? 0,
    [houseCusps]
  );

  const planets = useMemo(() => {
    const extracted = houses.flatMap((house) =>
      (house.planets ?? []).map((planet) => ({
        ...planet,
        houseId: house.house_id,
      }))
    );
    return extracted.sort((a, b) => a.full_degree - b.full_degree);
  }, [houses]);

  const placements = useMemo<PlanetPresentation[]>(() => {
    const deduped = new Map<string, PlanetPresentation>();
    for (const planet of planets) {
      const key = normalizePlanetName(planet.name);
      if (deduped.has(key)) continue;
      const style = getPlanetStyle(planet.name);
      deduped.set(key, {
        planet: planet.name,
        sign: planet.sign,
        glyph: style.glyph,
        color: style.color,
        houseId: (planet as ChartPlanet & { houseId?: number }).houseId,
        retrograde: isRetrograde(planet.is_retro),
      });
    }

    const items = Array.from(deduped.values()).sort((a, b) => {
      const priorityDiff = placementPriority(a.planet) - placementPriority(b.planet);
      if (priorityDiff !== 0) return priorityDiff;
      return a.planet.localeCompare(b.planet);
    });

    return items.length > 0 ? items : FALLBACK_PLACEMENTS;
  }, [planets]);

  const planetPoints = useMemo(() => {
    const points = buildPlanetPoints(planets, ascDegree);
    if (points.length > 0) return points;
    return buildPlanetPoints(
      FALLBACK_PLACEMENTS.map((item, idx) => ({
        name: item.planet,
        sign: item.sign,
        full_degree: idx * 20,
      })),
      ascDegree
    );
  }, [ascDegree, planets]);

  const aspectLines = useMemo(() => buildAspectLines(aspects, planetPoints), [aspects, planetPoints]);
  const pointCascade = useMemo(() => planetPoints.map(() => new Animated.Value(0)), [planetPoints]);
  const aspectCascade = useMemo(() => aspectLines.map(() => new Animated.Value(0)), [aspectLines]);

  const insights = useMemo(() => aiInsightCards ?? buildInsights(aspects), [aiInsightCards, aspects]);

  const placementRows = useMemo(() => {
    const rows: PlanetPresentation[][] = [];
    for (let i = 0; i < placements.length; i += 2) {
      rows.push(placements.slice(i, i + 2));
    }
    return rows;
  }, [placements]);
  const placementCardCount = useMemo(
    () => placementRows.reduce((count, row) => count + row.length, 0),
    [placementRows]
  );
  const placementCardCascade = useMemo(
    () => Array.from({ length: placementCardCount }, () => new Animated.Value(0)),
    [placementCardCount]
  );
  const insightCardCascade = useMemo(
    () => insights.map(() => new Animated.Value(0)),
    [insights]
  );

  const ascSign = useMemo(
    () => houses.find((house) => house.house_id === 1)?.sign ?? 'Unknown',
    [houses]
  );
  const mcSign = useMemo(
    () => houses.find((house) => house.house_id === 10)?.sign ?? 'Unknown',
    [houses]
  );
  const houseLabelPoints = useMemo(() => buildHouseLabelPoints(houseCusps, ascDegree), [houseCusps, ascDegree]);
  const axisLabels = useMemo(() => buildAxisLabels(houseCusps, ascDegree), [houseCusps, ascDegree]);

  const signPositions = useMemo(
    () =>
      ZODIAC_SIGNS.map((sign, i) => {
        const signDegree = i * 30 + 15;
        const point = polarPoint(SIGN_LABEL_RADIUS, signDegree, ascDegree);
        return {
          sign,
          x: point.x,
          y: point.y,
        };
      }),
    [ascDegree]
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      let currentUserId: string | null = null;
      try {
        setIsLoading(true);
        setLoadingPhase('chart');
        setErrorText(null);
        setLoadedFromCache(false);
        setAiInsightCards(null);
        try {
          const session = await ensureAuthSession();
          currentUserId = session.user.id;
        } catch {
          currentUserId = null;
        }
        let payload: NatalApiResponse;
        try {
          payload = (await fetchNatalChart()) as NatalApiResponse;
        } catch (error) {
          if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
            if (!currentUserId) {
              throw new Error('Session is missing. Complete onboarding first.');
            }
            const onboarding = await loadOnboardingForUser(currentUserId);
            if (!onboarding) {
              throw new Error('Birth details are missing. Complete onboarding first.');
            }
            payload = (await fetchNatalChart(onboarding)) as NatalApiResponse;
          } else {
            throw error;
          }
        }

        let generatedInsights: InsightCard[] | null = null;
        try {
          setLoadingPhase('insights');
          const insightsPayload = await fetchCareerInsights({ tier: 'free' });
          generatedInsights = mapCareerInsights(insightsPayload);
        } catch {
          generatedInsights = null;
        }

        if (mounted) {
          setApiPayload(payload);
          setAiInsightCards(generatedInsights);
          if (currentUserId) {
            await saveNatalChartCacheForUser(currentUserId, payload);
          }
        }
      } catch (error) {
        const cache = currentUserId ? await loadNatalChartCacheForUser(currentUserId) : null;
        if (mounted) {
          if (cache?.payload) {
            setApiPayload(cache.payload as NatalApiResponse);
            setLoadedFromCache(true);
            setAiInsightCards(null);
          } else {
            setErrorText(error instanceof Error ? error.message : 'Failed to load natal chart');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    headerEnter.setValue(0);
    placementsEnter.setValue(0);
    insightsEnter.setValue(0);
    Animated.stagger(110, [
      Animated.timing(headerEnter, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.bezier(0.2, 0.9, 0.22, 1)),
        useNativeDriver: true,
      }),
      Animated.timing(placementsEnter, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.bezier(0.2, 0.9, 0.22, 1)),
        useNativeDriver: true,
      }),
      Animated.timing(insightsEnter, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.bezier(0.2, 0.9, 0.22, 1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerEnter, placementsEnter, insightsEnter]);

  useEffect(() => {
    if (isLoading) return;

    signCascade.forEach((value) => value.setValue(0));
    houseCascade.forEach((value) => value.setValue(0));
    axisCascade.forEach((value) => value.setValue(0));
    pointCascade.forEach((value) => value.setValue(0));
    aspectCascade.forEach((value) => value.setValue(0));

    const buildStep = (value: Animated.Value, duration: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });

    const animation = Animated.parallel([
      Animated.stagger(70, signCascade.map((value) => buildStep(value, 520))),
      Animated.stagger(68, pointCascade.map((value) => buildStep(value, 560))),
      Animated.stagger(66, houseCascade.map((value) => buildStep(value, 520))),
      Animated.stagger(90, axisCascade.map((value) => buildStep(value, 540))),
      Animated.stagger(
        42,
        aspectCascade.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          })
        )
      ),
    ]);

    animation.start();
    return () => {
      animation.stop();
    };
  }, [isLoading, signCascade, houseCascade, axisCascade, pointCascade, aspectCascade]);

  useEffect(() => {
    if (isLoading) return;

    placementCardCascade.forEach((value) => value.setValue(0));
    insightCardCascade.forEach((value) => value.setValue(0));

    const buildStep = (value: Animated.Value, duration: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
        useNativeDriver: true,
      });

    const animation = Animated.parallel([
      Animated.stagger(70, placementCardCascade.map((value) => buildStep(value, 520))),
      Animated.stagger(90, insightCardCascade.map((value) => buildStep(value, 560))),
    ]);

    animation.start();
    return () => {
      animation.stop();
    };
  }, [isLoading, placementCardCascade, insightCardCascade]);

  const headerStyle = {
    opacity: headerEnter,
    transform: [
      {
        translateY: headerEnter.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 0],
        }),
      },
    ],
  };

  const placementsStyle = {
    opacity: placementsEnter,
    transform: [
      {
        translateY: placementsEnter.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  const insightsStyle = {
    opacity: insightsEnter,
    transform: [
      {
        translateY: insightsEnter.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  if (isLoading) {
    const subtitle =
      loadingPhase === 'insights'
        ? 'Generating your career insights...'
        : 'Aligning houses, planets, and aspects...';
    return (
      <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <FullScreenCosmicLoader
          title="Calculating Natal Chart"
          subtitle={subtitle}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient
              id="natalGradTop"
              cx="45%"
              cy="-5%"
              rx="70%"
              ry="50%"
              fx="45%"
              fy="-5%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(90,58,204,0.28)" stopOpacity="0.28" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.06)" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="natalGradBottom"
              cx="78%"
              cy="106%"
              rx="68%"
              ry="48%"
              fx="78%"
              fy="106%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(201,168,76,0.18)" stopOpacity="0.18" />
              <Stop offset="60%" stopColor="rgba(201,168,76,0.04)" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#natalGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#natalGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-5 pt-2">
            <Animated.View className="flex-row items-center mb-3" style={headerStyle}>
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <ChevronLeft size={18} color="rgba(212,212,224,0.75)" />
              </Pressable>
              <View>
                <Text className="text-[15px] font-semibold" style={{ color: 'rgba(233,233,242,0.95)' }}>
                  Natal Chart
                </Text>
                <Text
                  className="text-[11px]"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: 'rgba(212,212,224,0.52)', maxWidth: 230 }}
                >
                  {apiPayload?.meta?.location?.placeName ?? 'Birth location'}
                </Text>
              </View>
            </Animated.View>

            {loadedFromCache ? (
              <Text className="mb-4 text-[12px]" style={{ color: 'rgba(201,168,76,0.85)' }}>
                Showing cached chart data.
              </Text>
            ) : null}

            {errorText ? (
              <Text className="mb-4 text-[12px]" style={{ color: '#FF9FB4' }}>
                {errorText}
              </Text>
            ) : null}

            <View className="items-center mb-6">
              <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>
                <Svg width={CHART_SIZE} height={CHART_SIZE}>
                  <Circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={ZODIAC_OUTER_RADIUS}
                    fill="none"
                    stroke="rgba(201,168,76,0.3)"
                    strokeWidth="1.05"
                  />
                  <Circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={ZODIAC_INNER_RADIUS}
                    fill="none"
                    stroke="rgba(201,168,76,0.22)"
                    strokeWidth="0.9"
                  />
                  <Circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={HOUSE_OUTER_RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.8"
                  />
                  <Circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={HOUSE_INNER_RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="0.8"
                  />
                  <Circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={ASPECT_RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.75"
                  />

                  {houseCusps.map((house) => {
                    const isMainAxis = house.houseId === 1 || house.houseId === 4 || house.houseId === 7 || house.houseId === 10;
                    const from = polarPoint(HOUSE_INNER_RADIUS, house.degree, ascDegree);
                    const to = polarPoint(ZODIAC_OUTER_RADIUS, house.degree, ascDegree);
                    return (
                      <Line
                        key={`house-${house.houseId}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isMainAxis ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'}
                        strokeWidth={isMainAxis ? 1.1 : 0.72}
                      />
                    );
                  })}

                  {aspectLines.map((line, i) => {
                    const draw = aspectCascade[i];
                    const pencilShiftX = (i % 2 === 0 ? 1 : -1) * 0.38;
                    const pencilShiftY = (i % 3 === 0 ? -1 : 1) * 0.42;
                    const x2 =
                      draw?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [line.x1, line.x2],
                      }) ?? line.x2;
                    const y2 =
                      draw?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [line.y1, line.y2],
                      }) ?? line.y2;
                    const lineOpacity =
                      draw?.interpolate({
                        inputRange: [0, 0.12, 1],
                        outputRange: [0, 0.58, 1],
                      }) ?? 1;
                    return (
                      <React.Fragment key={line.key}>
                        <AnimatedSvgLine
                          x1={line.x1 + pencilShiftX}
                          y1={line.y1 + pencilShiftY}
                          x2={draw ? Animated.add(x2, pencilShiftX) : line.x2 + pencilShiftX}
                          y2={draw ? Animated.add(y2, pencilShiftY) : line.y2 + pencilShiftY}
                          stroke="rgba(255,255,255,0.19)"
                          strokeWidth={line.strokeWidth + 0.35}
                          strokeLinecap="round"
                          opacity={lineOpacity}
                        />
                        <AnimatedSvgLine
                          x1={line.x1}
                          y1={line.y1}
                          x2={x2}
                          y2={y2}
                          stroke={line.color}
                          strokeWidth={line.strokeWidth}
                          strokeOpacity={0.82}
                          strokeLinecap="round"
                          opacity={lineOpacity}
                        />
                      </React.Fragment>
                    );
                  })}
                </Svg>

                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: CHART_SIZE,
                    height: CHART_SIZE,
                  }}
                  pointerEvents="none"
                >
                  {signPositions.map((item, i) => (
                    <View key={`${item.sign}-${i}`} style={{ position: 'absolute', left: item.x - 9, top: item.y - 10 }}>
                      <Animated.Text
                        style={{
                          fontSize: 16,
                          color: '#C9A84C',
                          textShadowColor: 'rgba(201,168,76,0.35)',
                          textShadowRadius: 8,
                          opacity: signCascade[i],
                          transform: [
                            {
                              scale: signCascade[i].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.85, 1],
                              }),
                            },
                          ],
                        }}
                      >
                        {item.sign}
                      </Animated.Text>
                    </View>
                  ))}

                  {houseLabelPoints.map((label, i) => (
                    <Animated.Text
                      key={`house-label-${label.houseId}`}
                      style={{
                        position: 'absolute',
                        left: label.x - 8,
                        top: label.y - 8,
                        width: 16,
                        textAlign: 'center',
                        fontSize: 11,
                        color: 'rgba(210,210,224,0.72)',
                        opacity: houseCascade[i] ?? 1,
                        transform: [
                          {
                            scale:
                              houseCascade[i]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.82, 1],
                              }) ?? 1,
                          },
                        ],
                      }}
                    >
                      {label.houseId}
                    </Animated.Text>
                  ))}

                  {axisLabels.map((axis, i) => (
                    <Animated.Text
                      key={axis.key}
                      style={{
                        position: 'absolute',
                        left: axis.x - 14,
                        top: axis.y - 9,
                        width: 28,
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: '600',
                        color: axis.label === 'MC' || axis.label === 'IC' ? '#C9A84C' : 'rgba(220,220,234,0.86)',
                        opacity: axisCascade[i] ?? 1,
                        transform: [
                          {
                            scale:
                              axisCascade[i]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.86, 1],
                              }) ?? 1,
                          },
                        ],
                      }}
                    >
                      {axis.label}
                    </Animated.Text>
                  ))}
                </View>

                {planetPoints.map((point, i) => (
                  <View
                    key={`${point.name}-${point.degree}-${i}`}
                    style={{ position: 'absolute', left: point.x - 11, top: point.y - 11, width: 22, height: 22 }}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: -4,
                        top: -4,
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        backgroundColor: `${point.color}44`,
                        opacity: pointCascade[i]?.interpolate({
                          inputRange: [0, 0.45, 1],
                          outputRange: [0, 0.9, 0],
                        }) ?? 1,
                        transform: [
                          {
                            scale:
                              pointCascade[i]?.interpolate({
                                inputRange: [0, 0.45, 1],
                                outputRange: [0.85, 1.45, 1],
                              }) ?? 1,
                          },
                        ],
                      }}
                    />
                    <Animated.View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(9,9,18,0.95)',
                        borderWidth: 1,
                        borderColor: `${point.color}80`,
                        opacity: pointCascade[i] ?? 1,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: point.color }}>{point.glyph}</Text>
                    </Animated.View>
                  </View>
                ))}
              </View>

              <View className="flex-row mt-3 gap-2">
                <View
                  className="px-3 py-1.5 rounded-[12px] flex-row items-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
                    ASC
                  </Text>
                  <Text className="text-[12px] ml-1 font-semibold" style={{ color: 'rgba(233,233,242,0.95)' }}>
                    {ascSign}
                  </Text>
                </View>
                <View
                  className="px-3 py-1.5 rounded-[12px] flex-row items-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
                    MC
                  </Text>
                  <Text className="text-[12px] ml-1 font-semibold" style={{ color: 'rgba(233,233,242,0.95)' }}>
                    {mcSign}
                  </Text>
                </View>
              </View>
            </View>

            <Animated.View style={placementsStyle}>
              <Text
                className="text-[11px] tracking-[2.3px] font-semibold mb-2 px-1"
                style={{ color: 'rgba(212,212,224,0.36)' }}
              >
                PLACEMENTS
              </Text>

              <View className="gap-2 mb-6">
                {placementRows.map((row, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-2">
                    {row.map((item, colIndex) => {
                      const cardIndex = rowIndex * 2 + colIndex;
                      const cardAnimation = placementCardCascade[cardIndex];
                      return (
                        <Animated.View
                        key={`${item.planet}-${item.sign}`}
                        className="flex-1"
                        style={{
                          opacity: cardAnimation ?? 1,
                          transform: [
                            {
                              translateY:
                                cardAnimation?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [12, 0],
                                }) ?? 0,
                            },
                            {
                              scale:
                                cardAnimation?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.985, 1],
                                }) ?? 1,
                            },
                          ],
                        }}
                      >
                        <View
                          className="rounded-[14px] px-3 py-2.5 flex-row items-center"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.07)',
                            borderWidth: 1,
                          }}
                        >
                          <View
                            className="w-5 h-5 rounded-full items-center justify-center mr-2"
                            style={{ backgroundColor: `${item.color}1F` }}
                          >
                            <Text style={{ color: item.color, fontSize: 12 }}>{item.glyph}</Text>
                          </View>
                          <Text className="text-[13px] font-semibold flex-1" style={{ color: 'rgba(233,233,242,0.95)' }}>
                            {item.planet}
                          </Text>
                          <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.48)' }}>
                            {item.sign}
                            {typeof item.houseId === 'number' ? ` H${item.houseId}` : ''}
                            {item.retrograde ? ' Rx' : ''}
                          </Text>
                        </View>
                      </Animated.View>
                      );
                    })}
                    {row.length === 1 ? <View className="flex-1" /> : null}
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View style={insightsStyle}>
              <Text
                className="text-[11px] tracking-[2.3px] font-semibold mb-2 px-1"
                style={{ color: 'rgba(212,212,224,0.36)' }}
              >
                CAREER INSIGHTS
              </Text>

              <View className="gap-3">
                {insights.map((insight, index) => (
                  <Animated.View
                    key={`${insight.title}-${index}`}
                    className="rounded-[16px] p-4"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.07)',
                      borderWidth: 1,
                      opacity: insightCardCascade[index] ?? 1,
                      transform: [
                        {
                          translateY:
                            insightCardCascade[index]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [16, 0],
                            }) ?? 0,
                        },
                        {
                          scale:
                            insightCardCascade[index]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.985, 1],
                            }) ?? 1,
                        },
                      ],
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text style={{ color: insight.glyphColor, fontSize: 12, marginRight: 6 }}>{insight.glyph}</Text>
                      <Text className="text-[17px] font-semibold flex-1" style={{ color: 'rgba(240,240,248,0.96)' }}>
                        {insight.title}
                      </Text>
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: insight.tagBg }}>
                        <Text className="text-[11px] font-semibold" style={{ color: insight.tagColor }}>
                          {insight.tag}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[13px] leading-[19px]" style={{ color: 'rgba(212,212,224,0.58)' }}>
                      {insight.description}
                    </Text>
                  </Animated.View>
                ))}
              </View>
              <NatalPremiumInsightsCard onPress={() => navigation.navigate('PremiumPurchase')} />
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
