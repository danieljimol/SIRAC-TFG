import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withDecay,
  runOnJS,
  withSpring
} from 'react-native-reanimated';

const FaltasScreen = () => {
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isRotating = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      const { absoluteX, absoluteY, x, y } = event;
      const centerX = x - 100; // Centrar x (tamaño del objeto / 2)
      const centerY = y - 100; // Centrar y (tamaño del objeto / 2)
      const distance = Math.sqrt(centerX ** 2 + centerY ** 2);

      if (distance > 80) { // 80 podría ser un radio estimado cerca del borde
        ctx.isRotating = true;
        ctx.startRotation = rotation.value;
      } else {
        ctx.isRotating = false;
        ctx.startX = translateX.value;
        ctx.startY = translateY.value;
      }
    },
    onActive: (event, ctx) => {
      if (ctx.isRotating) {
        const { translationX, translationY } = event;
        rotation.value = ctx.startRotation + (translationX + translationY) / 2.5;
      } else {
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      }
    },
    onEnd: (event, ctx) => {
      if (ctx.isRotating) {
        const combinedVelocity = Math.sqrt(event.velocityX ** 2 + event.velocityY ** 2);
        if(rotation.value > 180){
          rotation.value = withSpring(360);
        } else if(rotation.value < 180){
          rotation.value = withSpring(180);
        } else if(rotation.value < 180){
          rotation.value = withSpring(180);
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.logo, animatedStyle]}>
          <View style={styles.logo}>
            <Text style={styles.logoS}>S</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f',
  },
  logoS: {
    fontSize: 25,
    fontWeight: '900',
    color: '#fff'
  }
});

export default FaltasScreen;
