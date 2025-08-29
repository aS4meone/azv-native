import {useFocusEffect} from "@react-navigation/native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  View,
  AppState,
  AppStateStatus,
} from "react-native";
import {WebView} from "react-native-webview";
import {AppConstants} from "../constants/AppConstants";
import {CameraProvider, useCamera} from "../contexts/CameraContext";
import {FirebaseMessagingService} from "../services/FirebaseMessagingService";
import {WebViewService, setCameraContext} from "../services/WebViewService";
import {CameraWrapper} from "./CameraWrapper";
import {SplashScreen} from "./SplashScreen";

interface AZVWebViewProps {
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

const AZVWebViewInner: React.FC<AZVWebViewProps> = ({
  onError,
  onLoadStart,
  onLoadEnd,
}) => {
  const cameraContext = useCamera();

  // Set camera context in WebViewService
  useEffect(() => {
    setCameraContext(cameraContext);
  }, [cameraContext]);

  const webViewRef = useRef<WebView>(null);
  const webViewService = WebViewService.getInstance();
  const firebaseService = FirebaseMessagingService.getInstance();
  const [isLoading, setIsLoading] = useState(true);
  const [splashAnimationCompleted, setSplashAnimationCompleted] =
    useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const pongCounterRef = useRef(0);
  const [webKey, setWebKey] = useState(0);
  const lastReloadRef = useRef(0);
  const reloadAttemptsRef = useRef(0);

  const hardRemount = useCallback(() => {
    setIsLoading(true);
    setWebKey(k => k + 1);
  }, [])

  const softReload = useCallback(() => {
    setIsLoading(true);
    if (webViewRef.current) webViewRef.current.reload();
    else hardRemount();
  }, [hardRemount]);


  const safeReload = useCallback((hard = false) => {
    const now = Date.now();
    if (now - lastReloadRef.current < 1500) return; // дебаунс 1.5s
    lastReloadRef.current = now;
    reloadAttemptsRef.current += 1;

    if (hard || reloadAttemptsRef.current >= 3) {
      reloadAttemptsRef.current = 0;
      hardRemount(); // эскалация после 3 мягких
    } else {
      softReload();
    }
  }, [hardRemount, softReload]);

  const checkIfShouldHideLoading = useCallback(() => {
    if (splashAnimationCompleted && webViewReady) {
      setIsLoading(false);
    }
  }, [splashAnimationCompleted, webViewReady]);

  const onContentProcessDidTerminate = useCallback(() => {
    safeReload(true); // сразу hard
  }, [safeReload]);


// Android: Chromium процесс "render process gone"
  const onRenderProcessGone = useCallback((e: any) => {
    if (e?.nativeEvent?.didCrash) {
      // чаще помогает именно ремоунт
      hardRemount();
    } else {
      softReload();
    }
  }, [hardRemount, softReload]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") {
        const before = pongCounterRef.current;
        const token = String(Date.now());

        webViewRef.current?.injectJavaScript(`
        (function(){
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              t:'pong', token:'${token}',
              rs: document.readyState,
              h: document.body ? document.body.offsetHeight : null
            }));
          } catch (e) {}
          true;
        })();
      `);

        setTimeout(() => {
          if (pongCounterRef.current === before) {
            safeReload(); // <- вместо softReload
          }
        }, 1200);
      }
    });
    return () => sub.remove();
  }, [safeReload]);


  useEffect(() => {
    // Initialize Firebase messaging
    const initFirebase = async () => {
      try {
        await firebaseService.init();
        // Set WebView service reference in Firebase service
        firebaseService.setWebViewService(webViewService);
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
      }
    };

    initFirebase();

    // Set up WebView service callbacks
    webViewService.setCallbacks({
      onWebViewReady: () => {
        setWebViewReady(true);
        checkIfShouldHideLoading();
      },
      onLoadStart: (url) => {
        console.log("🔄 Load started:", url);
        onLoadStart?.();
      },
      onLoadEnd: (url) => {
        console.log("✅ Load finished:", url);
        onLoadEnd?.();
      },
      onError: (error) => {
        console.error("❌ WebView error:", error);
        onError?.(error);
      },
    });

    return () => {
      webViewService.dispose();
    };
  }, [
    onError,
    onLoadStart,
    onLoadEnd,
    webViewService,
    firebaseService,
    checkIfShouldHideLoading,
  ]);

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [canGoBack])
  );

  useEffect(() => {
    checkIfShouldHideLoading();
  }, [checkIfShouldHideLoading]);

  const handleSplashAnimationComplete = useCallback(() => {
    setSplashAnimationCompleted(true);
  }, []);

  const handleWebViewLoadStart = useCallback(() => {
    webViewService.handleLoadStart(AppConstants.baseUrl);
  }, [webViewService]);

  const handleWebViewLoadEnd = useCallback(() => {
    reloadAttemptsRef.current = 0;
    webViewService.handleLoadEnd(AppConstants.baseUrl);
  }, [webViewService]);


  const handleWebViewError = useCallback(
    (error: any) => {
      console.error("WebView error:", error);
      webViewService.handleError(error);

      Alert.alert(
        "Connection Error",
        "Failed to load the application. Please check your internet connection and try again.",
        [
          {
            text: "Retry",
            onPress: () => {
              webViewRef.current?.reload();
            },
          },
        ]
      );
    },
    [webViewService]
  );

  const handleMessage = useCallback(
    (event: any) => {
      const raw = event.nativeEvent.data;
      try {
        const data = JSON.parse(raw);
        if (data?.t === "pong") {
          pongCounterRef.current++;
          return; // страница жива — дальше ничего не делаем
        }
      } catch {}
      // остальное — как было
      webViewService.handleWebViewMessage(raw);
    },
    [webViewService]
  );

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const onHttpError = useCallback((e: any) => {
    const status = e?.nativeEvent?.statusCode;
    if (status >= 500 || status === 0) {
      safeReload();
    } // 401/403/404 оставляем приложению
  }, [safeReload]);


  const handleShouldStartLoadWithRequest = useCallback(
    (request: any): boolean => {
      return webViewService.handleNavigationRequest(request.url);
    },
    [webViewService]
  );

  // Set WebView reference when component mounts
  useEffect(() => {
    if (webViewRef.current) {
      webViewService.setWebViewRef(webViewRef.current);
    }
  }, [webViewService]);

  // Set WebView reference immediately when ref is available
  const setWebViewRef = useCallback(
    (ref: WebView | null) => {
      if (ref) {
        webViewService.setWebViewRef(ref);
      }
    },
    [webViewService]
  );

  return (
    <View style={styles.container}>
      <WebView
        key={webKey}
        ref={(ref) => {
          webViewRef.current = ref;
          setWebViewRef(ref);
        }}
        source={{uri: AppConstants.baseUrl}}
        style={styles.webview}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onError={handleWebViewError}
        onHttpError={onHttpError}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled={true}
        onContentProcessDidTerminate={onContentProcessDidTerminate}
        onRenderProcessGone={onRenderProcessGone}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        allowsLinkPreview={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        geolocationEnabled
        userAgent="AZV-React-Native-WebView"
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF"/>
          </View>
        )}
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
      />

      {isLoading && (
        <SplashScreen onAnimationComplete={handleSplashAnimationComplete}/>
      )}

      {/* Custom Camera Screen */}
      <CameraWrapper/>
    </View>
  );
};

const AZVWebView: React.FC<AZVWebViewProps> = (props) => {
  return (
    <CameraProvider>
      <AZVWebViewInner {...props} />
    </CameraProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});

export default AZVWebView;
