import { useState, useCallback } from "react";
import { CameraService } from "../services/CameraService";

export interface UseCameraOptions {
  minPhotos?: number;
  maxPhotos?: number;
  cameraType?: "back" | "front";
}

export const useCamera = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraOptions, setCameraOptions] = useState<UseCameraOptions>({});
  const [onPhotosComplete, setOnPhotosComplete] = useState<
    ((photos: string[]) => void) | null
  >(null);

  const openCamera = useCallback(
    (options: UseCameraOptions = {}, callback?: (photos: string[]) => void) => {
      setCameraOptions(options);
      setOnPhotosComplete(() => callback || null);
      setIsCameraOpen(true);
    },
    []
  );

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    setOnPhotosComplete(null);
  }, []);

  const handlePhotosCompleted = useCallback(
    (photos: string[]) => {
      if (onPhotosComplete) {
        onPhotosComplete(photos);
      }
      closeCamera();
    },
    [onPhotosComplete, closeCamera]
  );

  // Fallback methods using ImagePicker for compatibility
  const capturePhoto = useCallback(
    async (cameraType: "back" | "front" = "back") => {
      const cameraService = CameraService.getInstance();
      return await cameraService.capturePhoto({ cameraType });
    },
    []
  );

  const captureMultiplePhotos = useCallback(
    async (options: UseCameraOptions = {}) => {
      const cameraService = CameraService.getInstance();
      return await cameraService.captureMultiplePhotos(options);
    },
    []
  );

  const pickSinglePhoto = useCallback(async () => {
    const cameraService = CameraService.getInstance();
    return await cameraService.pickSinglePhoto();
  }, []);

  const pickMultiplePhotos = useCallback(async (maxImages: number = 10) => {
    const cameraService = CameraService.getInstance();
    return await cameraService.pickMultiplePhotos(maxImages);
  }, []);

  return {
    // Camera screen state
    isCameraOpen,
    cameraOptions,

    // Camera screen methods
    openCamera,
    closeCamera,
    handlePhotosCompleted,

    // Fallback methods
    capturePhoto,
    captureMultiplePhotos,
    pickSinglePhoto,
    pickMultiplePhotos,
  };
};
