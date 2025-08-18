import * as Location from "expo-location";
import { AppConstants } from "../constants/AppConstants";
import { Alert } from "react-native";

export interface LocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationError {
  code: string;
  message: string;
}

export class LocationService {
  private static instance: LocationService;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature."
        );
        return false;
      }

      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required to get your current position."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  /**
   * Get current position
   */
  public async getCurrentPosition(): Promise<LocationPosition | LocationError> {
    try {
      console.log("📍 Location request from web page");

      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          code: "LOCATION_DISABLED",
          message: "Location services are disabled",
        };
      }

      // Check permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const permissionResult =
          await Location.requestForegroundPermissionsAsync();
        if (permissionResult.status !== "granted") {
          return {
            code: "PERMISSION_DENIED",
            message: "Location permission denied",
          };
        }
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: AppConstants.locationTimeout,
        mayShowUserSettingsDialog: true,
      });

      console.log(
        "📍 Location received:",
        position.coords.latitude,
        position.coords.longitude
      );

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      };
    } catch (error: any) {
      console.error("Error getting location:", error);

      // Map common error codes
      let errorCode = "UNKNOWN_ERROR";
      let errorMessage = error.message || "Unknown error occurred";

      if (error.code === "E_LOCATION_SERVICES_DISABLED") {
        errorCode = "LOCATION_DISABLED";
        errorMessage = "Location services are disabled";
      } else if (error.code === "E_LOCATION_UNAVAILABLE") {
        errorCode = "LOCATION_UNAVAILABLE";
        errorMessage = "Location is temporarily unavailable";
      } else if (error.code === "E_LOCATION_TIMEOUT") {
        errorCode = "TIMEOUT";
        errorMessage = "Location request timed out";
      }

      return {
        code: errorCode,
        message: errorMessage,
      };
    }
  }

  /**
   * Get current position with high accuracy
   */
  public async getCurrentPositionHighAccuracy(): Promise<
    LocationPosition | LocationError
  > {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          code: "PERMISSION_DENIED",
          message: "Location permission denied",
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: AppConstants.geolocationTimeout,
        mayShowUserSettingsDialog: true,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      };
    } catch (error: any) {
      console.error("Error getting high accuracy location:", error);
      return {
        code: "HIGH_ACCURACY_ERROR",
        message: error.message || "Failed to get high accuracy location",
      };
    }
  }

  /**
   * Watch position changes
   */
  public async watchPosition(
    onSuccess: (position: LocationPosition) => void,
    onError: (error: LocationError) => void,
    options: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    } = {}
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        onError({
          code: "PERMISSION_DENIED",
          message: "Location permission denied",
        });
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.High,
          timeInterval: options.timeInterval || 1000,
          distanceInterval: options.distanceInterval || 1,
        },
        (position) => {
          onSuccess({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          });
        }
      );

      return subscription;
    } catch (error: any) {
      console.error("Error watching position:", error);
      onError({
        code: "WATCH_ERROR",
        message: error.message || "Failed to watch position",
      });
      return null;
    }
  }

  /**
   * Check if location services are available
   */
  public async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error("Error checking location services:", error);
      return false;
    }
  }

  /**
   * Check location permission status
   */
  public async getPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error getting permission status:", error);
      return Location.PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * Open device location settings
   */
  public async openLocationSettings(): Promise<void> {
    try {
      await Location.enableNetworkProviderAsync();
    } catch (error) {
      console.error("Error opening location settings:", error);
      Alert.alert(
        "Settings",
        "Please manually enable location services in your device settings."
      );
    }
  }

  /**
   * Calculate distance between two points (in meters)
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
