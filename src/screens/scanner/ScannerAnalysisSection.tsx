import React from 'react';
import { View, Text } from 'react-native';
import type { JobAnalyzeSuccessResponse } from '../../services/jobsApi';
import { MatchScoreGauge } from '../../components/MatchScoreGauge';
import { ScannerRing } from '../../components/ScannerRing';
import { AiRiskMeter } from '../../components/AiRiskMeter';
import { JobProfileCard } from '../../components/JobProfileCard';
import { CompatibilityBreakdown } from '../../components/CompatibilityBreakdown';
import { InterviewStrategy } from '../../components/InterviewStrategy';
import { PremiumScansCard } from '../../components/PremiumScansCard';
import { formatScreenshotConfidence } from '../scannerUtilsCore';

type ScannerAnalysisSectionProps = {
  analysis: JobAnalyzeSuccessResponse | null;
};

export function ScannerAnalysisSection(props: ScannerAnalysisSectionProps) {
  const { analysis } = props;
  if (!analysis) {
    return null;
  }

  const compatibilityScore = analysis.scores.compatibility ?? 0;
  const overallScore = analysis.scores.overall ?? 0;
  const aiRisk = analysis.scores.aiReplacementRisk ?? 0;

  return (
    <>
      <View className="items-center mt-8 mb-2">
        <Text className="text-[11px] uppercase tracking-[2.5px] mb-3" style={{ color: 'rgba(201,168,76,0.7)' }}>
          NATAL ALIGNMENT
        </Text>
        <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 0, top: 0 }}>
            <ScannerRing size={220} />
          </View>
          <MatchScoreGauge score={compatibilityScore} size={150} />
        </View>
        <Text className="text-[12px] mt-3 text-center" style={{ color: 'rgba(212,212,224,0.5)' }}>
          Compatibility
        </Text>
        <View
          className="mt-2 px-3 py-1 rounded-full border"
          style={{
            borderColor: 'rgba(101,184,255,0.4)',
            backgroundColor: 'rgba(101,184,255,0.12)',
          }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: '#8AC9FF' }}>
            Overall Fit: {overallScore}%
          </Text>
        </View>
      </View>

      {analysis.screenshot ? (
        <View className="px-5 py-2">
          <View
            className="rounded-[16px] p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
            }}
          >
            <Text className="text-[10px] uppercase tracking-[2px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
              Screenshot Parsing
            </Text>
            <Text className="text-[12px] mt-2" style={{ color: 'rgba(233,233,242,0.9)' }}>
              Images: {analysis.screenshot.imageCount}
            </Text>
            <Text className="text-[12px] mt-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
              Confidence: {formatScreenshotConfidence(analysis.screenshot.confidence)}
            </Text>
            <Text className="text-[11px] mt-2" style={{ color: 'rgba(212,212,224,0.55)' }}>
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
      <InterviewStrategy />
      <PremiumScansCard />
    </>
  );
}
