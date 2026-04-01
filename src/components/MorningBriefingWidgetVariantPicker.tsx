import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MorningBriefingResponse } from '../services/astrologyApi';
import {
  MORNING_BRIEFING_WIDGET_VARIANTS,
  getMorningBriefingWidgetVariantOption,
  type MorningBriefingWidgetVariantId,
} from '../services/morningBriefingWidgetVariants';

type Props = {
  visible: boolean;
  selectedVariantId: MorningBriefingWidgetVariantId;
  briefing: MorningBriefingResponse | null;
  onSelectVariant: (variantId: MorningBriefingWidgetVariantId) => void;
  onConfirm: () => void;
  onClose: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toPeakWindow(briefing: MorningBriefingResponse | null) {
  const energy = briefing?.metrics.energy ?? 78;
  const focus = briefing?.metrics.focus ?? 69;
  const luck = briefing?.metrics.luck ?? 74;
  const dateSeed = Number((briefing?.dateKey ?? '').slice(-2)) || 11;
  const startHour24 = 9 + ((energy + focus + luck + dateSeed) % 9);
  const endHour24 = clamp(startHour24 + 2, 11, 21);

  const to12h = (hour24: number) => {
    const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour}`;
  };

  return `${to12h(startHour24)}-${to12h(endHour24)} ${endHour24 >= 12 ? 'PM' : 'AM'}`;
}

function toPreviewMetrics(briefing: MorningBriefingResponse | null) {
  const energy = briefing?.metrics.energy ?? 72;
  const focus = briefing?.metrics.focus ?? 69;
  const ai = briefing?.metrics.aiSynergy ?? 85;
  const luck = briefing?.metrics.luck ?? 74;
  const delta = clamp(Math.round((energy + focus + ai) / 3 - 70), -25, 25);
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta}%`;
  const trendLabel = delta > 2 ? 'Rising' : delta < -2 ? 'Cooling' : 'Steady';
  const moonLabel = ['New', 'Waxing', 'Quarter', 'Gibbous', 'Full'][Math.abs((energy + focus + ai + luck) % 5)];
  return {
    energy,
    ai,
    deltaLabel,
    trendLabel,
    moonLabel,
    peakWindow: toPeakWindow(briefing),
  };
}

function SmallPreview({
  variantId,
  briefing,
}: {
  variantId: MorningBriefingWidgetVariantId;
  briefing: MorningBriefingResponse | null;
}) {
  const metrics = toPreviewMetrics(briefing);
  if (variantId === 'small_vibe') {
    return (
      <View className="h-[96px] w-[96px] rounded-[22px] items-center justify-center" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
        <Text className="text-[12px] font-semibold" style={{ color: '#E9D26A' }}>
          Career Vibe
        </Text>
        <Text className="text-[29px] font-bold mt-1" style={{ color: '#F6F7FB' }}>
          {metrics.deltaLabel}
        </Text>
        <Text className="text-[11px] mt-1" style={{ color: '#35C58A' }}>
          {metrics.trendLabel}
        </Text>
      </View>
    );
  }

  if (variantId === 'small_score') {
    return (
      <View className="h-[96px] w-[96px] rounded-[22px] px-3 py-2.5" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
        <Text className="text-[9px] font-semibold" style={{ color: '#A08CFF' }}>
          TODAY
        </Text>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[32px] font-bold" style={{ color: '#F6D76E' }}>
            {metrics.ai}
          </Text>
          <Text className="text-[10px]" style={{ color: '#AAB0C7' }}>
            Career Score
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[8px]" style={{ color: '#99A1BC' }}>
            {metrics.moonLabel}
          </Text>
          <Text className="text-[8px]" style={{ color: '#E9D26A' }}>
            Mercury Rx
          </Text>
        </View>
      </View>
    );
  }

  if (variantId === 'small_energy_arc') {
    return (
      <View className="h-[96px] w-[96px] rounded-[22px] px-3 py-3" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
        <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <View className="h-full" style={{ width: `${metrics.energy}%`, backgroundColor: '#47C77C' }} />
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[35px] font-bold" style={{ color: '#F6F7FB' }}>
            {metrics.energy}
          </Text>
          <Text className="text-[10px]" style={{ color: '#99A1BC' }}>
            Energy Level
          </Text>
          <Text className="text-[9px] mt-0.5" style={{ color: '#35C58A' }}>
            +{Math.max(1, Math.round(metrics.energy / 12))} from yesterday
          </Text>
        </View>
      </View>
    );
  }

  if (variantId === 'small_energy_value') {
    return (
      <View className="h-[96px] w-[96px] rounded-[22px] items-center justify-center" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
        <Text className="text-[11px] font-semibold" style={{ color: '#F6D76E' }}>
          Career Energy
        </Text>
        <Text className="text-[34px] font-bold mt-1" style={{ color: '#F28E35' }}>
          {metrics.energy}
          <Text className="text-[18px] font-semibold" style={{ color: '#39C07F' }}>
            {' '}
            / 100
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View className="h-[96px] w-[96px] rounded-[22px] items-center justify-center" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
      <View
        className="w-[70px] h-[70px] rounded-full items-center justify-center"
        style={{
          borderWidth: 6,
          borderColor: '#6BD57F',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      >
        <Text className="text-[28px] font-bold" style={{ color: '#F6F7FB' }}>
          {metrics.ai}
        </Text>
      </View>
      <Text className="text-[9px] font-semibold mt-1" style={{ color: '#E9D26A' }}>
        CAREER SCORE
      </Text>
    </View>
  );
}

function MediumPreview({ briefing }: { briefing: MorningBriefingResponse | null }) {
  const metrics = toPreviewMetrics(briefing);
  return (
    <View className="h-[92px] w-full rounded-[20px] px-3 py-2.5" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-[14px] font-semibold" style={{ color: '#F6F7FB' }}>
            Today's Career Vibe
          </Text>
          <Text className="text-[10px]" style={{ color: '#99A1BC' }}>
            {briefing?.dateKey ?? '2026-03-20'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[29px] font-bold" style={{ color: '#E8A04A' }}>
            {metrics.deltaLabel}
          </Text>
          <Text className="text-[11px]" style={{ color: '#35C58A' }}>
            {metrics.trendLabel}
          </Text>
        </View>
      </View>
      <Text className="text-[12px] mt-1 leading-[16px]" numberOfLines={2} style={{ color: '#C5CADD' }}>
        {briefing?.summary ?? 'Mercury trines your natal Sun. Excellent for presentations and collaboration.'}
      </Text>
    </View>
  );
}

function StripPreview({
  variantId,
  briefing,
}: {
  variantId: MorningBriefingWidgetVariantId;
  briefing: MorningBriefingResponse | null;
}) {
  const metrics = toPreviewMetrics(briefing);
  if (variantId === 'strip_peak') {
    return (
      <View className="h-[52px] w-full rounded-[16px] px-2.5 py-2 flex-row items-center" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
        <View className="w-7 h-7 rounded-full items-center justify-center mr-2" style={{ backgroundColor: 'rgba(245,202,88,0.18)' }}>
          <Text style={{ color: '#E9D26A' }}>☀</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-[14px] font-semibold" style={{ color: '#F6F7FB' }}>
              Career Vibe
            </Text>
            <Text className="text-[10px] font-semibold ml-2 px-1.5 py-0.5 rounded-full" style={{ color: '#35C58A', backgroundColor: 'rgba(53,197,138,0.18)' }}>
              {metrics.deltaLabel}
            </Text>
          </View>
          <Text className="text-[10px]" numberOfLines={1} style={{ color: '#A9B0C8' }}>
            {briefing?.summary ?? 'Mercury trines Sun - great for presentations.'}
          </Text>
        </View>
        <View className="items-end ml-2">
          <Text className="text-[8px]" style={{ color: '#8E96B0' }}>
            Peak
          </Text>
          <Text className="text-[16px] font-bold" style={{ color: '#E9D26A' }}>
            {metrics.peakWindow}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="h-[52px] w-full rounded-[16px] px-2.5 py-2 flex-row items-center" style={{ backgroundColor: 'rgba(12,16,34,0.9)' }}>
      <View className="w-7 h-7 rounded-full items-center justify-center mr-2" style={{ backgroundColor: 'rgba(245,202,88,0.18)' }}>
        <Text style={{ color: '#E9D26A' }}>☀</Text>
      </View>
      <Text className="flex-1 text-[14px] font-semibold" style={{ color: '#F6F7FB' }}>
        Career Vibe
      </Text>
      <Text className="text-[29px] font-bold mr-2" style={{ color: '#E8A04A' }}>
        {metrics.deltaLabel}
      </Text>
      <Text className="text-[15px] font-semibold" style={{ color: '#A9B0C8' }}>
        {metrics.peakWindow}
      </Text>
    </View>
  );
}

function VariantPreview({ variantId, briefing }: { variantId: MorningBriefingWidgetVariantId; briefing: MorningBriefingResponse | null }) {
  if (variantId.startsWith('small_')) {
    return <SmallPreview variantId={variantId} briefing={briefing} />;
  }
  if (variantId === 'medium_vibe') {
    return <MediumPreview briefing={briefing} />;
  }
  return <StripPreview variantId={variantId} briefing={briefing} />;
}

export function MorningBriefingWidgetVariantPicker({
  visible,
  selectedVariantId,
  briefing,
  onSelectVariant,
  onConfirm,
  onClose,
}: Props) {
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <Pressable style={styles.overlayBackdrop} onPress={onClose} />
      <View className="flex-1 justify-end px-4 pb-7">
        <View
          className="max-h-[84%] rounded-[24px] overflow-hidden"
          style={{
            backgroundColor: 'rgba(15,19,36,0.98)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
          }}
        >
          <View className="px-4 pt-4 pb-3">
            <Text className="text-[18px] font-semibold" style={{ color: 'rgba(240,242,250,0.98)' }}>
              Widget Styles
            </Text>
            <Text className="text-[12px] mt-1" style={{ color: 'rgba(200,205,222,0.62)' }}>
              Choose one style before Android pin flow. Widget light palette matches the app light direction.
            </Text>
          </View>

          <ScrollView
            className="px-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {MORNING_BRIEFING_WIDGET_VARIANTS.map((variant) => {
              const selected = variant.id === selectedVariantId;
              return (
                <Pressable
                  key={variant.id}
                  onPress={() => onSelectVariant(variant.id)}
                  className="rounded-[18px] p-3 mb-3"
                  style={{
                    backgroundColor: selected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: selected ? 'rgba(201,168,76,0.56)' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1 pr-3">
                      <Text className="text-[14px] font-semibold" style={{ color: 'rgba(240,242,250,0.95)' }}>
                        {variant.title}
                      </Text>
                      <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(200,205,222,0.62)' }}>
                        {variant.subtitle}
                      </Text>
                    </View>
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: selected ? 'rgba(201,168,76,0.24)' : 'rgba(255,255,255,0.08)' }}
                    >
                      <Text
                        className="text-[10px] font-semibold tracking-[0.7px]"
                        style={{ color: selected ? '#D3B15D' : 'rgba(200,205,222,0.7)' }}
                      >
                        {variant.sizeLabel}
                      </Text>
                    </View>
                  </View>
                  <VariantPreview variantId={variant.id} briefing={briefing} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="px-4 pb-4 pt-2 flex-row">
            <Pressable
              onPress={onClose}
              className="flex-1 h-[44px] rounded-[12px] items-center justify-center mr-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text className="text-[13px] font-semibold" style={{ color: 'rgba(220,224,238,0.8)' }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 h-[44px] rounded-[12px] items-center justify-center"
              style={{
                backgroundColor: 'rgba(201,168,76,0.22)',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.45)',
              }}
            >
              <Text className="text-[13px] font-semibold" style={{ color: '#D3B15D' }}>
                Use Selected Style
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export function currentMorningBriefingVariantLabel(variantId: MorningBriefingWidgetVariantId) {
  const variant = getMorningBriefingWidgetVariantOption(variantId);
  return `${variant.title} (${variant.sizeLabel})`;
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
    elevation: 1200,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,5,12,0.72)',
  },
});
