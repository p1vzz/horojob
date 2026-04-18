import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowRight, Gauge } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';

export const PremiumScansCard = () => {
  const navigation = useNavigation<AppNavigationProp>();

  return (
    <View className="px-5 py-2 pb-8">
      <Pressable
        onPress={() => navigation.navigate('PremiumPurchase')}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View
          className="rounded-[18px] p-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center mb-2">
            <View
              className="w-8 h-8 rounded-[10px] items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(201,168,76,0.12)' }}
            >
              <Gauge size={16} color="#C9A84C" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold" style={{ color: 'rgba(212,212,224,0.95)' }}>
                10 Daily Job Checks
              </Text>
              <Text className="text-[11px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
                Premium gives you 10 successful checks per day.
              </Text>
            </View>
            <View
              className="ml-2 px-2 py-0.5 rounded-full border"
              style={{ borderColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.12)' }}
            >
              <Text className="text-[9px] font-bold" style={{ color: '#C9A84C' }}>
                PRO
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <Text className="text-[10px] flex-1" style={{ color: 'rgba(212,212,224,0.48)' }}>
              More scans for comparing roles and saved history.
            </Text>
            <ArrowRight size={14} color="rgba(212,212,224,0.35)" />
          </View>
        </View>
      </Pressable>
    </View>
  );
};
