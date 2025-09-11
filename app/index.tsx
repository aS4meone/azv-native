import AZVWebView from "@/components/AZVWebView";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FirebaseMessagingService } from "../services/FirebaseMessagingService";

export default function HomeScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleError = (error: any) => {
    console.error("App error:", error);
  };

  const showToken = () => {
    const firebaseService = FirebaseMessagingService.getInstance();
    const token = firebaseService.getCurrentToken();
    Alert.alert("Push Token", token || "Token not available yet", [
      { text: "OK" },
    ]);
  };

  const testTokenSending = async () => {
    const firebaseService = FirebaseMessagingService.getInstance();
    const token = firebaseService.getCurrentToken();
    if (token) {
      Alert.alert(
        "Testing Token Sending",
        `Attempting to send token: ${token.substring(0, 20)}...`,
        [{ text: "OK" }]
      );

      // Try to send token to backend
      const webViewService =
        require("../services/WebViewService").WebViewService.getInstance();
      const success = await webViewService.sendFCMTokenToBackend(token);

      Alert.alert(
        "Token Sending Result",
        success ? "✅ Token sent successfully!" : "❌ Failed to send token",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert("Error", "No token available", [{ text: "OK" }]);
    }
  };

  const testWithManualToken = async () => {
    const firebaseService = FirebaseMessagingService.getInstance();
    const token = firebaseService.getCurrentToken();
    if (token) {
      Alert.prompt(
        "Enter Access Token",
        "Please enter your access token to test token sending:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send",
            onPress: async (accessToken) => {
              if (accessToken) {
                const webViewService =
                  require("../services/WebViewService").WebViewService.getInstance();
                const success =
                  await webViewService.sendFCMTokenToBackendWithToken(
                    token,
                    accessToken
                  );

                Alert.alert(
                  "Manual Token Sending Result",
                  success
                    ? "✅ Token sent successfully!"
                    : "❌ Failed to send token",
                  [{ text: "OK" }]
                );
              }
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", "No token available", [{ text: "OK" }]);
    }
  };

  const requestAccessToken = async () => {
    try {
      const webViewService =
        require("../services/WebViewService").WebViewService.getInstance();
      await webViewService.requestAccessTokenFromWebView();
      Alert.alert("Info", "Access token request sent to WebView", [
        { text: "OK" },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to request access token", [{ text: "OK" }]);
    }
  };

  const handleLoadStart = () => {
    console.log("App loading started");
  };

  const handleLoadEnd = () => {
    console.log("App loading completed");
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowCamera(false)}
        >
          <Text style={styles.backButtonText}>Назад к WebView</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showDebug) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowDebug(false)}
        >
          <Text style={styles.backButtonText}>Назад к WebView</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <AZVWebView
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tokenButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  tokenButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  testButton: {
    position: "absolute",
    top: 110,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  testButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  debugButton: {
    position: "absolute",
    top: 160,
    right: 20,
    backgroundColor: "#28a745",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  requestTokenButton: {
    position: "absolute",
    top: 210,
    right: 20,
    backgroundColor: "#6f42c1",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  requestTokenButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  backButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
