import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  ArrowLeft,
} from "lucide-react-native";
import apiClient from "../../../../utils/api";

interface VerifyResultData {
  isValid: boolean;
  message: string;
  studentName?: string;
  labName?: string;
  timeSlot?: string;
}

export default function SecurityScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // State kết quả
  const [scanResult, setScanResult] = useState<VerifyResultData | null>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({
    data: rawContent,
  }: BarcodeScanningResult) => {
    if (scanned || loading) return;
    setScanned(true);
    Vibration.vibrate();

    try {
      console.log("🔍 Scanned Content:", rawContent);
      let parsedData;
      try {
        parsedData = JSON.parse(rawContent);
      } catch (e) {
        throw new Error("Mã QR không hợp lệ (Sai định dạng JSON).");
      }

      const requestId = parsedData?.requestId;
      if (!requestId) {
        throw new Error("Mã QR thiếu thông tin ID yêu cầu.");
      }

      setLoading(true);

      // Gọi API xác thực
      const response = await apiClient.post("/api/DoorRequests/verify-access", {
        requestId: requestId,
      });

      // --- LOGIC FIX: Xử lý linh hoạt cấu trúc trả về ---
      const resBody = response.data;

      // Kiểm tra xem dữ liệu nằm trong resBody.data hay nằm trực tiếp ở resBody
      // (Phòng trường hợp interceptor của axios đã bóc tách lớp data đầu tiên)
      const finalData = resBody.data ? resBody.data : resBody;

      if (finalData && typeof finalData.isValid !== "undefined") {
        setScanResult({
          isValid: finalData.isValid,
          message: finalData.message || "Xác thực thành công",
          studentName: finalData.studentName,
          labName: finalData.labName,
          timeSlot: finalData.timeSlot,
        });
      } else {
        setScanResult({
          isValid: false,
          message: resBody.message || "Không thể xác định trạng thái mã.",
        });
      }

      setResultModalVisible(true);
    } catch (error: any) {
      console.error("Verify Error:", error);
      let errorMessage = "Lỗi kết nối hệ thống.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setScanResult({
        isValid: false,
        message: errorMessage,
      });
      setResultModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setResultModalVisible(false);
    setScanResult(null);
    // Đợi modal đóng hẳn mới cho phép quét tiếp để tránh lag
    setTimeout(() => setScanned(false), 800);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={{ color: "white", marginBottom: 20 }}>
          Cần quyền Camera để tiếp tục
        </Text>
        <TouchableOpacity style={styles.btnPerm} onPress={requestPermission}>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Cấp quyền ngay
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#EA580C" />
              ) : (
                <ScanLine size={120} color="rgba(234, 88, 12, 0.6)" />
              )}
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}>
            <Text style={styles.instructionText}>
              Đưa mã QR vào khung để quét tự động
            </Text>
          </View>
        </View>
      </CameraView>

      {/* --- MODAL KẾT QUẢ --- */}
      <Modal
        visible={resultModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                borderColor: scanResult?.isValid ? "#22C55E" : "#EF4444",
                borderWidth: 2,
              },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              {scanResult?.isValid ? (
                <CheckCircle2 size={70} color="#22C55E" />
              ) : (
                <XCircle size={70} color="#EF4444" />
              )}
            </View>

            <Text
              style={[
                styles.resultTitle,
                { color: scanResult?.isValid ? "#15803D" : "#B91C1C" },
              ]}
            >
              {scanResult?.isValid ? "HỢP LỆ" : "TỪ CHỐI"}
            </Text>

            <Text style={styles.resultMessage}>{scanResult?.message}</Text>

            {scanResult?.isValid && (
              <View style={styles.infoBox}>
                {scanResult.studentName && (
                  <View style={styles.infoRow}>
                    <User size={18} color="#64748B" />
                    <Text style={styles.infoText}>
                      {scanResult.studentName}
                    </Text>
                  </View>
                )}
                {scanResult.labName && (
                  <View style={styles.infoRow}>
                    <MapPin size={18} color="#64748B" />
                    <Text style={styles.infoText}>{scanResult.labName}</Text>
                  </View>
                )}
                {scanResult.timeSlot && (
                  <View style={styles.infoRow}>
                    <Clock size={18} color="#64748B" />
                    <Text style={styles.infoText}>{scanResult.timeSlot}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: scanResult?.isValid ? "#166534" : "#DC2626",
                },
              ]}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>Quét tiếp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {scanned && !resultModalVisible && !loading && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Nhấn để quét lại
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  middleContainer: { flexDirection: "row", flex: 1.5 },
  focusedContainer: {
    flex: 4,
    borderColor: "#EA580C",
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  btnPerm: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 10,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
  },
  resultMessage: {
    fontSize: 17,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#F1F5F9",
    width: "100%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { fontSize: 16, color: "#1E293B", fontWeight: "600", flex: 1 },
  closeButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  rescanButton: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
});
