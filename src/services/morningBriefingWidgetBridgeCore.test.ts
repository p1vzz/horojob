import assert from 'node:assert/strict';
import test from 'node:test';
import { createMorningBriefingWidgetBridge } from './morningBriefingWidgetBridgeCore';

test('widget bridge returns false when platform is not android', async () => {
  const bridge = createMorningBriefingWidgetBridge({
    platformOs: 'ios',
    defaultVariantId: 'medium_vibe',
    getNativeModule: () => ({
      syncMorningBriefing: async () => true,
      markLocked: async () => true,
      markProfileMissing: async () => true,
      clearWidget: async () => true,
      requestPinWidget: async () => true,
      hasWidgetInstance: async () => true,
    }),
  });

  assert.equal(await bridge.syncMorningBriefingWidget({ dateKey: '2026-03-30' }), false);
  assert.equal(await bridge.setMorningBriefingWidgetLocked(), false);
  assert.equal(await bridge.setMorningBriefingWidgetProfileMissing(), false);
  assert.equal(await bridge.clearMorningBriefingWidget(), false);
  assert.equal(await bridge.requestPinMorningBriefingWidget(), false);
  assert.equal(await bridge.hasMorningBriefingWidgetInstance(), false);
});

test('widget bridge sync serializes payload and catches runtime errors', async () => {
  const payloads: string[] = [];
  const okBridge = createMorningBriefingWidgetBridge({
    platformOs: 'android',
    defaultVariantId: 'medium_vibe',
    getNativeModule: () => ({
      syncMorningBriefing: async (payloadJson) => {
        payloads.push(payloadJson);
        return true;
      },
      markLocked: async () => true,
      markProfileMissing: async () => true,
      clearWidget: async () => true,
      requestPinWidget: async () => true,
      hasWidgetInstance: async () => true,
    }),
  });

  const ok = await okBridge.syncMorningBriefingWidget({ dateKey: '2026-03-30', metrics: { energy: 80 } });
  assert.equal(ok, true);
  assert.equal(payloads.length, 1);
  assert.ok(payloads[0].includes('"dateKey":"2026-03-30"'));

  const failBridge = createMorningBriefingWidgetBridge({
    platformOs: 'android',
    defaultVariantId: 'medium_vibe',
    getNativeModule: () => ({
      syncMorningBriefing: async () => {
        throw new Error('native failure');
      },
      markLocked: async () => true,
      markProfileMissing: async () => true,
      clearWidget: async () => true,
      requestPinWidget: async () => true,
      hasWidgetInstance: async () => true,
    }),
  });
  assert.equal(await failBridge.syncMorningBriefingWidget({ dateKey: '2026-03-30' }), false);
});

test('widget bridge pin request and instance checks use variant methods when available', async () => {
  const calls: string[] = [];
  const bridge = createMorningBriefingWidgetBridge({
    platformOs: 'android',
    defaultVariantId: 'small_vibe',
    getNativeModule: () => ({
      syncMorningBriefing: async () => true,
      markLocked: async () => true,
      markProfileMissing: async () => true,
      clearWidget: async () => true,
      requestPinWidget: async () => {
        calls.push('pin:fallback');
        return true;
      },
      requestPinWidgetVariant: async (variantId) => {
        calls.push(`pin:variant:${variantId}`);
        return true;
      },
      hasWidgetInstance: async () => {
        calls.push('has:fallback');
        return true;
      },
      hasWidgetInstanceForVariant: async (variantId) => {
        calls.push(`has:variant:${variantId}`);
        return true;
      },
    }),
  });

  assert.equal(await bridge.requestPinMorningBriefingWidget(), true);
  assert.equal(await bridge.requestPinMorningBriefingWidget('strip_peak'), true);
  assert.equal(await bridge.hasMorningBriefingWidgetInstance(), true);
  assert.equal(await bridge.hasMorningBriefingWidgetInstance('strip_peak'), true);

  assert.deepEqual(calls, [
    'pin:variant:small_vibe',
    'pin:variant:strip_peak',
    'has:fallback',
    'has:variant:strip_peak',
  ]);
});

test('widget bridge falls back to legacy methods when variant methods are missing', async () => {
  const calls: string[] = [];
  const bridge = createMorningBriefingWidgetBridge({
    platformOs: 'android',
    defaultVariantId: 'medium_vibe',
    getNativeModule: () => ({
      syncMorningBriefing: async () => true,
      markLocked: async () => true,
      markProfileMissing: async () => true,
      clearWidget: async () => true,
      requestPinWidget: async () => {
        calls.push('pin:fallback');
        return true;
      },
      hasWidgetInstance: async () => {
        calls.push('has:fallback');
        return true;
      },
    }),
  });

  assert.equal(await bridge.requestPinMorningBriefingWidget('strip_peak'), true);
  assert.equal(await bridge.hasMorningBriefingWidgetInstance('strip_peak'), true);
  assert.deepEqual(calls, ['pin:fallback', 'has:fallback']);
});
