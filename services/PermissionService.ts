import { Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";

export interface PermissionStatus {
  camera: boolean;
  location: boolean;
  notification: boolean;
  mediaLibrary: boolean;
}

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Check status of all permissions
   */
  public async checkAllPermissions(): Promise<PermissionStatus> {
    try {
      const [
        cameraStatus,
        locationStatus,
        notificationStatus,
        mediaLibraryStatus,
      ] = await Promise.all([
        this.checkCameraPermission(),
        this.checkLocationPermission(),
        this.checkNotificationPermission(),
        this.checkMediaLibraryPermission(),
      ]);

      return {
        camera: cameraStatus,
        location: locationStatus,
        notification: notificationStatus,
        mediaLibrary: mediaLibraryStatus,
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return {
        camera: false,
        location: false,
        notification: false,
        mediaLibrary: false,
      };
    }
  }

  /**
   * Check if all required permissions are granted
   */
  public async hasAllRequiredPermissions(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return (
      permissions.camera &&
      permissions.location &&
      permissions.notification &&
      permissions.mediaLibrary
    );
  }

  /**
   * Request all permissions at once
   */
  public async requestAllPermissions(): Promise<PermissionStatus> {
    try {
      console.log("Requesting permissions...");

      const [
        cameraStatus,
        locationStatus,
        notificationStatus,
        mediaLibraryStatus,
      ] = await Promise.all([
        this.requestCameraPermission(),
        this.requestLocationPermission(),
        this.requestNotificationPermission(),
        this.requestMediaLibraryPermission(),
      ]);

      const result = {
        camera: cameraStatus,
        location: locationStatus,
        notification: notificationStatus,
        mediaLibrary: mediaLibraryStatus,
      };

      // Log results
      Object.entries(result).forEach(([key, value]) => {
        console.log(`${key} permission: ${value ? "granted" : "denied"}`);
      });

      return result;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return {
        camera: false,
        location: false,
        notification: false,
        mediaLibrary: false,
      };
    }
  }

  /**
   * Check camera permission
   */
  public async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking camera permission:", error);
      return false;
    }
  }

  /**
   * Request camera permission
   */
  public async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "This app needs access to your camera to take photos. Please enable camera permission in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => this.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      return false;
    }
  }

  /**
   * Check media library permission
   */
  public async checkMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking media library permission:", error);
      return false;
    }
  }

  /**
   * Request media library permission
   */
  public async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Media Library Permission Required",
          "This app needs access to your photo library to select images. Please enable photo library permission in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => this.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting media library permission:", error);
      return false;
    }
  }

  /**
   * Check location permission
   */
  public async checkLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking location permission:", error);
      return false;
    }
  }

  /**
   * Request location permission
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Location services are disabled. Please enable them in your device settings to use location features.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => this.openSettings() },
          ]
        );
        return false;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs access to your location to provide location-based services. Please enable location permission in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => this.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }

  /**
   * Check notification permission
   */
  public async checkNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking notification permission:", error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Notification Permission Required",
          "This app needs permission to send you notifications. Please enable notification permission in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => this.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Open device settings
   */
  public async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening settings:", error);
      Alert.alert(
        "Settings",
        "Please manually open your device settings to enable required permissions."
      );
    }
  }

  /**
   * Check if permission is permanently denied
   */
  public async isPermissionPermanentlyDenied(
    permission: "camera" | "location" | "notification" | "mediaLibrary"
  ): Promise<boolean> {
    try {
      let status;
      switch (permission) {
        case "camera":
          status = (await ImagePicker.getCameraPermissionsAsync()).status;
          break;
        case "mediaLibrary":
          status = (await ImagePicker.getMediaLibraryPermissionsAsync()).status;
          break;
        case "location":
          status = (await Location.getForegroundPermissionsAsync()).status;
          break;
        case "notification":
          status = (await Notifications.getPermissionsAsync()).status;
          break;
        default:
          return false;
      }
      return status === "denied";
    } catch (error) {
      console.error(
        "Error checking if permission is permanently denied:",
        error
      );
      return false;
    }
  }

  /**
   * Show permission rationale
   */
  public showPermissionRationale(
    permission: "camera" | "location" | "notification" | "mediaLibrary"
  ): void {
    let title = "";
    let message = "";

    switch (permission) {
      case "camera":
        title = "Camera Permission";
        message =
          "This app needs camera access to take photos for your account and reports.";
        break;
      case "mediaLibrary":
        title = "Photo Library Permission";
        message =
          "This app needs access to your photo library to select and upload images.";
        break;
      case "location":
        title = "Location Permission";
        message =
          "This app needs location access to provide location-based services and find nearby vehicles.";
        break;
      case "notification":
        title = "Notification Permission";
        message =
          "This app needs notification access to send you important updates and alerts.";
        break;
    }

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => this.openSettings() },
    ]);
  }

  /**
   * Request permission with rationale
   */
  public async requestPermissionWithRationale(
    permission: "camera" | "location" | "notification" | "mediaLibrary"
  ): Promise<boolean> {
    const isPermanentlyDenied = await this.isPermissionPermanentlyDenied(
      permission
    );

    if (isPermanentlyDenied) {
      this.showPermissionRationale(permission);
      return false;
    }

    switch (permission) {
      case "camera":
        return await this.requestCameraPermission();
      case "mediaLibrary":
        return await this.requestMediaLibraryPermission();
      case "location":
        return await this.requestLocationPermission();
      case "notification":
        return await this.requestNotificationPermission();
      default:
        return false;
    }
  }
}
