import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useCamera } from "../contexts/CameraContext";

export const CustomCameraTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { openCamera } = useCamera();

  const testCustomCamera = async () => {
    setIsLoading(true);

    try {
      console.log("📸 Testing custom camera...");

      const photos = await openCamera({
        minPhotos: 1,
        maxPhotos: 3,
        cameraType: "back",
      });

      if (photos.length > 0) {
        Alert.alert(
          "Success",
          `Captured ${photos.length} photos with custom camera!`
        );
        console.log("📸 Custom camera photos:", photos.length);
      } else {
        Alert.alert("Info", "No photos captured or user cancelled");
      }
    } catch (error) {
      console.error("📸 Custom camera test error:", error);
      Alert.alert("Error", `Custom camera test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Camera Test</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testCustomCamera}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Testing..." : "Test Custom Camera"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
