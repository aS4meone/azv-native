import React, { createContext, useContext, useState, useCallback } from "react";

export interface CameraContextType {
  isCameraVisible: boolean;
  cameraOptions: {
    minPhotos: number;
    maxPhotos: number;
    cameraType: "back" | "front";
  };
  openCamera: (options: {
    minPhotos?: number;
    maxPhotos?: number;
    cameraType?: "back" | "front";
  }) => Promise<string[]>;
  closeCamera: () => void;
  onPhotosCompleted: (photos: string[]) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error("useCamera must be used within a CameraProvider");
  }
  return context;
};

interface CameraProviderProps {
  children: React.ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraOptions, setCameraOptions] = useState({
    minPhotos: 1,
    maxPhotos: 5,
    cameraType: "back" as "back" | "front",
  });
  const [resolvePromise, setResolvePromise] = useState<
    ((photos: string[]) => void) | null
  >(null);

  const openCamera = useCallback(
    (options: {
      minPhotos?: number;
      maxPhotos?: number;
      cameraType?: "back" | "front";
    }) => {
      return new Promise<string[]>((resolve) => {
        setCameraOptions({
          minPhotos: options.minPhotos || 1,
          maxPhotos: options.maxPhotos || 5,
          cameraType: options.cameraType || "back",
        });
        setResolvePromise(() => resolve);
        setIsCameraVisible(true);
      });
    },
    []
  );

  const closeCamera = useCallback(() => {
    setIsCameraVisible(false);
    if (resolvePromise) {
      resolvePromise([]);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const onPhotosCompleted = useCallback(
    (photos: string[]) => {
      setIsCameraVisible(false);
      if (resolvePromise) {
        resolvePromise(photos);
        setResolvePromise(null);
      }
    },
    [resolvePromise]
  );

  const value: CameraContextType = {
    isCameraVisible,
    cameraOptions,
    openCamera,
    closeCamera,
    onPhotosCompleted,
  };

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
};
