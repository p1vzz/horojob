import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveAppEnvironment,
  shouldAllowDevelopmentOverrides,
  shouldExposeTechnicalSurfaces,
} from './appEnvironment';

test('app environment resolves explicit aliases', () => {
  assert.equal(resolveAppEnvironment('dev', false), 'development');
  assert.equal(resolveAppEnvironment(' preview ', false), 'staging');
  assert.equal(resolveAppEnvironment('prod', true), 'production');
});

test('app environment falls back to runtime development flag when unset or unknown', () => {
  assert.equal(resolveAppEnvironment(undefined, true), 'development');
  assert.equal(resolveAppEnvironment('', false), 'production');
  assert.equal(resolveAppEnvironment('unknown', true), 'development');
  assert.equal(resolveAppEnvironment('unknown', false), 'production');
});

test('technical surfaces are hidden only in production app environment', () => {
  assert.equal(shouldExposeTechnicalSurfaces('development'), true);
  assert.equal(shouldExposeTechnicalSurfaces('staging'), true);
  assert.equal(shouldExposeTechnicalSurfaces('production'), false);
});

test('development overrides are limited to development app environment', () => {
  assert.equal(shouldAllowDevelopmentOverrides('development'), true);
  assert.equal(shouldAllowDevelopmentOverrides('staging'), false);
  assert.equal(shouldAllowDevelopmentOverrides('production'), false);
});
