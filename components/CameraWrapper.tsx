import React from "react";
import { CameraScreen } from "./CameraScreen";
import { useCamera } from "../contexts/CameraContext";

export const CameraWrapper: React.FC = () => {
  const { isCameraVisible, cameraOptions, closeCamera, onPhotosCompleted } =
    useCamera();

  if (!isCameraVisible) {
    return null;
  }

  return (
    <CameraScreen
      minPhotos={cameraOptions.minPhotos}
      maxPhotos={cameraOptions.maxPhotos}
      cameraType={cameraOptions.cameraType}
      onPhotosCompleted={onPhotosCompleted}
      onClose={closeCamera}
      isVisible={isCameraVisible}
    />
  );
};
