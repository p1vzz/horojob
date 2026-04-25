import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveDiscoverRoleScoreLabel,
  resolveDiscoverRoleScoreTone,
  resolveDiscoverRoleScoreValue,
  shouldShowDiscoverRoleLoadingCard,
} from './discoverRolesScreenCore';

test('resolveDiscoverRoleScoreValue prefers numeric score and can parse a percent label', () => {
  assert.equal(resolveDiscoverRoleScoreValue(87, '87%'), 87);
  assert.equal(resolveDiscoverRoleScoreValue(null, '72% fit'), 72);
  assert.equal(resolveDiscoverRoleScoreValue(undefined, 'n/a'), null);
});

test('resolveDiscoverRoleScoreLabel prefers explicit label and falls back to rounded score value', () => {
  assert.equal(resolveDiscoverRoleScoreLabel('91%', 91), '91%');
  assert.equal(resolveDiscoverRoleScoreLabel(null, 88.4), '88%');
  assert.equal(resolveDiscoverRoleScoreLabel(undefined, null), null);
});

test('resolveDiscoverRoleScoreTone applies the shared gold green gray red thresholds', () => {
  assert.deepEqual(resolveDiscoverRoleScoreTone(92), {
    textColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.18)',
  });
  assert.deepEqual(resolveDiscoverRoleScoreTone(77), {
    textColor: '#38CC88',
    backgroundColor: 'rgba(56,204,136,0.16)',
  });
  assert.deepEqual(resolveDiscoverRoleScoreTone(52), {
    textColor: 'rgba(212,212,224,0.78)',
    backgroundColor: 'rgba(212,212,224,0.12)',
  });
  assert.deepEqual(resolveDiscoverRoleScoreTone(18), {
    textColor: '#F58AA7',
    backgroundColor: 'rgba(245,138,167,0.16)',
  });
});

test('shouldShowDiscoverRoleLoadingCard stays visible until score, market, and detail are all ready', () => {
  assert.equal(
    shouldShowDiscoverRoleLoadingCard({
      isResolving: true,
      scoreLabel: null,
      hasMarket: false,
      hasDetail: false,
    }),
    true,
  );

  assert.equal(
    shouldShowDiscoverRoleLoadingCard({
      isResolving: true,
      scoreLabel: '84%',
      hasMarket: true,
      hasDetail: true,
    }),
    false,
  );

  assert.equal(
    shouldShowDiscoverRoleLoadingCard({
      isResolving: false,
      scoreLabel: null,
      hasMarket: false,
      hasDetail: false,
    }),
    false,
  );
});
