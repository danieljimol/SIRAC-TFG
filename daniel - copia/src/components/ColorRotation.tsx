import { View, Dimensions, StyleSheet } from 'react-native';
import React from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDecay } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { TAU } from 'react-native-redash';
import { Canvas, ImageSVG } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

const buildSimpleCircleSvg = (R: number) => {
  const SIZE = R * 2;
  const circleSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns='http://www.w3.org/2000/svg'>
    <defs>
      <radialGradient id="grad1" cx="10%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
      </radialGradient>
    </defs>
    <circle cx="${R}" cy="${R}" r="${R}" fill="url(#grad1)"/>
  </svg>`;
  return Skia.SVG.MakeFromString(circleSvg)!;
};

const { width } = Dimensions.get('window');
const R = width * 0.35;
const svg = buildSimpleCircleSvg(R);
const EDGE_THRESHOLD = R * 0.35;

const SimpleCircleRotation = () => {
  const rotation = useSharedValue(0);
  const origin = useSharedValue(0);
  const offset = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isRotating = useSharedValue(false);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}rad` }],
  }));

  const translationStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const rotationGesture = Gesture.Pan()
    .onBegin(e => {
      const xRel = e.x - R;
      const yRel = e.y - R;
      const distance = Math.sqrt(xRel ** 2 + yRel ** 2);
      if (distance >= R - EDGE_THRESHOLD) { // Detecta si el gesto es desde el borde
        isRotating.value = true;
        const angle = Math.atan2(-yRel, xRel);
        origin.value = angle < 0 ? (angle + TAU) % TAU : angle % TAU;
        offset.value = rotation.value;
      } else { // Gestos desde el centro
        isRotating.value = false;
        translateX.value = xRel; // Ajustar según necesites para el desplazamiento
        translateY.value = yRel; // Ajustar según necesites para el desplazamiento
      }
    })
    .onChange(e => {
      const xRel = e.x - R;
      const yRel = e.y - R;
      const distance = Math.sqrt(xRel ** 2 + yRel ** 2);
      if (isRotating.value) { // Continúa la rotación si el gesto es desde el borde
        const angle = Math.atan2(-yRel, xRel);
        rotation.value = offset.value + ((angle + TAU) % TAU - origin.value);
      } else { // Actualiza la posición si el gesto es desde el centro
        translateX.value = xRel;
        translateY.value = yRel;
      }
    })
    .onEnd((e) => {
      const xRel = e.x - R;
      const yRel = e.y - R;
      const distance = Math.sqrt(xRel ** 2 + yRel ** 2);
      if(isRotating.value){
        const xRel = e.x - R;
        const yRel = e.y - R;
        const distanceToCenter = Math.sqrt(xRel ** 2 + yRel ** 2);
        const angularVelocity = (e.velocityX * yRel - e.velocityY * xRel) / (distanceToCenter ** 2);
    
        rotation.value = withDecay({
          velocity: angularVelocity // Ajusta este valor para cambiar la tasa de decaimiento
        });
      }else{
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  return (
    <View style={styles.container2}>
      <Animated.View style={[styles.canvas, rStyle, translationStyle]}>
        <Canvas style={styles.container}>
          <ImageSVG svg={svg} x={0} y={0} width={R * 2} height={R * 2} />
        </Canvas>
      </Animated.View>
      <GestureDetector gesture={rotationGesture}>
        <Animated.View style={styles.canvas} />
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container2: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  canvas: {
    position: 'absolute',
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: R,
  },
});

export default SimpleCircleRotation;
