import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";

const { width, height } = Dimensions.get("window");

export interface CameraScreenProps {
  minPhotos: number;
  maxPhotos: number;
  cameraType: "back" | "front";
  onPhotosCompleted: (photos: string[]) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  minPhotos,
  maxPhotos,
  cameraType: initialCameraType,
  onPhotosCompleted,
  onClose,
  isVisible,
}) => {
  console.log("🔴 CameraScreen рендерится, isVisible:", isVisible);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<"back" | "front">(
    initialCameraType
  );
  const [flashMode, setFlashMode] = useState<"auto" | "on" | "off">("auto");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  console.log("🔴 CameraScreen permission:", permission);

  useEffect(() => {
    if (isVisible) {
      // Reset state when modal opens
      setCapturedPhotos([]);
      setCameraType(initialCameraType);
      setFlashMode("auto");
    }
  }, [isVisible, initialCameraType]);

  const capturePhoto = async () => {
    if (
      !cameraRef.current ||
      isCapturing ||
      capturedPhotos.length >= maxPhotos
    ) {
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: cameraType === "front" ? 0.98 : 0.95, // Выше качество для селфи
        base64: true,
        skipProcessing: cameraType === "front", // Пропускаем обработку для селфи
      });

      if (photo.base64) {
        setIsProcessing(true);

        // Для фронтальной камеры можно пропустить обработку для максимального качества
        let finalPhoto: string;
        if (cameraType === "front") {
          // Для селфи: минимальная обработка или без обработки
          finalPhoto = `data:image/jpeg;base64,${photo.base64}`;
        } else {
          // Для задней камеры: полная обработка
          finalPhoto = await processImage(photo.base64);
        }

        setCapturedPhotos((prev) => [...prev, finalPhoto]);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Ошибка", "Не удалось сделать фотографию");
    } finally {
      setIsCapturing(false);
    }
  };

  const processImage = async (base64: string): Promise<string> => {
    try {
      const imageUri = `data:image/jpeg;base64,${base64}`;

      // Для фронтальной камеры используем более высокое качество и сохраняем пропорции
      const isFrontCamera = cameraType === "front";

      const manipulations = [];

      if (isFrontCamera) {
        // Для селфи: сохраняем высокое качество, не сжимаем сильно
        manipulations.push({
          resize: {
            width: Math.min(1920, width * 2), // Меньший размер для селфи
            height: Math.min(1080, height * 2),
          },
        });
      } else {
        // Для задней камеры: стандартная обработка
        manipulations.push({
          resize: {
            width: Math.min(3840, width * 4),
            height: Math.min(2160, height * 4),
          },
        });
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulations,
        {
          compress: isFrontCamera ? 0.98 : 0.95, // Выше качество для селфи
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return result.base64
        ? `data:image/jpeg;base64,${result.base64}`
        : imageUri;
    } catch (error) {
      console.error("Error processing image:", error);
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashMode = () => {
    setFlashMode((current) => {
      switch (current) {
        case "auto":
          return "on";
        case "on":
          return "off";
        case "off":
          return "auto";
        default:
          return "auto";
      }
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case "auto":
        return "flash-auto";
      case "on":
        return "flash-on";
      case "off":
        return "flash-off";
      default:
        return "flash-auto";
    }
  };

  const deletePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
    setShowPhotoModal(false);
  };

  const showPhotoPreview = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const finishCapture = () => {
    if (capturedPhotos.length < minPhotos) {
      Alert.alert("Ошибка", `Минимум ${minPhotos} фотографий`);
      return;
    }
    onPhotosCompleted(capturedPhotos);
    onClose();
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.errorContainer}>
          <MaterialIcons name="camera-alt" size={80} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Проблема с камерой</Text>
          <Text style={styles.errorText}>
            Разрешение на использование камеры не предоставлено
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={requestPermission}
          >
            <Text style={styles.errorButtonText}>Запросить разрешение</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorButton} onPress={onClose}>
            <Text style={styles.errorButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide">
      <StatusBar hidden />
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              мин. {minPhotos} • макс. {maxPhotos} • снято{" "}
              {capturedPhotos.length}
            </Text>
            <View style={styles.headerButton} />
          </View>

          {/* Photo previews */}
          {capturedPhotos.length > 0 && (
            <View style={styles.photoPreviewContainer}>
              <FlatList
                data={capturedPhotos}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => showPhotoPreview(index)}
                    style={styles.photoPreviewItem}
                  >
                    <Image source={{ uri: item }} style={styles.photoPreview} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Controls */}
          <View
            style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}
          >
            {/* Finish button */}
            {capturedPhotos.length >= minPhotos && (
              <TouchableOpacity
                onPress={finishCapture}
                style={styles.finishButton}
              >
                <Ionicons name="checkmark" size={20} color="black" />
                <Text style={styles.finishButtonText}>Отправить</Text>
              </TouchableOpacity>
            )}

            {/* Camera controls */}
            <View style={styles.cameraControls}>
              {/* Flash button */}
              <TouchableOpacity
                onPress={toggleFlashMode}
                style={styles.controlButton}
              >
                <MaterialIcons name={getFlashIcon()} size={24} color="white" />
              </TouchableOpacity>

              {/* Capture button */}
              <TouchableOpacity
                onPress={capturePhoto}
                disabled={isCapturing || capturedPhotos.length >= maxPhotos}
                // style={[
                //   styles.captureButton,
                //   {
                //     opacity:
                //       isCapturing || capturedPhotos.length >= maxPhotos
                //         ? 0.5
                //         : 1,
                //   },
                // ]}
              >
                {isCapturing || isProcessing ? (
                  <ActivityIndicator color="black" size="small" />
                ) : (
                  <View style={styles.captureButtonInner}>
                    <View style={styles.captureButtonCircle} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Switch camera button */}
              <TouchableOpacity
                onPress={toggleCameraType}
                style={styles.controlButton}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>

        {/* Photo modal */}
        <Modal
          visible={showPhotoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPhotoModal(false)}
        >
          <View style={styles.modalContainer}>
            <Image
              source={{ uri: capturedPhotos[selectedPhotoIndex] }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPhotoModal(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={() => deletePhoto(selectedPhotoIndex)}
            >
              <Ionicons name="trash" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  photoPreviewContainer: {
    position: "absolute",
    bottom: 200,
    left: 0,
    right: 0,
    height: 100,
    paddingHorizontal: 20,
  },
  photoPreviewItem: {
    marginRight: 12,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 40,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  finishButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  captureButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 9999,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },
  errorButton: {
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  errorButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width * 0.95,
    height: height * 0.8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  modalCloseButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalDeleteButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: "red",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
