import * as ImagePicker from "expo-image-picker";
import { AppConstants } from "../constants/AppConstants";
import { Alert } from "react-native";
import { CameraScreen } from "../components/CameraScreen";

export interface CameraOptions {
  cameraType?: "back" | "front";
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface MultiplePhotoOptions {
  minPhotos?: number;
  maxPhotos?: number;
  cameraType?: "back" | "front";
}

export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Request camera and media library permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to capture photos."
        );
        return false;
      }

      // Request media library permissions
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryPermission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library access is required to select photos."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  }

  /**
   * Capture a single photo with camera
   */
  public async capturePhoto(
    options: CameraOptions = {}
  ): Promise<string | null> {
    try {
      console.log(
        "🔍 CameraService.capturePhoto - cameraType:",
        options.cameraType
      );

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: options.quality || 0.85,
        base64: true,
        cameraType:
          options.cameraType === "front"
            ? ImagePicker.CameraType.front
            : ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          return this.processImage(asset.base64);
        }
      }

      return null;
    } catch (error) {
      console.error("Error capturing photo:", error);
      return null;
    }
  }

  /**
   * Pick a single photo from gallery
   */
  public async pickSinglePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          return this.processImage(asset.base64);
        }
      }

      return null;
    } catch (error) {
      console.error("Error picking photo:", error);
      return null;
    }
  }

  /**
   * Pick multiple photos from gallery
   */
  public async pickMultiplePhotos(
    maxImages: number = AppConstants.defaultMaxPhotos
  ): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
        base64: true,
        allowsMultipleSelection: true,
        selectionLimit: maxImages,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Images: string[] = [];

        for (const asset of result.assets) {
          if (asset.base64) {
            const processedImage = this.processImage(asset.base64);
            if (processedImage) {
              base64Images.push(processedImage);
            }
          }
        }

        return base64Images;
      }

      return [];
    } catch (error) {
      console.error("Error picking multiple photos:", error);
      return [];
    }
  }

  /**
   * Capture multiple photos with camera
   */
  public async captureMultiplePhotos(
    options: MultiplePhotoOptions = {}
  ): Promise<string[]> {
    try {
      const {
        minPhotos = AppConstants.defaultMinPhotos,
        maxPhotos = AppConstants.defaultMaxPhotos,
        cameraType = "back",
      } = options;

      console.log("🔍 CameraService.captureMultiplePhotos - options:", options);

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const capturedPhotos: string[] = [];

      for (let i = 0; i < maxPhotos; i++) {
        const currentCount = i + 1;
        const isRequired = currentCount <= minPhotos;

        try {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 0.85,
            base64: true,
            cameraType:
              cameraType === "front"
                ? ImagePicker.CameraType.front
                : ImagePicker.CameraType.back,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.base64) {
              const processedImage = this.processImage(asset.base64);
              if (processedImage) {
                capturedPhotos.push(processedImage);
              }
            }
          } else {
            // User canceled
            if (isRequired && capturedPhotos.length < minPhotos) {
              Alert.alert(
                "Required Photos",
                `You need to capture at least ${minPhotos} photos. Current count: ${capturedPhotos.length}`
              );
              i--; // Retry this iteration
              continue;
            } else {
              // User chose to stop or we have enough photos
              break;
            }
          }

          // Ask if user wants to continue (only after minimum is met)
          if (capturedPhotos.length >= minPhotos && currentCount < maxPhotos) {
            const continueCapture = await this.showContinueDialog(
              capturedPhotos.length,
              maxPhotos
            );
            if (!continueCapture) {
              break;
            }
          }
        } catch (error) {
          console.error(`Error capturing photo ${currentCount}:`, error);
          if (isRequired) {
            Alert.alert(
              "Error",
              `Failed to capture photo ${currentCount}. Please try again.`
            );
            i--; // Retry this iteration
          }
        }
      }

      return capturedPhotos;
    } catch (error) {
      console.error("Error capturing multiple photos:", error);
      return [];
    }
  }

  /**
   * Open custom camera screen for multiple photos (similar to Flutter version)
   */
  public async openCameraScreen(
    options: MultiplePhotoOptions = {}
  ): Promise<string[]> {
    const {
      minPhotos = AppConstants.defaultMinPhotos,
      maxPhotos = AppConstants.defaultMaxPhotos,
      cameraType = "back",
    } = options;

    console.log("🔍 CameraService.openCameraScreen - options:", options);

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return [];
    }

    // This method now requires the CameraContext to be available
    // The actual implementation will be handled by the context
    console.log(
      "🔍 Custom camera screen requested - use CameraContext.openCamera instead"
    );

    // For backward compatibility, fall back to ImagePicker
    return this.captureMultiplePhotos(options);
  }

  /**
   * Show dialog asking if user wants to continue capturing photos
   */
  private async showContinueDialog(
    currentCount: number,
    maxCount: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Continue Capturing?",
        `You have captured ${currentCount} photos. Would you like to capture more? (Max: ${maxCount})`,
        [
          {
            text: "Stop",
            onPress: () => resolve(false),
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * Process and format image as base64 data URL
   */
  private processImage(base64: string): string {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

      // Return as data URL
      return `data:image/jpeg;base64,${cleanBase64}`;
    } catch (error) {
      console.error("Error processing image:", error);
      return `data:image/jpeg;base64,${base64}`;
    }
  }

  /**
   * Get image picker options for camera
   */
  private getCameraOptions(
    cameraType: "back" | "front" = "back"
  ): ImagePicker.ImagePickerOptions {
    return {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.85,
      base64: true,
      cameraType:
        cameraType === "front"
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back,
    };
  }

  /**
   * Get image picker options for gallery
   */
  private getGalleryOptions(
    allowMultiple: boolean = false
  ): ImagePicker.ImagePickerOptions {
    return {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      base64: true,
      allowsMultipleSelection: allowMultiple,
    };
  }
}
