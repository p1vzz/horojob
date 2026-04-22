import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiBaseUrl } from './apiCore';

test('API base URL keeps local fallback for development builds', () => {
  assert.equal(
    resolveApiBaseUrl({
      appEnvironment: 'development',
      configuredBaseUrl: undefined,
      platformOS: 'android',
    }),
    'http://10.0.2.2:8787',
  );
  assert.equal(
    resolveApiBaseUrl({
      appEnvironment: 'development',
      configuredBaseUrl: undefined,
      platformOS: 'ios',
    }),
    'http://localhost:8787',
  );
});

test('API base URL requires explicit configuration outside development', () => {
  assert.throws(
    () =>
      resolveApiBaseUrl({
        appEnvironment: 'production',
        configuredBaseUrl: undefined,
        platformOS: 'ios',
      }),
    /EXPO_PUBLIC_API_BASE_URL must be set/,
  );
});

test('API base URL requires https outside development', () => {
  assert.throws(
    () =>
      resolveApiBaseUrl({
        appEnvironment: 'staging',
        configuredBaseUrl: 'http://api.example.com',
        platformOS: 'ios',
      }),
    /must use https/,
  );
});

test('API base URL normalizes configured https URLs', () => {
  assert.equal(
    resolveApiBaseUrl({
      appEnvironment: 'production',
      configuredBaseUrl: ' https://api.example.com/ ',
      platformOS: 'android',
    }),
    'https://api.example.com',
  );
});
