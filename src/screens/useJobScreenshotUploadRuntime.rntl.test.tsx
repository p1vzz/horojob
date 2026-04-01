import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';
import type { AppNavigationProp, AppRouteProp } from '../types/navigation';
import { useJobScreenshotUploadRuntime } from './useJobScreenshotUploadRuntime';

jest.mock('../services/authSession', () => ({
  ApiError: class FakeApiError extends Error {
    status: number;
    payload: unknown;

    constructor(status: number, message: string, payload: unknown) {
      super(message);
      this.status = status;
      this.payload = payload;
    }
  },
}));

type RuntimeDeps = NonNullable<Parameters<typeof useJobScreenshotUploadRuntime>[0]['deps']>;

function createAnalyzeResult(): JobAnalyzeSuccessResponse {
  return {
    analysisId: 'analysis-1',
    status: 'done',
    providerUsed: 'screenshot_vision',
    cached: false,
    cache: {
      raw: false,
      parsed: false,
      analysis: false,
    },
    usage: {
      plan: 'premium',
      incremented: true,
    },
    versions: {
      parserVersion: 'parser-1',
      rubricVersion: 'rubric-1',
      modelVersion: 'model-1',
    },
    scores: {
      compatibility: 91,
      aiReplacementRisk: 14,
      overall: 85,
    },
    breakdown: [],
    jobSummary: 'summary',
    tags: ['remote'],
    descriptors: [],
    job: {
      title: 'Product Manager',
      company: 'Acme',
      location: 'Remote',
      employmentType: 'full_time',
      source: 'linkedin',
    },
    screenshot: {
      imageCount: 2,
      confidence: 0.82,
      reason: 'High confidence',
    },
  };
}

function createNavigationMock() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
  } as unknown as AppNavigationProp<'JobScreenshotUpload'>;
}

function createPermissionResult(granted: boolean) {
  return {
    granted,
    status: granted ? 'granted' : 'denied',
    expires: 'never',
    canAskAgain: !granted,
  };
}

function createRouteMock(failedUrl = 'https://example.com/jobs/blocked') {
  return {
    key: 'JobScreenshotUpload-test',
    name: 'JobScreenshotUpload',
    params: {
      failedUrl,
    },
  } as AppRouteProp<'JobScreenshotUpload'>;
}

function RuntimeHarness(props: {
  deps: RuntimeDeps;
  navigation: AppNavigationProp<'JobScreenshotUpload'>;
  route: AppRouteProp<'JobScreenshotUpload'>;
}) {
  const runtime = useJobScreenshotUploadRuntime({
    deps: props.deps,
    navigation: props.navigation,
    route: props.route,
  });

  return (
    <View>
      <Text>{`items:${runtime.items.length}`}</Text>
      <Text>{`loading:${runtime.isLoading}`}</Text>
      <Text>{`error:${runtime.errorText ?? 'none'}`}</Text>
      <Pressable onPress={() => void runtime.pickScreenshots()}>
        <Text>Pick screenshots</Text>
      </Pressable>
      <Pressable onPress={() => void runtime.onAnalyzePress()}>
        <Text>Analyze screenshots</Text>
      </Pressable>
      {runtime.items.map((item) => (
        <Pressable key={item.id} onPress={() => runtime.removeScreenshot(item.id)}>
          <Text>{`Remove ${item.id}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

test('screenshot runtime shows permission error when gallery access is denied', async () => {
  const navigation = createNavigationMock();

  render(
    <RuntimeHarness
      navigation={navigation}
      route={createRouteMock()}
      deps={{
        requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
          ...createPermissionResult(false),
        })) as unknown as RuntimeDeps['requestMediaLibraryPermissionsAsync'],
        launchImageLibraryAsync: jest.fn() as RuntimeDeps['launchImageLibraryAsync'],
        analyzeJobScreenshots: jest.fn() as RuntimeDeps['analyzeJobScreenshots'],
      }}
    />
  );

  fireEvent.press(screen.getByText('Pick screenshots'));

  await waitFor(() =>
    expect(screen.getByText('error:Media permission is required to upload screenshots.')).toBeTruthy()
  );
});

test('screenshot runtime reports unreadable picker assets and does not add items', async () => {
  const navigation = createNavigationMock();

  render(
    <RuntimeHarness
      navigation={navigation}
      route={createRouteMock()}
      deps={{
        requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
          ...createPermissionResult(true),
        })) as unknown as RuntimeDeps['requestMediaLibraryPermissionsAsync'],
        launchImageLibraryAsync: jest.fn(async () => ({
          canceled: false,
          assets: [
            {
              uri: 'file:///shot-1.png',
            },
          ],
        })) as unknown as RuntimeDeps['launchImageLibraryAsync'],
        analyzeJobScreenshots: jest.fn() as RuntimeDeps['analyzeJobScreenshots'],
      }}
    />
  );

  fireEvent.press(screen.getByText('Pick screenshots'));

  await waitFor(() =>
    expect(screen.getByText('error:Could not read selected images. Please try different screenshots.')).toBeTruthy()
  );
  expect(screen.getByText('items:0')).toBeTruthy();
});

test('screenshot runtime picks screenshots and navigates back to scanner on successful analyze', async () => {
  const navigation = createNavigationMock();
  const analyzeJobScreenshots = jest.fn(async () => createAnalyzeResult());

  render(
    <RuntimeHarness
      navigation={navigation}
      route={createRouteMock('https://blocked.example/jobs/123')}
      deps={{
        requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
          ...createPermissionResult(true),
        })) as unknown as RuntimeDeps['requestMediaLibraryPermissionsAsync'],
        launchImageLibraryAsync: jest.fn(async () => ({
          canceled: false,
          assets: [
            {
              uri: 'file:///shot-1.png',
              base64: 'YWJj',
              mimeType: 'image/png',
              fileSize: 3000,
            },
          ],
        })) as unknown as RuntimeDeps['launchImageLibraryAsync'],
        analyzeJobScreenshots: analyzeJobScreenshots as RuntimeDeps['analyzeJobScreenshots'],
        now: () => 123,
        random: () => 0.5,
      }}
    />
  );

  fireEvent.press(screen.getByText('Pick screenshots'));
  await waitFor(() => expect(screen.getByText('items:1')).toBeTruthy());

  fireEvent.press(screen.getByText('Analyze screenshots'));

  await waitFor(() => expect(analyzeJobScreenshots).toHaveBeenCalledWith(['data:image/png;base64,YWJj']));
  await waitFor(() =>
    expect((navigation as unknown as { navigate: jest.Mock }).navigate).toHaveBeenCalledWith('Scanner', {
      importedAnalysis: createAnalyzeResult(),
      importedMeta: {
        source: 'linkedin',
        cached: false,
        provider: 'screenshot_vision',
      },
      importedUrl: 'https://blocked.example/jobs/123',
    })
  );
});

test('screenshot runtime maps API analyze failure into UI error text', async () => {
  const navigation = createNavigationMock();

  render(
    <RuntimeHarness
      navigation={navigation}
      route={createRouteMock()}
      deps={{
        requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
          ...createPermissionResult(true),
        })) as unknown as RuntimeDeps['requestMediaLibraryPermissionsAsync'],
        launchImageLibraryAsync: jest.fn(async () => ({
          canceled: false,
          assets: [
            {
              uri: 'file:///shot-1.png',
              base64: 'YWJj',
              mimeType: 'image/png',
            },
          ],
        })) as unknown as RuntimeDeps['launchImageLibraryAsync'],
        analyzeJobScreenshots: jest.fn(async () => {
          throw {
            status: 422,
            payload: {
              code: 'screenshot_incomplete_info',
              missingFields: ['title', 'company'],
            },
          };
        }) as RuntimeDeps['analyzeJobScreenshots'],
        isApiError: (value): value is { status: number; payload: unknown } =>
          Boolean(value && typeof value === 'object' && 'status' in value && 'payload' in value),
      }}
    />
  );

  fireEvent.press(screen.getByText('Pick screenshots'));
  await waitFor(() => expect(screen.getByText('items:1')).toBeTruthy());

  fireEvent.press(screen.getByText('Analyze screenshots'));

  await waitFor(() =>
    expect(
      screen.getByText('error:Not enough vacancy details are visible in screenshots. Missing: title, company.')
    ).toBeTruthy()
  );
});
