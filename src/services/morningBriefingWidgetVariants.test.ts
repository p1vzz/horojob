import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
  MORNING_BRIEFING_WIDGET_VARIANTS,
  getMorningBriefingWidgetVariantOption,
  isMorningBriefingWidgetVariantId,
} from './morningBriefingWidgetVariants';

test('widget variants validates known ids', () => {
  assert.equal(isMorningBriefingWidgetVariantId('medium_vibe'), true);
  assert.equal(isMorningBriefingWidgetVariantId('unknown_variant'), false);
});

test('widget variants returns concrete option for default id', () => {
  const option = getMorningBriefingWidgetVariantOption(DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT);
  assert.equal(option.id, DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT);
  assert.ok(MORNING_BRIEFING_WIDGET_VARIANTS.some((entry) => entry.id === option.id));
});
