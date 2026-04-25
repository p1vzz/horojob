import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAstrologyApi,
  FULL_NATAL_ANALYSIS_FETCH_TIMEOUT_MS,
  NATAL_CHART_FETCH_TIMEOUT_MS,
} from './astrologyApiCore';

type TestRequestInit = RequestInit & {
  timeoutMs?: number;
};

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('astrology api returns null for missing birth profile (404)', async () => {
  const api = createAstrologyApi({
    authorizedFetch: async () => new Response(JSON.stringify({ error: 'not_found' }), { status: 404 }),
    parseJsonBody: async () => ({ error: 'not_found' }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchBirthProfile();
  assert.equal(payload, null);
});

test('astrology api birth profile preserves optional current role in fetch and save payloads', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      if (!init?.method || init.method === 'GET') {
        return new Response(
          JSON.stringify({
            profile: {
              name: 'Sam',
              birthDate: '15/06/1990',
              birthTime: '14:30',
              unknownTime: false,
              city: 'New York',
              currentJobTitle: 'Product Manager',
              updatedAt: '2026-04-24T10:00:00.000Z',
            },
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          profile: {
            name: 'Sam',
            birthDate: '15/06/1990',
            birthTime: '14:30',
            unknownTime: false,
            city: 'New York',
            currentJobTitle: 'Founder',
          },
        }),
        { status: 200 },
      );
    },
    parseJsonBody: async (response) => JSON.parse(await response.text()),
    ApiError: FakeApiError as never,
  });

  const fetched = await api.fetchBirthProfile();
  const saved = await api.upsertBirthProfile({
    name: 'Sam',
    birthDate: '15/06/1990',
    birthTime: '14:30',
    unknownTime: false,
    city: 'New York',
    currentJobTitle: 'Founder',
  });

  assert.equal(fetched?.profile.currentJobTitle, 'Product Manager');
  assert.equal(saved.profile.currentJobTitle, 'Founder');
  assert.equal(calls[0]?.path, '/api/astrology/birth-profile');
  assert.equal(calls[1]?.init?.method, 'PUT');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).currentJobTitle, 'Founder');
});

test('astrology api career insights builds default and custom query', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchCareerInsights();
  await api.fetchCareerInsights({ tier: 'premium', regenerate: true });

  assert.deepEqual(paths, [
    '/api/astrology/career-insights?tier=free&regenerate=false',
    '/api/astrology/career-insights?tier=premium&regenerate=true',
  ]);
});

test('astrology api market career context fetches free market paths', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({
      algorithmVersion: 'market_career_context.v1',
      generatedAt: '2026-04-23T12:00:00.000Z',
      location: 'US',
      sourceNote: 'Market data provided by CareerOneStop.',
      marketCareerPaths: [
        {
          slug: 'software-engineer',
          title: 'Technical Systems',
          domain: 'Technical Systems',
          fitScore: 91,
          fitLabel: 'Best fit',
          opportunityScore: 96,
          rationale: 'Systems-oriented chart signals.',
          developmentVector: 'Build production systems.',
          exampleRoles: ['Software Developer'],
          tags: ['technical'],
          salaryRangeLabel: '$95k-$145k/yr',
          marketGradient: 'high_upside',
          marketScoreLabel: 'strong market',
          demandLabel: 'high',
          sourceRoleTitle: 'Software Developers',
          market: {
            query: { keyword: 'Software Developers', location: 'US' },
            occupation: {
              onetCode: '15-1252.00',
              socCode: '15-1252',
              title: 'Software Developers',
              description: null,
              matchConfidence: 'high',
            },
            salary: {
              currency: 'USD',
              period: 'annual',
              min: 95000,
              max: 145000,
              median: 120000,
              year: '2025',
              confidence: 'medium',
              basis: 'market_estimate',
            },
            outlook: {
              growthLabel: 'Much faster than average',
              projectedOpenings: 120000,
              projectionYears: '2024-2034',
              demandLabel: 'high',
            },
            skills: [],
            labels: {
              marketScore: 'strong market',
              salaryVisibility: 'market_estimate',
            },
            sources: [
              {
                provider: 'careeronestop',
                label: 'CareerOneStop',
                url: 'https://www.careeronestop.org/',
                retrievedAt: '2026-04-23T12:00:00.000Z',
                attributionText: 'Labor market data provided by CareerOneStop.',
                logoRequired: true,
              },
            ],
          },
        },
      ],
      negotiationPrep: {
        title: 'Negotiation Prep',
        summary: 'Use the public market estimate as an anchor.',
        sourceRoleTitle: 'Software Developers',
        salaryRangeLabel: '$95k-$145k/yr',
        salaryVisibilityLabel: 'Market estimate',
        rangePositioningLabel: 'Anchor from the upper half when scope is high.',
        anchorStrategy: {
          label: 'Market anchor',
          target: '$95k-$145k/yr',
          explanation: 'Use the range as public market context.',
          talkingPoint: 'Could you share the budgeted range?',
        },
        guidance: ['Ask for the budgeted range early.'],
        recruiterQuestions: ['What range has been budgeted?'],
        salaryExpectationScripts: [{ label: 'When pay is not posted', script: 'Could you share the range?' }],
        offerChecklist: ['Confirm base salary.'],
        redFlags: ['No range shared.'],
        tradeoffLevers: ['Base salary'],
        nextSteps: ['Pick your floor.'],
        market: null,
      },
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchMarketCareerContext();

  assert.deepEqual(paths, ['/api/astrology/market-career-context']);
  assert.equal(payload.marketCareerPaths[0].salaryRangeLabel, '$95k-$145k/yr');
  assert.equal(payload.marketCareerPaths[0].market?.salary?.median, 120000);
  assert.equal(payload.negotiationPrep.guidance[0], 'Ask for the budgeted range early.');
  assert.equal(payload.negotiationPrep.anchorStrategy.target, '$95k-$145k/yr');
  assert.equal(payload.negotiationPrep.salaryExpectationScripts[0]?.script, 'Could you share the range?');
});

test('astrology api daily transit requests ai synergy only when asked', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchDailyTransit();
  await api.fetchDailyTransit({ includeAiSynergy: true });

  assert.deepEqual(paths, [
    '/api/astrology/daily-transit',
    '/api/astrology/daily-transit?includeAiSynergy=true',
  ]);
});

test('astrology api morning briefing query defaults to refresh=false', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchMorningBriefing();
  await api.fetchMorningBriefing({ refresh: true });

  assert.deepEqual(paths, [
    '/api/astrology/morning-briefing?refresh=false',
    '/api/astrology/morning-briefing?refresh=true',
  ]);
});

test('astrology api career vibe plan query defaults to refresh=false', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchCareerVibePlan();
  await api.fetchCareerVibePlan({ refresh: true });

  assert.deepEqual(paths, [
    '/api/astrology/career-vibe-plan?refresh=false',
    '/api/astrology/career-vibe-plan?refresh=true',
  ]);
});

test('astrology api full natal analysis uses extended timeout for generation', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchFullNatalCareerAnalysis();

  assert.deepEqual(
    calls.map((call) => call.path),
    [
      '/api/astrology/full-natal-analysis',
    ]
  );
  assert.deepEqual(
    calls.map((call) => call.init?.timeoutMs),
    [
      FULL_NATAL_ANALYSIS_FETCH_TIMEOUT_MS,
    ]
  );
});

test('astrology api full natal progress uses generic progress endpoint', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({ operation: 'full_natal_career_analysis' }), { status: 200 });
    },
    parseJsonBody: async () => ({ operation: 'full_natal_career_analysis' }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchFullNatalCareerAnalysisProgress();

  assert.deepEqual(paths, ['/api/astrology/full-natal-analysis/progress']);
  assert.equal(payload.operation, 'full_natal_career_analysis');
});

test('astrology api cached full natal analysis returns null when report is not generated', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({ error: 'Full natal analysis has not been generated yet.' }), {
        status: 404,
      });
    },
    parseJsonBody: async () => ({
      error: 'Full natal analysis has not been generated yet.',
      code: 'full_natal_analysis_not_ready',
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchCachedFullNatalCareerAnalysis();

  assert.equal(payload, null);
  assert.deepEqual(paths, ['/api/astrology/full-natal-analysis?cacheOnly=true']);
});

test('astrology api cached full natal analysis preserves setup errors', async () => {
  const api = createAstrologyApi({
    authorizedFetch: async () => new Response(JSON.stringify({ error: 'Natal chart not found.' }), { status: 404 }),
    parseJsonBody: async () => ({ error: 'Natal chart not found.' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.fetchCachedFullNatalCareerAnalysis(),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, 'Natal chart not found.');
      return true;
    }
  );
});

test('astrology api natal chart sends POST body and surfaces backend error message', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const successApi = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ chart: {} }), { status: 200 });
    },
    parseJsonBody: async () => ({ chart: {} }),
    ApiError: FakeApiError as never,
  });

  await successApi.fetchNatalChart({
    name: 'Alex',
    birthDate: '2000-01-01',
    birthTime: '08:00',
    unknownTime: false,
    city: 'Warsaw',
    latitude: 52.2297,
    longitude: 21.0122,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/astrology/natal-chart');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(calls[0].init?.timeoutMs, NATAL_CHART_FETCH_TIMEOUT_MS);
  assert.equal((calls[0].init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.city, 'Warsaw');

  const failApi = createAstrologyApi({
    authorizedFetch: async () => new Response(JSON.stringify({ error: 'invalid profile' }), { status: 422 }),
    parseJsonBody: async () => ({ error: 'invalid profile' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => failApi.fetchNatalChart(),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 422);
      assert.equal(error.message, 'invalid profile');
      assert.deepEqual(error.payload, { error: 'invalid profile' });
      return true;
    },
  );
});

test('astrology api discover roles trims query and applies defaults', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchDiscoverRoles({ query: '  data scientist  ' });

  assert.equal(paths.length, 1);
  const url = new URL(`https://example.com${paths[0]}`);
  assert.equal(url.pathname, '/api/astrology/discover-roles');
  assert.equal(url.searchParams.get('query'), 'data scientist');
  assert.equal(url.searchParams.get('limit'), '5');
  assert.equal(url.searchParams.get('searchLimit'), '20');
  assert.equal(url.searchParams.get('refresh'), 'false');
  assert.equal(url.searchParams.get('deferSearchScores'), 'false');
  assert.equal(url.searchParams.get('rankingMode'), 'fit');
  assert.equal(url.searchParams.get('scoreSlug'), null);
});

test('astrology api discover roles can defer search scores and request one score slug', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchDiscoverRoles({
    query: 'teacher',
    deferSearchScores: true,
    scoreSlug: 'elementary-school-teacher',
    rankingMode: 'opportunity',
  });

  assert.equal(paths.length, 1);
  const url = new URL(`https://example.com${paths[0]}`);
  assert.equal(url.searchParams.get('deferSearchScores'), 'true');
  assert.equal(url.searchParams.get('scoreSlug'), 'elementary-school-teacher');
  assert.equal(url.searchParams.get('rankingMode'), 'opportunity');
});

test('astrology api discover roles normalizes market-backed response fields', async () => {
  const api = createAstrologyApi({
    authorizedFetch: async () => new Response('{}', { status: 200 }),
    parseJsonBody: async () => ({
      algorithmVersion: 'discover-roles-v2',
      cached: true,
      generatedAt: '2026-04-22T00:00:00.000Z',
      rankingMode: 'opportunity',
      query: '',
      context: {
        currentJob: {
          title: 'Product Manager',
          matchedRole: {
            slug: 'product-manager',
            title: 'Product Manager',
            domain: 'Product & Strategy',
            source: {
              provider: 'manual',
              code: null,
              url: null,
            },
          },
          updatedAt: '2026-04-24T00:00:00.000Z',
        },
      },
      recommended: [
        {
          slug: 'software-developers',
          title: 'Software Developers',
          domain: 'Data & Technology',
          score: 84,
          scoreLabel: '84%',
          reason: 'Strong fit.',
          tags: ['Technical'],
          source: {
            provider: 'onetonline',
            code: '15-1252.00',
            url: 'https://www.onetonline.org/link/summary/15-1252.00',
          },
          detail: {
            whyFit: {
              summary: 'Strong fit.',
              bullets: ['Analytical work maps well here.'],
              topTraits: ['Analytical'],
            },
            realityCheck: {
              summary: 'Expect heavy systems thinking.',
              tasks: ['Build production software.'],
              workContext: ['Cross-functional delivery.'],
              toolThemes: ['Developer tools'],
            },
            entryBarrier: {
              level: 'specialized',
              label: 'Specialized Ramp',
              summary: 'You need credible technical proof.',
              signals: ['Portfolio or shipped work matters.'],
            },
            transitionMap: [
              {
                lane: 'best_match',
                label: 'Closest Next Move',
                summary: 'Closest to Product Manager while still keeping strong alignment.',
                role: {
                  slug: 'product-manager',
                  title: 'Product Manager',
                  domain: 'Product & Strategy',
                  fitScore: 82,
                  fitLabel: '82% fit',
                  barrier: {
                    level: 'specialized',
                    label: 'Specialized Ramp',
                  },
                },
              },
            ],
            bestAlternative: {
              headline: 'Cleaner move from your current lane',
              summary: 'Product Manager is the cleaner bet if you want to stay closer to your current work.',
              reasons: ['It stays closer to Product Manager.'],
              role: {
                slug: 'product-manager',
                title: 'Product Manager',
                domain: 'Product & Strategy',
                fitScore: 82,
                fitLabel: '82% fit',
                barrier: {
                  level: 'specialized',
                  label: 'Specialized Ramp',
                },
              },
            },
          },
          opportunityScore: 91,
          market: {
            occupation: { title: 'Software Developers' },
            labels: { marketScore: 'strong market', salaryVisibility: 'market_estimate' },
          },
        },
      ],
      search: [
        {
          slug: 'software-developers',
          title: 'Software Developers',
          domain: 'Data & Technology',
          tags: ['Technical'],
          detail: {
            whyFit: {
              summary: 'Strong fit.',
              bullets: ['Analytical work maps well here.'],
              topTraits: ['Analytical'],
            },
            realityCheck: {
              summary: 'Expect heavy systems thinking.',
              tasks: ['Build production software.'],
              workContext: ['Cross-functional delivery.'],
              toolThemes: ['Developer tools'],
            },
            entryBarrier: {
              level: 'specialized',
              label: 'Specialized Ramp',
              summary: 'You need credible technical proof.',
              signals: ['Portfolio or shipped work matters.'],
            },
            transitionMap: [
              {
                lane: 'easier_entry',
                label: 'Easier Entry',
                summary: 'Lower switching friction while keeping enough fit.',
                role: {
                  slug: 'project-coordinator',
                  title: 'Project Coordinator',
                  domain: 'Product & Strategy',
                  fitScore: 76,
                  fitLabel: '76% fit',
                  barrier: {
                    level: 'accessible',
                    label: 'Lower Entry Barrier',
                  },
                },
              },
            ],
            bestAlternative: null,
          },
          scoreStatus: 'deferred',
        },
      ],
      meta: { catalogSize: 120, signals: ['MC in Capricorn'] },
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchDiscoverRoles({ rankingMode: 'opportunity' });

  assert.equal(payload.rankingMode, 'opportunity');
  assert.equal(payload.context.currentJob?.title, 'Product Manager');
  assert.equal(payload.context.currentJob?.matchedRole?.slug, 'product-manager');
  assert.equal(payload.recommended[0]?.market?.occupation.title, 'Software Developers');
  assert.equal(payload.recommended[0]?.detail?.entryBarrier.level, 'specialized');
  assert.equal(payload.recommended[0]?.detail?.bestAlternative?.role.slug, 'product-manager');
  assert.equal(payload.recommended[0]?.market?.labels.marketScore, 'strong market');
  assert.equal(payload.recommended[0]?.opportunityScore, 91);
  assert.equal(payload.search[0]?.detail?.whyFit.topTraits[0], 'Analytical');
  assert.equal(payload.search[0]?.detail?.transitionMap[0]?.lane, 'easier_entry');
  assert.equal(payload.search[0]?.market, null);
  assert.equal(payload.search[0]?.opportunityScore, null);
});

test('astrology api current job endpoints use expected paths and normalize payload', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      if (!init?.method || init.method === 'GET') {
        return new Response(
          JSON.stringify({
            currentJob: {
              title: 'Product Manager',
              matchedRole: {
                slug: 'product-manager',
                title: 'Product Manager',
                domain: 'Product & Strategy',
                source: {
                  provider: 'manual',
                  code: null,
                  url: null,
                },
              },
              updatedAt: '2026-04-24T00:00:00.000Z',
            },
          }),
          { status: 200 },
        );
      }
      if (init.method === 'PUT') {
        return new Response(
          JSON.stringify({
            currentJob: {
              title: 'Founder',
              matchedRole: null,
              updatedAt: '2026-04-24T01:00:00.000Z',
            },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ currentJob: null }), { status: 200 });
    },
    parseJsonBody: async (response) => JSON.parse(await response.text()),
    ApiError: FakeApiError as never,
  });

  const fetched = await api.fetchDiscoverRoleCurrentJob();
  const saved = await api.upsertDiscoverRoleCurrentJob('Founder');
  const cleared = await api.deleteDiscoverRoleCurrentJob();

  assert.deepEqual(
    calls.map((call) => call.path),
    [
      '/api/astrology/discover-roles/current-job',
      '/api/astrology/discover-roles/current-job',
      '/api/astrology/discover-roles/current-job',
    ],
  );
  assert.equal(fetched?.matchedRole?.slug, 'product-manager');
  assert.equal(calls[1]?.init?.method, 'PUT');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).title, 'Founder');
  assert.equal(saved?.title, 'Founder');
  assert.equal(calls[2]?.init?.method, 'DELETE');
  assert.equal(cleared, null);
});

test('astrology api shortlist endpoints use expected paths and normalize payload', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      if (path === '/api/astrology/discover-roles/shortlist') {
        return new Response(
          JSON.stringify([
            {
              slug: 'product-manager',
              role: 'Product Manager',
              domain: 'Product & Strategy',
              scoreLabel: '91%',
              scoreValue: 91,
              tags: ['strategy', 'execution'],
              market: {
                occupation: { title: 'Product Managers' },
                labels: { marketScore: 'steady market', salaryVisibility: 'market_estimate' },
              },
              detail: {
                whyFit: {
                  summary: 'Strong strategic fit.',
                  bullets: ['Communication and prioritization matter.'],
                  topTraits: ['Communication'],
                },
                realityCheck: {
                  summary: 'Expect messy tradeoffs.',
                  tasks: ['Align product bets.'],
                  workContext: ['Cross-functional teams.'],
                  toolThemes: ['Roadmapping'],
                },
                entryBarrier: {
                  level: 'moderate',
                  label: 'Moderate Entry Barrier',
                  summary: 'Adjacent product or ops proof helps.',
                  signals: ['Portfolio and stakeholder judgment matter.'],
                },
                transitionMap: [
                  {
                    lane: 'best_match',
                    label: 'Best Match',
                    summary: 'The cleanest adjacent move from your fit profile.',
                    role: {
                      slug: 'operations-manager',
                      title: 'Operations Manager',
                      domain: 'Product & Strategy',
                      fitScore: 79,
                      fitLabel: '79% fit',
                      barrier: {
                        level: 'moderate',
                        label: 'Moderate Entry Barrier',
                      },
                    },
                  },
                ],
                bestAlternative: {
                  headline: 'Lower-friction alternative',
                  summary: 'Operations Manager may be the stronger immediate bet.',
                  reasons: ['Entry friction is lower than Product Manager.'],
                  role: {
                    slug: 'operations-manager',
                    title: 'Operations Manager',
                    domain: 'Product & Strategy',
                    fitScore: 79,
                    fitLabel: '79% fit',
                    barrier: {
                      level: 'moderate',
                      label: 'Moderate Entry Barrier',
                    },
                  },
                },
              },
              savedAt: '2026-04-24T00:00:00.000Z',
            },
          ]),
          { status: 200 },
        );
      }
      if (init?.method === 'PUT') {
        return new Response(
          JSON.stringify({
            slug: 'product-manager',
            role: 'Product Manager',
            domain: 'Product & Strategy',
            scoreLabel: '91%',
            scoreValue: 91,
            tags: ['strategy', 'execution'],
            market: null,
            detail: {
              whyFit: {
                summary: 'Strong strategic fit.',
                bullets: ['Communication and prioritization matter.'],
                topTraits: ['Communication'],
              },
              realityCheck: {
                summary: 'Expect messy tradeoffs.',
                tasks: ['Align product bets.'],
                workContext: ['Cross-functional teams.'],
                toolThemes: ['Roadmapping'],
              },
              entryBarrier: {
                level: 'moderate',
                label: 'Moderate Entry Barrier',
                summary: 'Adjacent product or ops proof helps.',
                signals: ['Portfolio and stakeholder judgment matter.'],
              },
              transitionMap: [],
              bestAlternative: null,
            },
            savedAt: '2026-04-24T00:00:00.000Z',
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ deleted: true, slug: 'product-manager' }), { status: 200 });
    },
    parseJsonBody: async (response) => JSON.parse(await response.text()),
    ApiError: FakeApiError as never,
  });

  const shortlist = await api.fetchDiscoverRoleShortlist();
  const saved = await api.upsertDiscoverRoleShortlistEntry({
    slug: 'product-manager',
    role: 'Product Manager',
    domain: 'Product & Strategy',
    scoreLabel: '91%',
    scoreValue: 91,
    tags: ['strategy', 'execution'],
    market: null,
    detail: {
      whyFit: {
        summary: 'Strong strategic fit.',
        bullets: ['Communication and prioritization matter.'],
        topTraits: ['Communication'],
      },
      realityCheck: {
        summary: 'Expect messy tradeoffs.',
        tasks: ['Align product bets.'],
        workContext: ['Cross-functional teams.'],
        toolThemes: ['Roadmapping'],
      },
      entryBarrier: {
        level: 'moderate',
        label: 'Moderate Entry Barrier',
        summary: 'Adjacent product or ops proof helps.',
        signals: ['Portfolio and stakeholder judgment matter.'],
      },
      transitionMap: [
        {
          lane: 'best_match',
          label: 'Best Match',
          summary: 'The cleanest adjacent move from your fit profile.',
          role: {
            slug: 'operations-manager',
            title: 'Operations Manager',
            domain: 'Product & Strategy',
            fitScore: 79,
            fitLabel: '79% fit',
            barrier: {
              level: 'moderate',
              label: 'Moderate Entry Barrier',
            },
          },
        },
      ],
      bestAlternative: {
        headline: 'Lower-friction alternative',
        summary: 'Operations Manager may be the stronger immediate bet.',
        reasons: ['Entry friction is lower than Product Manager.'],
        role: {
          slug: 'operations-manager',
          title: 'Operations Manager',
          domain: 'Product & Strategy',
          fitScore: 79,
          fitLabel: '79% fit',
          barrier: {
            level: 'moderate',
            label: 'Moderate Entry Barrier',
          },
        },
      },
    },
    savedAt: '2026-04-24T00:00:00.000Z',
  });
  const deleted = await api.deleteDiscoverRoleShortlistEntry('product-manager');

  assert.deepEqual(
    calls.map((call) => call.path),
    [
      '/api/astrology/discover-roles/shortlist',
      '/api/astrology/discover-roles/shortlist/product-manager',
      '/api/astrology/discover-roles/shortlist/product-manager',
    ],
  );
  assert.equal(shortlist[0]?.market?.occupation.title, 'Product Managers');
  assert.equal(shortlist[0]?.detail?.entryBarrier.label, 'Moderate Entry Barrier');
  assert.equal(shortlist[0]?.detail?.bestAlternative?.role.slug, 'operations-manager');
  assert.equal(saved.slug, 'product-manager');
  assert.equal(saved.detail?.whyFit.topTraits[0], 'Communication');
  assert.equal(calls[1]?.init?.method, 'PUT');
  assert.equal(calls[2]?.init?.method, 'DELETE');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).savedAt, '2026-04-24T00:00:00.000Z');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).detail.entryBarrier.level, 'moderate');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).detail.bestAlternative.role.slug, 'operations-manager');
  assert.equal(deleted.deleted, true);
});
