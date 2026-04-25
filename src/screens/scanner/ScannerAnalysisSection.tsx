import React from 'react';
import { ActivityIndicator, Pressable, View, Text } from 'react-native';
import type { JobAnalyzeSuccessResponse } from '../../services/jobsApi';
import { MatchScoreGauge } from '../../components/MatchScoreGauge';
import { ScannerRing } from '../../components/ScannerRing';
import { AiRiskMeter } from '../../components/AiRiskMeter';
import { JobProfileCard } from '../../components/JobProfileCard';
import { CompatibilityBreakdown } from '../../components/CompatibilityBreakdown';
import { MarketSnapshotCard } from '../../components/MarketSnapshotCard';
import { MarketSourceFooter } from '../../components/MarketSourceFooter';
import { PremiumScansCard } from '../../components/PremiumScansCard';
import { ScanDepthBadge } from '../../components/ScanDepthBadge';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../../utils/brightnessAdaptation';
import { formatScreenshotConfidence } from '../scannerUtilsCore';

type ScannerAnalysisSectionProps = {
  analysis: JobAnalyzeSuccessResponse | null;
  isLoading?: boolean;
  onRunFullAnalysis?: () => void;
};

export function ScannerAnalysisSection(props: ScannerAnalysisSectionProps) {
  const { analysis, isLoading = false, onRunFullAnalysis } = props;
  const { channels } = useBrightnessAdaptation();
  if (!analysis) {
    return null;
  }

  const compatibilityScore = analysis.scores.compatibility ?? 0;
  const overallScore = analysis.scores.overall ?? 0;
  const aiRisk = analysis.scores.aiReplacementRisk ?? 0;
  const isLite = analysis.scanDepth === 'lite';

  return (
    <>
      <View className="px-5 mt-6 mb-1 flex-row justify-end">
        <ScanDepthBadge depth={analysis.scanDepth} />
      </View>

      <View className="items-center mt-8 mb-2">
        <Text
          className="text-[11px] uppercase tracking-[2.5px] mb-3"
          style={{ color: adaptColorOpacity('rgba(201,168,76,0.7)', channels.textOpacityMultiplier) }}
        >
          NATAL ALIGNMENT
        </Text>
        {isLite ? (
          <LockedFullPreview />
        ) : (
          <>
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', left: 0, top: 0 }}>
                <ScannerRing size={220} />
              </View>
              <MatchScoreGauge score={compatibilityScore} size={150} />
            </View>
            <Text
              className="text-[12px] mt-3 text-center"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.5)', channels.textOpacityMultiplier) }}
            >
              Compatibility
            </Text>
            <View
              className="mt-2 px-3 py-1 rounded-full border"
              style={{
                borderColor: adaptColorOpacity('rgba(101,184,255,0.4)', channels.borderOpacityMultiplier),
                backgroundColor: adaptColorOpacity('rgba(101,184,255,0.12)', channels.glowOpacityMultiplier),
              }}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{ color: adaptColorOpacity('#8AC9FF', channels.textOpacityMultiplier) }}
              >
                Overall Fit: {overallScore}%
              </Text>
            </View>
          </>
        )}
      </View>

      {analysis.screenshot ? (
        <View className="px-5 py-2">
          <View
            className="rounded-[16px] p-4"
            style={{
              backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(255,255,255,0.08)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <Text
              className="text-[10px] uppercase tracking-[2px]"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.55)', channels.textOpacityMultiplier) }}
            >
              Screenshot Parsing
            </Text>
            <Text
              className="text-[12px] mt-2"
              style={{ color: adaptColorOpacity('rgba(233,233,242,0.9)', channels.textOpacityMultiplier) }}
            >
              Images: {analysis.screenshot.imageCount}
            </Text>
            <Text
              className="text-[12px] mt-1"
              style={{ color: adaptColorOpacity('rgba(233,233,242,0.9)', channels.textOpacityMultiplier) }}
            >
              Confidence: {formatScreenshotConfidence(analysis.screenshot.confidence)}
            </Text>
            <Text
              className="text-[11px] mt-2"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.55)', channels.textOpacityMultiplier) }}
            >
              {analysis.screenshot.reason}
            </Text>
          </View>
        </View>
      ) : null}

      <MarketSnapshotCard market={analysis.market} />
      <JobProfileCard
        title={analysis.job?.title}
        company={analysis.job?.company}
        location={analysis.job?.location}
        postedSalaryText={analysis.job?.salaryText}
        market={analysis.market}
        tags={analysis.tags}
        descriptors={analysis.descriptors}
      />
      {isLite ? (
        <LockedFullAnalysisPanels
          isLoading={isLoading}
          onRunFullAnalysis={onRunFullAnalysis}
        />
      ) : (
        <>
          <AiRiskMeter riskScore={aiRisk} summary={analysis.jobSummary} />
          <CompatibilityBreakdown items={analysis.breakdown} />
        </>
      )}
      <MarketSourceFooter market={analysis.market} />
      <PremiumScansCard />
    </>
  );
}

function LockedFullPreview() {
  return (
    <View
      className="w-[220px] h-[220px] rounded-full items-center justify-center border"
      style={{
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderColor: 'rgba(201,168,76,0.22)',
      }}
    >
      <View className="w-[146px] h-[146px] rounded-full border items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
        <Text className="text-[28px] font-semibold" style={{ color: 'rgba(201,168,76,0.42)' }}>
          --%
        </Text>
        <Text className="text-[10px] uppercase mt-1" style={{ color: 'rgba(212,212,224,0.38)', letterSpacing: 0 }}>
          Full score
        </Text>
      </View>
    </View>
  );
}

function LockedFullAnalysisPanels(props: {
  isLoading: boolean;
  onRunFullAnalysis?: () => void;
}) {
  const { isLoading, onRunFullAnalysis } = props;
  const panels = [
    'Compatibility score',
    'AI risk context',
    'Personalized factor breakdown',
  ];

  return (
    <View className="px-5 py-2">
      <Text className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: 'rgba(212,212,224,0.5)' }}>
        Full Analysis
      </Text>
      {panels.map((label) => (
        <View
          key={label}
          className="rounded-[8px] px-3 py-3 mb-2 border overflow-hidden"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(201,168,76,0.18)',
          }}
        >
          <View style={{ opacity: 0.34 }}>
            <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
              {label}
            </Text>
            <View className="h-1.5 rounded-full mt-2" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} />
            <View className="h-1.5 rounded-full mt-2 w-2/3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          </View>
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: 'rgba(13,13,20,0.38)' }}
          >
            <ScanDepthBadge depth="full" compact />
          </View>
        </View>
      ))}
      {onRunFullAnalysis ? (
        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={onRunFullAnalysis}
          className="mt-1 rounded-[8px] py-3 items-center justify-center border"
          style={{
            backgroundColor: 'rgba(201,168,76,0.16)',
            borderColor: 'rgba(201,168,76,0.32)',
            opacity: isLoading ? 0.65 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#E6CA73" />
          ) : (
            <Text className="text-[12px] font-semibold" style={{ color: '#E6CA73' }}>
              Run Full Analysis
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
