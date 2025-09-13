import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EdgeToEdgeHandlerProps {
  children: React.ReactNode;
}

export const EdgeToEdgeHandler: React.FC<EdgeToEdgeHandlerProps> = ({ children }) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Configure status bar for edge-to-edge on Android
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }

    // Allow all orientations on tablets and large screens
    const configureOrientation = async () => {
      try {
        // Allow all orientations for better tablet support
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        console.warn('Could not configure screen orientation:', error);
      }
    };

    configureOrientation();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
