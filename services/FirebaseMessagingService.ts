import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import reigsterNNPushToken from "native-notify";
import { ApiService } from "./ApiService";
import { PermissionService } from "./PermissionService";
import { WebViewService } from "./WebViewService";

// Firebase messaging import with error handling
let messaging: any;
try {
  messaging = require("@react-native-firebase/messaging").default;
} catch (error) {
  console.warn(
    "Firebase messaging not available, using Expo notifications:",
    error
  );
  messaging = null;
}

interface RemoteMessage {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

export class FirebaseMessagingService {
  private static instance: FirebaseMessagingService;
  private webViewService?: WebViewService;
  private apiService: ApiService;
  private permissionService: PermissionService;
  private pendingFcmToken?: string;
  private currentFcmToken?: string;
  private isInitialized: boolean = false;
  private expoPushToken?: string;

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.permissionService = PermissionService.getInstance();
  }

  public static getInstance(): FirebaseMessagingService {
    if (!FirebaseMessagingService.instance) {
      FirebaseMessagingService.instance = new FirebaseMessagingService();
    }
    return FirebaseMessagingService.instance;
  }

  /**
   * Initialize Firebase Messaging or Expo Notifications
   */
  public async init(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log("Messaging service already initialized");
        return;
      }

      console.log("🔥 Initializing Messaging Service");

      // Request notification permissions
      const hasPermission =
        await this.permissionService.requestNotificationPermission();
      if (!hasPermission) {
        console.log("Notification permission denied");
        return;
      }

      // Initialize native-notify
      await this.initNativeNotify();

      // Try Firebase first, fallback to Expo
      if (messaging) {
        console.log("Using Firebase messaging");
        await this.initFirebase();
      } else {
        console.log("Using Expo notifications");
        await this.initExpoNotifications();
      }

      this.isInitialized = true;
      console.log("✅ Messaging Service initialized");
    } catch (error) {
      console.error("Error initializing messaging service:", error);
    }
  }

  /**
   * Initialize native-notify
   */
  private async initNativeNotify(): Promise<void> {
    try {
      console.log("🔔 Initializing native-notify");

      // Register with native-notify using the credentials from the image
      reigsterNNPushToken(26211, "Azq2CSTOKDb5jvwhiD0ywv");

      console.log("✅ native-notify initialized successfully");
    } catch (error) {
      console.error("Error initializing native-notify:", error);
    }
  }

  /**
   * Initialize Firebase messaging
   */
  private async initFirebase(): Promise<void> {
    try {
      // Get the FCM token
      const token: string = await messaging().getToken();

      if (token) {
        this.currentFcmToken = token;
        console.log(token);
        await this.saveTokenToServer(token);
      }

      // Set up token refresh listener
      messaging().onTokenRefresh((token: string) => {
        this.saveTokenToServer(token);
      });

      // Set up message handlers
      this.setupFirebaseMessageHandlers();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      // Fallback to Expo
      await this.initExpoNotifications();
    }
  }

  /**
   * Initialize Expo notifications
   */
  private async initExpoNotifications(): Promise<void> {
    try {
      // Configure Expo notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "c206b664-9c6d-4c6f-99bc-0248f12ce9a7", // From your app.json
      });

      this.expoPushToken = tokenData.data;
      await this.saveTokenToServer(this.expoPushToken);

      // Set up notification listeners
      this.setupExpoNotificationHandlers();

      console.log(
        "✅ Expo notifications initialized with token:",
        this.expoPushToken
      );
    } catch (error) {
      console.error("Error initializing Expo notifications:", error);
    }
  }

  /**
   * Set up Firebase message handlers
   */
  private setupFirebaseMessageHandlers(): void {
    if (!messaging) return;

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage: RemoteMessage) => {
      console.log("📱 Firebase foreground message received:", remoteMessage);
      this.onForegroundMessage(remoteMessage);
    });

    // Handle notification taps when app is in background
    messaging().onNotificationOpenedApp((remoteMessage: RemoteMessage) => {
      console.log(
        "📱 Firebase notification caused app to open:",
        remoteMessage
      );
      this.onNotificationOpenedApp(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage: RemoteMessage | null) => {
        if (remoteMessage) {
          console.log(
            "📱 App opened from Firebase notification:",
            remoteMessage
          );
          this.onNotificationOpenedApp(remoteMessage);
        }
      });
  }

  /**
   * Set up Expo notification handlers
   */
  private setupExpoNotificationHandlers(): void {
    // Handle foreground notifications
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📱 Expo foreground notification received:", notification);
        this.onForegroundMessage({
          notification: {
            title: notification.request.content.title || undefined,
            body: notification.request.content.body || undefined,
          },
          data: notification.request.content.data as Record<string, string>,
        });
      });

    // Handle notification taps
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📱 Expo notification response received:", response);
        this.onNotificationOpenedApp({
          notification: {
            title: response.notification.request.content.title || undefined,
            body: response.notification.request.content.body || undefined,
          },
          data: response.notification.request.content.data as Record<
            string,
            string
          >,
        });
      });

    // Store subscriptions for cleanup
    this.foregroundSubscription = foregroundSubscription;
    this.responseSubscription = responseSubscription;
  }

  /**
   * Save token to server
   */
  private async saveTokenToServer(token: string): Promise<void> {
    try {
      console.log("📱 Token received:", token);

      // Store token for later use
      this.pendingFcmToken = token;
      await AsyncStorage.setItem("push_token", token);

      // Try to send to backend if WebView service is available
      if (this.webViewService) {
        await this.sendTokenToBackend(token);
      } else {
        console.log(
          "WebView service not available yet, token will be sent later"
        );
      }
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  /**
   * Send token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      if (!this.webViewService) {
        console.log("WebView service not available");
        return;
      }

      const success = await this.webViewService.sendFCMTokenToBackend(token);
      if (success) {
        console.log("✅ Token successfully sent to backend");
        this.pendingFcmToken = undefined; // Clear pending token
      } else {
        console.log("❌ Failed to send token to backend");
      }
    } catch (error) {
      console.error("Error sending token to backend:", error);
    }
  }

  /**
   * Set WebView service reference
   */
  public setWebViewService(webViewService: WebViewService): void {
    this.webViewService = webViewService;

    // If we have a pending token, try to send it now
    if (this.pendingFcmToken) {
      this.sendTokenToBackend(this.pendingFcmToken);
    }
  }

  /**
   * Handle foreground messages
   */
  private onForegroundMessage(remoteMessage: RemoteMessage): void {
    console.log("📱 Foreground message received:", remoteMessage);

    // Handle the message (show local notification, update UI, etc.)
    if (remoteMessage.notification) {
      // You can show a local notification here or update UI
      console.log("Notification:", remoteMessage.notification);

      // Example: Show alert for foreground messages
      // Alert.alert(
      //   remoteMessage.notification.title || 'New Message',
      //   remoteMessage.notification.body || 'You have a new message'
      // );
    }
  }

  /**
   * Handle notification taps
   */
  private onNotificationOpenedApp(remoteMessage: RemoteMessage): void {
    console.log("📱 Notification caused app to open:", remoteMessage);

    // Handle notification tap (navigate to specific screen, etc.)
    if (remoteMessage.data) {
      // Example: Navigate based on notification data
      // if (remoteMessage.data.screen) {
      //   // Navigate to specific screen
      // }
    }
  }

  /**
   * Clear token on logout
   */
  public async clearTokenOnLogout(): Promise<void> {
    try {
      console.log("🔄 Clearing token on logout...");

      // Delete the token from Firebase if available
      if (messaging) {
        await messaging().deleteToken();
      }

      // Clear stored tokens
      this.currentFcmToken = undefined;
      this.pendingFcmToken = undefined;
      this.expoPushToken = undefined;
      await AsyncStorage.removeItem("push_token");

      console.log("✅ Token cleared on logout");
    } catch (error) {
      console.error("Error clearing token on logout:", error);
    }
  }

  /**
   * Get current token
   */
  public getCurrentToken(): string | undefined {
    return this.currentFcmToken || this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      return await this.permissionService.checkNotificationPermission();
    } catch (error) {
      console.error("Error checking notification status:", error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      return await this.permissionService.requestNotificationPermission();
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Subscribe to a topic (Firebase only)
   */
  public async subscribeToTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.log(
          `📱 Topic subscription not available with Expo notifications: ${topic}`
        );
        return;
      }

      console.log(`📱 Subscribing to topic: ${topic}`);
      await messaging().subscribeToTopic(topic);
      console.log(`✅ Successfully subscribed to topic: ${topic}`);
    } catch (error) {
      console.error("Error subscribing to topic:", error);
    }
  }

  /**
   * Unsubscribe from a topic (Firebase only)
   */
  public async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.log(
          `📱 Topic unsubscription not available with Expo notifications: ${topic}`
        );
        return;
      }

      console.log(`📱 Unsubscribing from topic: ${topic}`);
      await messaging().unsubscribeFromTopic(topic);
      console.log(`✅ Successfully unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
    }
  }

  // Store subscriptions for cleanup
  private foregroundSubscription?: any;
  private responseSubscription?: any;

  /**
   * Cleanup subscriptions
   */
  public cleanup(): void {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
    }
    if (this.responseSubscription) {
      this.responseSubscription.remove();
    }
  }
}
