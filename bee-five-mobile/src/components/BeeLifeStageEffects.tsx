import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { type Theme } from '../hooks/useTheme';

interface BeeLifeStageEffectsProps {
  theme: Theme;
  children: React.ReactNode;
}

const BeeLifeStageEffects: React.FC<BeeLifeStageEffectsProps> = ({ theme, children }) => {
  const pulseAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);
  const floatAnim = new Animated.Value(0);

  React.useEffect(() => {
    // Create different animations based on visual effect
    switch (theme.visualEffect) {
      case 'soft-glow':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'crawling-pattern':
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          })
        ).start();
        break;
      
      case 'honey-drip':
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -10,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'spinning-web':
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          })
        ).start();
        break;
      
      case 'dreamy-swirl':
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -10,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'dawn-break':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'hexagonal-grid':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'pollen-trail':
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -15,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'protective-aura':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.02,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
      
      case 'royal-radiance':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
    }
  }, [theme.visualEffect]);

  const getEffectStyle = () => {
    const baseStyle = {
      transform: [
        { scale: pulseAnim },
        { rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        }) },
        { translateY: floatAnim }
      ],
    };

    return baseStyle;
  };

  return (
    <Animated.View style={[styles.container, getEffectStyle()]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BeeLifeStageEffects;

