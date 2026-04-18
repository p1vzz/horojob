import React from 'react';
import { View, Text } from 'react-native';
import type { JobAnalyzeSuccessResponse } from '../../services/jobsApi';
import { MatchScoreGauge } from '../../components/MatchScoreGauge';
import { ScannerRing } from '../../components/ScannerRing';
import { AiRiskMeter } from '../../components/AiRiskMeter';
import { JobProfileCard } from '../../components/JobProfileCard';
import { CompatibilityBreakdown } from '../../components/CompatibilityBreakdown';
import { PremiumScansCard } from '../../components/PremiumScansCard';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../../utils/brightnessAdaptation';
import { formatScreenshotConfidence } from '../scannerUtilsCore';

type ScannerAnalysisSectionProps = {
  analysis: JobAnalyzeSuccessResponse | null;
};

export function ScannerAnalysisSection(props: ScannerAnalysisSectionProps) {
  const { analysis } = props;
  const { channels } = useBrightnessAdaptation();
  if (!analysis) {
    return null;
  }

  const compatibilityScore = analysis.scores.compatibility ?? 0;
  const overallScore = analysis.scores.overall ?? 0;
  const aiRisk = analysis.scores.aiReplacementRisk ?? 0;

  return (
    <>
      <View className="items-center mt-8 mb-2">
        <Text
          className="text-[11px] uppercase tracking-[2.5px] mb-3"
          style={{ color: adaptColorOpacity('rgba(201,168,76,0.7)', channels.textOpacityMultiplier) }}
        >
          NATAL ALIGNMENT
        </Text>
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

      <AiRiskMeter riskScore={aiRisk} summary={analysis.jobSummary} />
      <JobProfileCard
        title={analysis.job?.title}
        company={analysis.job?.company}
        location={analysis.job?.location}
        tags={analysis.tags}
        descriptors={analysis.descriptors}
      />
      <CompatibilityBreakdown items={analysis.breakdown} />
      <PremiumScansCard />
    </>
  );
}
