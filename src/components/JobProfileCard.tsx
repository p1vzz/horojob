import React from 'react';
import { View, Text } from 'react-native';
import { Briefcase, MapPin } from 'lucide-react-native';

type JobProfileCardProps = {
  title?: string;
  company?: string | null;
  location?: string | null;
  tags?: string[];
  descriptors?: string[];
};

type SignalGroup = 'scope' | 'execution' | 'collaboration' | 'environment' | 'dynamics' | 'specialization' | 'other';
type SignalEmphasis = 'high' | 'medium' | 'low';

type SignalDefinition = {
  label: string;
  group: SignalGroup;
  emphasis: SignalEmphasis;
  priority: number;
};

type SignalItem = SignalDefinition & {
  key: string;
};

const defaultTokens: string[] = [];

const SIGNAL_GROUP_LABELS: Record<SignalGroup, string> = {
  scope: 'Scope',
  execution: 'Execution',
  collaboration: 'Collaboration',
  environment: 'Work Environment',
  dynamics: 'Role Dynamics',
  specialization: 'Specialization',
  other: 'Other Signals',
};

const GROUP_ORDER: SignalGroup[] = ['scope', 'execution', 'collaboration', 'environment', 'dynamics', 'specialization', 'other'];

const EMPHASIS_META: Record<
  SignalEmphasis,
  { chipText: string; chipBg: string; chipBorder: string; badgeBg: string; badgeText: string; rank: number; badge: string }
> = {
  high: {
    chipText: '#FFBE7A',
    chipBg: 'rgba(255,190,122,0.14)',
    chipBorder: 'rgba(255,190,122,0.42)',
    badgeBg: 'rgba(255,190,122,0.28)',
    badgeText: '#FFD4A8',
    rank: 3,
    badge: 'HIGH',
  },
  medium: {
    chipText: '#A99BFF',
    chipBg: 'rgba(169,155,255,0.14)',
    chipBorder: 'rgba(169,155,255,0.42)',
    badgeBg: 'rgba(169,155,255,0.28)',
    badgeText: '#D2CAFF',
    rank: 2,
    badge: 'MED',
  },
  low: {
    chipText: '#87D8B3',
    chipBg: 'rgba(135,216,179,0.14)',
    chipBorder: 'rgba(135,216,179,0.38)',
    badgeBg: 'rgba(135,216,179,0.24)',
    badgeText: '#BDEDD5',
    rank: 1,
    badge: 'LOW',
  },
};

const SIGNAL_DEFINITIONS: Record<string, SignalDefinition> = {
  leadership: { label: 'Leadership', group: 'scope', emphasis: 'high', priority: 120 },
  'leadership-heavy': { label: 'Leadership Heavy', group: 'scope', emphasis: 'high', priority: 130 },
  strategy: { label: 'Strategic Focus', group: 'scope', emphasis: 'high', priority: 118 },
  autonomy: { label: 'Autonomy', group: 'scope', emphasis: 'medium', priority: 108 },
  generalist: { label: 'Generalist', group: 'scope', emphasis: 'low', priority: 70 },
  product: { label: 'Product Ownership', group: 'scope', emphasis: 'medium', priority: 110 },

  operations: { label: 'Operations Heavy', group: 'execution', emphasis: 'medium', priority: 112 },
  documentation: { label: 'Documentation', group: 'execution', emphasis: 'low', priority: 90 },
  repetitive: { label: 'Repetitive Tasks', group: 'execution', emphasis: 'high', priority: 125 },
  engineering: { label: 'Engineering Workflow', group: 'execution', emphasis: 'medium', priority: 108 },
  analytics: { label: 'Analytics Execution', group: 'execution', emphasis: 'medium', priority: 109 },

  collaboration: { label: 'Cross-Team Collaboration', group: 'collaboration', emphasis: 'medium', priority: 106 },
  communication: { label: 'Communication Driven', group: 'collaboration', emphasis: 'medium', priority: 107 },
  'customer-facing': { label: 'Customer Facing', group: 'collaboration', emphasis: 'medium', priority: 115 },
  'client-facing': { label: 'Client Facing', group: 'collaboration', emphasis: 'medium', priority: 116 },
  sales: { label: 'Commercial Collaboration', group: 'collaboration', emphasis: 'medium', priority: 103 },

  remote: { label: 'Remote Friendly', group: 'environment', emphasis: 'low', priority: 92 },
  'remote-friendly': { label: 'Remote Friendly', group: 'environment', emphasis: 'low', priority: 93 },
  'high-pressure': { label: 'High Pressure', group: 'environment', emphasis: 'high', priority: 132 },

  creativity: { label: 'Creative Work', group: 'dynamics', emphasis: 'medium', priority: 104 },
  creative: { label: 'Creative Work', group: 'dynamics', emphasis: 'medium', priority: 105 },
  research: { label: 'Research Orientation', group: 'dynamics', emphasis: 'medium', priority: 102 },

  'data-oriented': { label: 'Data Oriented', group: 'specialization', emphasis: 'medium', priority: 111 },
  'ai-exposure': { label: 'AI Exposure', group: 'specialization', emphasis: 'medium', priority: 100 },
};

function toTitleCase(input: string) {
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeTagLabel(input: string) {
  return toTitleCase(input.trim());
}

function toSignalKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function normalizeSignals(input: { tags?: string[]; descriptors?: string[] }): SignalItem[] {
  const descriptorTokens = (input.descriptors ?? []).filter((token) => token.trim().length > 0);
  const tagTokens = (input.tags ?? []).filter((token) => token.trim().length > 0);
  const fallbackTokens = descriptorTokens.length === 0 && tagTokens.length === 0 ? defaultTokens : [];

  const bag = new Map<string, SignalItem>();

  const upsert = (rawToken: string, sourceBoost: number) => {
    const key = toSignalKey(rawToken);
    if (!key) return;

    const base = SIGNAL_DEFINITIONS[key];
    const candidate: SignalItem = base
      ? { ...base, key }
      : {
          key,
          label: normalizeTagLabel(rawToken),
          group: 'other',
          emphasis: 'low',
          priority: 50,
        };

    const existing = bag.get(candidate.key);
    if (!existing) {
      bag.set(candidate.key, {
        ...candidate,
        priority: candidate.priority + sourceBoost,
      });
      return;
    }

    const candidateEmphasis = EMPHASIS_META[candidate.emphasis].rank;
    const existingEmphasis = EMPHASIS_META[existing.emphasis].rank;
    const nextEmphasis = candidateEmphasis > existingEmphasis ? candidate.emphasis : existing.emphasis;
    const nextGroup = existing.group === 'other' && candidate.group !== 'other' ? candidate.group : existing.group;
    const nextPriority = Math.max(existing.priority, candidate.priority + sourceBoost);

    bag.set(candidate.key, {
      ...existing,
      group: nextGroup,
      emphasis: nextEmphasis,
      priority: nextPriority,
    });
  };

  for (const token of descriptorTokens) {
    upsert(token, 12);
  }
  for (const token of tagTokens) {
    upsert(token, 6);
  }
  for (const token of fallbackTokens) {
    upsert(token, 0);
  }

  return [...bag.values()]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);
}

export const JobProfileCard = ({
  title = 'Role not detected',
  company = null,
  location,
  tags,
  descriptors,
}: JobProfileCardProps) => {
  const groupedSignals = React.useMemo(() => {
    const signals = normalizeSignals({ tags, descriptors });
    const grouped = new Map<SignalGroup, SignalItem[]>();
    for (const signal of signals) {
      const row = grouped.get(signal.group) ?? [];
      row.push(signal);
      grouped.set(signal.group, row);
    }

    return GROUP_ORDER.map((group) => ({
      group,
      label: SIGNAL_GROUP_LABELS[group],
      items: (grouped.get(group) ?? []).sort((a, b) => {
        const emphasisDelta = EMPHASIS_META[b.emphasis].rank - EMPHASIS_META[a.emphasis].rank;
        if (emphasisDelta !== 0) return emphasisDelta;
        return b.priority - a.priority;
      }),
    })).filter((entry) => entry.items.length > 0);
  }, [descriptors, tags]);

  return (
    <View className="px-5 py-2">
      <View
        className="rounded-[16px] p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-start">
          <View
            className="w-11 h-11 rounded-[12px] items-center justify-center mr-3"
            style={{
              backgroundColor: 'rgba(90,58,204,0.15)',
              borderColor: 'rgba(90,58,204,0.25)',
              borderWidth: 1,
            }}
          >
            <Briefcase size={18} color="#5A3ACC" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold" style={{ color: 'rgba(212,212,224,0.95)' }}>
              {title}
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="rgba(212,212,224,0.45)" />
              <Text className="text-[12px] ml-1" style={{ color: 'rgba(212,212,224,0.45)' }}>
                {location ? `${company ?? 'Company'} - ${location}` : (company ?? 'Company not detected')}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 pt-3" style={{ borderTopColor: 'rgba(255,255,255,0.07)', borderTopWidth: 1 }}>
          {groupedSignals.length > 0 ? (
            groupedSignals.map((group) => (
              <View key={group.group} className="mb-2.5">
                <Text className="text-[10px] tracking-[1.4px] mb-1.5" style={{ color: 'rgba(212,212,224,0.46)' }}>
                  {group.label}
                </Text>
                <View className="flex-row flex-wrap">
                  {group.items.map((signal) => {
                    const emphasisMeta = EMPHASIS_META[signal.emphasis];
                    return (
                      <View
                        key={`${group.group}:${signal.key}`}
                        className="px-2.5 py-1.5 rounded-full mr-2 mb-2 flex-row items-center"
                        style={{
                          backgroundColor: emphasisMeta.chipBg,
                          borderColor: emphasisMeta.chipBorder,
                          borderWidth: 1,
                        }}
                      >
                        <Text className="text-[11px] font-medium" style={{ color: emphasisMeta.chipText }}>
                          {signal.label}
                        </Text>
                        <View
                          className="ml-1.5 px-1 py-[1px] rounded"
                          style={{
                            backgroundColor: emphasisMeta.badgeBg,
                          }}
                        >
                          <Text className="text-[8px] font-semibold tracking-[0.6px]" style={{ color: emphasisMeta.badgeText }}>
                            {emphasisMeta.badge}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-[11px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
              No parsed role signals available for this scan.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
