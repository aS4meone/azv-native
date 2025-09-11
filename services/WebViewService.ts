import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { AppConstants } from "../constants/AppConstants";
import { JavaScriptConstants } from "../constants/JavaScriptConstants";
import { ApiService } from "./ApiService";
import { CameraService } from "./CameraService";
import { ConnectionMonitorService } from "./ConnectionMonitorService";
import {
  LocationError,
  LocationPosition,
  LocationService,
} from "./LocationService";
import { UrlService } from "./UrlService";

// Camera context will be injected from the component
let cameraContext: any = null;

export const setCameraContext = (context: any) => {
  cameraContext = context;
};

export interface WebViewMessage {
  action: string;
  data: any;
}

export interface WebViewServiceCallbacks {
  onWebViewReady?: () => void;
  onLoadStart?: (url: string) => void;
  onLoadEnd?: (url: string) => void;
  onError?: (error: any) => void;
}

export class WebViewService {
  private static instance: WebViewService;
  private webViewRef: WebView | null = null;
  private cameraService: CameraService;
  private locationService: LocationService;
  private urlService: UrlService;
  private apiService: ApiService;
  private connectionMonitor: ConnectionMonitorService;
  private callbacks: WebViewServiceCallbacks = {};

  private constructor() {
    this.cameraService = CameraService.getInstance();
    this.locationService = LocationService.getInstance();
    this.urlService = UrlService.getInstance();
    this.apiService = ApiService.getInstance();
    this.connectionMonitor = ConnectionMonitorService.getInstance();
  }

  public static getInstance(): WebViewService {
    if (!WebViewService.instance) {
      WebViewService.instance = new WebViewService();
    }
    return WebViewService.instance;
  }

  /**
   * Set WebView reference
   */
  public setWebViewRef(webView: WebView): void {
    console.log("🔗 WebView reference set");
    this.webViewRef = webView;
  }

  /**
   * Set callbacks
   */
  public setCallbacks(callbacks: WebViewServiceCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Handle navigation request (synchronous)
   */
  public handleNavigationRequest(url: string): boolean {
    try {
      console.log(
        "🔍 Navigation request:",
        this.urlService.formatUrlForLogging(url)
      );

      // Check connection status before allowing navigation
      const connectionManager = (global as any).connectionManager;
      if (connectionManager && !connectionManager.isConnected && connectionManager.isOnErrorScreen) {
        console.log('🚫 Navigation blocked - no connection, redirecting to error screen');
        connectionManager.showConnectionError();
        return false;
      }

      // Handle special URLs - return false and handle asynchronously
      if (AppConstants.isSpecialScheme(url)) {
        this.urlService.handleSpecialUrls(url).catch(console.error);
        return false;
      }

      // Allow navigation for allowed URLs
      if (AppConstants.isAllowedUrl(url)) {
        return true;
      }

      // Special handling for Forte Bank payment URLs
      if (url.includes("securepayments.fortebank.com")) {
        console.log("🏦 Forte Bank payment URL detected, allowing navigation");
        return true;
      }

      // Allow payment result redirects back to main app
      if (
        url.includes("payment=") &&
        (url.includes("success") ||
          url.includes("failed") ||
          url.includes("declined"))
      ) {
        console.log("💳 Payment result redirect detected, allowing navigation");
        return true;
      }

      // Open external URLs in browser - return false and handle asynchronously
      this.urlService.openInExternalBrowser(url).catch(console.error);
      return false;
    } catch (error) {
      console.error("Error handling navigation request:", error);
      return false;
    }
  }

  /**
   * Handle messages from WebView
   */
  public async handleWebViewMessage(message: string): Promise<void> {
    try {
      const parsedMessage: WebViewMessage = JSON.parse(message);
      console.log("📱 WebView message:", parsedMessage.action);

      switch (parsedMessage.action) {
        case "capturePhoto":
          await this.handleCapturePhoto(parsedMessage.data);
          break;
        case "pickSinglePhoto":
          await this.handlePickSinglePhoto(parsedMessage.data);
          break;
        case "pickMultiplePhotos":
          await this.handlePickMultiplePhotos(parsedMessage.data);
          break;
        case "captureMultiplePhotos":
          await this.handleCaptureMultiplePhotos(parsedMessage.data);
          break;
        case "getCurrentPosition":
          await this.handleGetCurrentPosition(parsedMessage.data);
          break;
        case "logout":
          await this.handleLogout(parsedMessage.data);
          break;
        case "accessToken":
          await this.handleAccessToken(parsedMessage.data);
          break;
        case "accessTokenResponse":
          await this.handleAccessTokenResponse(parsedMessage.data);
          break;
        default:
          console.warn("Unknown action:", parsedMessage.action);
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  }

  /**
   * Handle capture photo request
   */
  private async handleCapturePhoto(data: string): Promise<void> {
    try {
      const cameraType = data || "back";
      console.log("🔍 handleCapturePhoto - cameraType:", cameraType);

      const photoBase64 = await this.cameraService.capturePhoto({
        cameraType: cameraType as "back" | "front",
      });

      const jsCode = photoBase64
        ? JavaScriptConstants.successCallback(photoBase64, "single")
        : JavaScriptConstants.errorCallback("Failed to capture photo");

      await this.executeJavaScript(jsCode);
    } catch (error) {
      console.error("Error capturing photo:", error);
      await this.executeJavaScript(
        JavaScriptConstants.errorCallback(error?.toString() || "Unknown error")
      );
    }
  }

  /**
   * Handle pick single photo request
   */
  private async handlePickSinglePhoto(data: string): Promise<void> {
    try {
      const photoBase64 = await this.cameraService.pickSinglePhoto();

      const jsCode = photoBase64
        ? JavaScriptConstants.successCallback(photoBase64, "single")
        : JavaScriptConstants.errorCallback("No photo selected");

      await this.executeJavaScript(jsCode);
    } catch (error) {
      console.error("Error picking photo:", error);
      await this.executeJavaScript(
        JavaScriptConstants.errorCallback(error?.toString() || "Unknown error")
      );
    }
  }

  /**
   * Handle pick multiple photos request
   */
  private async handlePickMultiplePhotos(data: any): Promise<void> {
    try {
      const maxImages = data?.maxImages || AppConstants.defaultMaxPhotos;
      const photos = await this.cameraService.pickMultiplePhotos(maxImages);

      const photosJson = photos.map((photo) => `'${photo}'`).join(",");
      const jsCode = JavaScriptConstants.successCallbackMultiple(
        photosJson,
        "multiple",
        photos.length
      );

      await this.executeJavaScript(jsCode);
    } catch (error) {
      console.error("Error picking multiple photos:", error);
      await this.executeJavaScript(
        JavaScriptConstants.errorCallback(error?.toString() || "Unknown error")
      );
    }
  }

  /**
   * Handle capture multiple photos request
   */
  private async handleCaptureMultiplePhotos(data: any): Promise<void> {
    try {
      const minPhotos = data?.minPhotos || AppConstants.defaultMinPhotos;
      const maxPhotos = data?.maxPhotos || AppConstants.defaultMaxPhotos;
      const cameraType = data?.cameraType || "back";

      console.log("🔍 handleCaptureMultiplePhotos - data:", data);

      // Try to use custom camera screen if available
      if (cameraContext && cameraContext.openCamera) {
        console.log("🔍 Using custom camera screen");
        try {
          const photos = await cameraContext.openCamera({
            minPhotos,
            maxPhotos,
            cameraType,
          });

          console.log(
            `🔍 Custom camera photos captured: ${photos.length}/${minPhotos} required`
          );

          if (photos.length < minPhotos) {
            console.log("❌ Not enough photos, sending error");
            await this.executeJavaScript(
              JavaScriptConstants.errorCallback(
                `Not enough photos. Required: ${minPhotos}, got: ${photos.length}`
              )
            );
            return;
          }

          console.log("✅ Sending photos back to web page");
          const photosJson = photos
            .map((photo: string) => `'${photo}'`)
            .join(",");
          const jsCode = JavaScriptConstants.successCallbackMultiple(
            photosJson,
            "multiple_camera",
            photos.length
          );

          console.log(
            "📤 JavaScript code to execute:",
            jsCode.substring(0, 100) + "..."
          );
          await this.executeJavaScript(jsCode);
          console.log("✅ JavaScript executed successfully");
          return;
        } catch (customError) {
          console.warn(
            "Custom camera failed, falling back to ImagePicker:",
            customError
          );
        }
      }

      // Fall back to ImagePicker
      console.log("🔍 Using ImagePicker fallback");
      const photos = await this.cameraService.captureMultiplePhotos({
        minPhotos,
        maxPhotos,
        cameraType: cameraType as "back" | "front",
      });

      console.log(
        `🔍 ImagePicker photos captured: ${photos.length}/${minPhotos} required`
      );

      if (photos.length < minPhotos) {
        await this.executeJavaScript(
          JavaScriptConstants.errorCallback(
            `Not enough photos. Required: ${minPhotos}, got: ${photos.length}`
          )
        );
        return;
      }

      const photosJson = photos.map((photo) => `'${photo}'`).join(",");
      const jsCode = JavaScriptConstants.successCallbackMultiple(
        photosJson,
        "multiple_camera",
        photos.length
      );

      await this.executeJavaScript(jsCode);
    } catch (error) {
      console.error("Error capturing multiple photos:", error);
      await this.executeJavaScript(
        JavaScriptConstants.errorCallback(error?.toString() || "Unknown error")
      );
    }
  }

  /**
   * Handle get current position request
   */
  private async handleGetCurrentPosition(data: string): Promise<void> {
    try {
      console.log("📍 Location request from web page");

      const result = await this.locationService.getCurrentPosition();

      if ("code" in result) {
        // It's an error
        const error = result as LocationError;
        await this.executeJavaScript(
          JavaScriptConstants.locationErrorCallback(error.message)
        );
      } else {
        // It's a successful position
        const position = result as LocationPosition;
        console.log(
          "📍 Location received:",
          position.latitude,
          position.longitude
        );

        await this.executeJavaScript(
          JavaScriptConstants.locationSuccessCallback(
            position.latitude,
            position.longitude,
            position.accuracy
          )
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      await this.executeJavaScript(
        JavaScriptConstants.locationErrorCallback(
          error?.toString() || "Unknown error"
        )
      );
    }
  }

  /**
   * Handle access token request
   */
  private async handleAccessToken(data: string): Promise<void> {
    try {
      console.log("🔑 Access token received from WebView:", data);

      // Disable error screen during login/auth process
      if (data && data !== "null" && data !== "undefined") {
        console.log("🔐 User authentication detected, disabling error screen");
        this.connectionMonitor.setShouldShowErrorOnTimeout(false);
      }

      // Handle null or empty data
      if (!data || data === "null" || data === "undefined") {
        console.warn(
          "⚠️ Access token is null or empty, attempting to retrieve from WebView localStorage"
        );

        // Try to get the token from WebView localStorage
        const script = `
          (function() {
            const token = localStorage.getItem('access_token');
            console.log('🔍 Retrieved token from localStorage:', token);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'accessTokenResponse',
              data: token
            }));
          })();
        `;

        await this.executeJavaScript(script);
        return;
      }

      // Store the access token for later use
      await AsyncStorage.setItem("access_token", data);
      console.log("✅ Access token stored successfully");
    } catch (error) {
      console.error("Error handling access token:", error);
    }
  }

  /**
   * Handle access token response from WebView localStorage
   */
  private async handleAccessTokenResponse(data: string): Promise<void> {
    try {
      console.log("🔑 Access token response from WebView localStorage:", data);

      if (data && data !== "null" && data !== "undefined") {
        console.log("🔐 User authentication from localStorage detected, disabling error screen");
        this.connectionMonitor.setShouldShowErrorOnTimeout(false);
        await AsyncStorage.setItem("access_token", data);
        console.log("✅ Access token stored from localStorage response");
      } else {
        console.warn("⚠️ No valid access token found in WebView localStorage");
      }
    } catch (error) {
      console.error("Error handling access token response:", error);
    }
  }

  /**
   * Handle logout request
   */
  private async handleLogout(data: string): Promise<void> {
    try {
      console.log("Logout request received from web page");

      // Disable error screen during logout process
      this.connectionMonitor.setShouldShowErrorOnTimeout(false);

      // Clear any stored tokens or user data
      await AsyncStorage.removeItem("fcm_token");
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("user_data");

      // Send success response back to web page
      await this.executeJavaScript(`
        window.flutterLogoutResult && window.flutterLogoutResult({
          success: true,
          message: 'Logout completed successfully'
        });
      `);
      
      console.log("✅ Logout completed, error screen disabled during logout");
    } catch (error) {
      console.error("Error during logout:", error);
      await this.executeJavaScript(`
        window.flutterLogoutResult && window.flutterLogoutResult({
          success: false,
          message: '${error?.toString() || "Unknown error"}'
        });
      `);
    }
  }

  /**
   * Execute JavaScript in WebView
   */
  private async executeJavaScript(code: string): Promise<void> {
    console.log("🔍 executeJavaScript called, webViewRef:", !!this.webViewRef);
    if (this.webViewRef) {
      console.log("✅ Injecting JavaScript into WebView");
      this.webViewRef.injectJavaScript(code);
    } else {
      console.warn("WebView reference is not available, retrying in 100ms...");
      // Retry after a short delay
      setTimeout(() => {
        if (this.webViewRef) {
          console.log("✅ Retry successful, injecting JavaScript");
          this.webViewRef.injectJavaScript(code);
        } else {
          console.error("WebView reference still not available after retry");
        }
      }, 100);
    }
  }

  /**
   * Request access token from WebView
   */
  public async requestAccessTokenFromWebView(): Promise<void> {
    try {
      if (!this.webViewRef) {
        console.warn("WebView reference is not available");
        return;
      }

      console.log("🔑 Requesting access token from WebView");
      const script = `
        (function() {
          if (window.flutter_channels && window.flutter_channels.sendAccessToken) {
            window.flutter_channels.sendAccessToken();
          } else {
            const token = localStorage.getItem('access_token');
            console.log('🔍 Retrieved token from localStorage:', token);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'accessToken',
              data: token
            }));
          }
        })();
      `;

      await this.executeJavaScript(script);
    } catch (error) {
      console.error("Error requesting access token from WebView:", error);
    }
  }

  /**
   * Get access token from WebView localStorage
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      if (!this.webViewRef) {
        console.warn("WebView reference is not available");
        return null;
      }

      // First try to get from AsyncStorage
      const storedToken = await AsyncStorage.getItem("access_token");
      if (storedToken) {
        console.log("🔑 Using stored access token");
        return storedToken;
      }

      console.log(
        "🔍 No stored token found, requesting from WebView localStorage"
      );

      // If not in AsyncStorage, try to get from WebView
      return new Promise((resolve) => {
        const script = `
          (function() {
            const token = localStorage.getItem('access_token');
            console.log('🔍 Retrieved token from localStorage:', token);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'accessToken',
              data: token
            }));
          })();
        `;

        // Execute script and resolve with null after timeout
        this.webViewRef?.injectJavaScript(script);
        setTimeout(() => {
          console.log("⏰ Timeout reached, resolving with null");
          resolve(null);
        }, 2000); // Increased timeout to 2 seconds
      });
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  /**
   * Send FCM token to backend
   */
  public async sendFCMTokenToBackend(fcmToken: string): Promise<boolean> {
    try {
      console.log("Sending FCM token to backend:", fcmToken);

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.log("Access token not available, will retry later");
        return false;
      }

      const success = await this.apiService.saveTokenToBackend(
        fcmToken,
        accessToken
      );
      if (success) {
        console.log("FCM token successfully sent to backend");
        await AsyncStorage.setItem("fcm_token", fcmToken);
        return true;
      } else {
        console.log("Failed to send FCM token to backend");
        return false;
      }
    } catch (error) {
      console.error("Error sending FCM token to backend:", error);
      return false;
    }
  }

  /**
   * Send FCM token to backend with manual access token (for testing)
   */
  public async sendFCMTokenToBackendWithToken(
    fcmToken: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      console.log("Sending FCM token to backend with manual token:", fcmToken);

      const success = await this.apiService.saveTokenToBackend(
        fcmToken,
        accessToken
      );
      if (success) {
        console.log("FCM token successfully sent to backend");
        await AsyncStorage.setItem("fcm_token", fcmToken);
        return true;
      } else {
        console.log("Failed to send FCM token to backend");
        return false;
      }
    } catch (error) {
      console.error("Error sending FCM token to backend:", error);
      return false;
    }
  }

  /**
   * Inject optimization script
   */
  public async injectOptimizationScript(): Promise<void> {
    try {
      await this.executeJavaScript(JavaScriptConstants.injectionScript);
    } catch (error) {
      console.error("Error injecting optimization script:", error);
    }
  }

  /**
   * Notify that WebView is ready
   */
  public notifyWebViewReady(): void {
    console.log("✅ WebView is ready");
    this.callbacks.onWebViewReady?.();

    // Request access token when WebView is ready
    setTimeout(() => {
      this.requestAccessTokenFromWebView();
    }, 1000); // Wait 1 second for the page to fully load
  }

  /**
   * Handle load start
   */
  public handleLoadStart(url: string): void {
    console.log(
      "🔄 Loading started:",
      this.urlService.formatUrlForLogging(url)
    );
    this.connectionMonitor.onLoadStart(url);
    this.callbacks.onLoadStart?.(url);
  }

  /**
   * Handle load end
   */
  public handleLoadEnd(url: string): void {
    console.log(
      "✅ Loading finished:",
      this.urlService.formatUrlForLogging(url)
    );
    this.connectionMonitor.onLoadEnd(url);
    this.callbacks.onLoadEnd?.(url);

    // Inject optimization script after page loads
    this.injectOptimizationScript();

    // Notify WebView is ready
    this.notifyWebViewReady();
  }

  /**
   * Handle error
   */
  public handleError(error: any): void {
    console.error("❌ WebView error:", error);
    this.connectionMonitor.onLoadError(error);
    this.callbacks.onError?.(error);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.webViewRef = null;
    this.callbacks = {};
  }
}
