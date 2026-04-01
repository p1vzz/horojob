import React from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function DashboardInsightHydrationOverlay(args: {
  veilColor: string;
  shimmerColors: readonly [string, string, string];
}) {
  const { veilColor, shimmerColors } = args;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
      shimmerAnim.setValue(0);
    };
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 420],
  });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: veilColor }} />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 160,
          transform: [{ translateX }, { skewX: '-18deg' }],
          opacity: 0.7,
        }}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
