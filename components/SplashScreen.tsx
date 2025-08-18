import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, Image } from "react-native";
import LogoTitle from "./LogoTitle";
import LogoDescription from "./LogoDescription";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const upwardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Individual item animations
  const logoAnim = useRef(new Animated.Value(0.8)).current;
  const titleAnim = useRef(new Animated.Value(0.8)).current;
  const descAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (permissionsGranted) return;

    // Start the animation sequence
    startAnimationSequence();
  }, [permissionsGranted]);

  const startAnimationSequence = () => {
    // 1. Fade-in animation (first phase)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // 2. Start upward and scale animations
      Animated.parallel([
        Animated.timing(upwardAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 320, // 40% of 800ms
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 480, // 60% of 800ms
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // 3. After animations complete, request permissions
        setTimeout(() => {
          requestPermissionsAutomatically();
        }, 500);
      });
    });

    // Start individual item animations with delays
    setTimeout(() => {
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1200);

    setTimeout(() => {
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1400);

    setTimeout(() => {
      Animated.spring(descAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1600);
  };

  const requestPermissionsAutomatically = async () => {
    try {
      // Request permissions here - you can implement your permission service
      // For now, we'll just simulate the process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPermissionsGranted(true);
      onAnimationComplete();
    } catch (error) {
      console.log("Error requesting permissions:", error);
      // Even if there's an error, continue with app loading
      setPermissionsGranted(true);
      onAnimationComplete();
    }
  };

  // If permissions are granted, don't show anything
  if (permissionsGranted) {
    return null;
  }

  const screenHeight = Dimensions.get("window").height;
  const upwardTranslateY = upwardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenHeight * 1.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: upwardTranslateY }, { scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.item,
            {
              transform: [{ scale: logoAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/logo-nbg.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View
          style={[
            styles.item,
            {
              transform: [{ scale: titleAnim }],
            },
          ]}
        >
          <LogoTitle width={300} height={80} />
        </Animated.View>

        <View style={styles.smallSpacer} />

        <Animated.View
          style={[
            styles.item,
            {
              transform: [{ scale: descAnim }],
            },
          ]}
        >
          <LogoDescription width={300} height={40} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111111", // Dark background matching Flutter
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 144,
    height: 200,
  },
  spacer: {
    height: 24,
  },
  smallSpacer: {
    height: 8,
  },
});

export default SplashScreen;
