import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Vibration,
  ActivityIndicator,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { decryptData } from "../../../../utils/security";
import apiClient from "../../../../utils/api"; // 🟢 Import API Client

// 🟢 Định nghĩa kiểu dữ liệu trả về từ API Verify
interface VerifyResult {
  isValid: boolean;
  message: string;
  studentName: string;
  labName: string;
  timeSlot: string;
}

export default function SecurityScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<VerifyResult | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10, color: "white" }}>
          Cần quyền truy cập Camera để quét mã
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPerm}>
          <Text style={{ color: "white" }}>Cấp quyền ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({
    data: rawContent,
  }: BarcodeScanningResult) => {
    if (scanned || loading) return; // Chặn quét liên tục
    setScanned(true);
    Vibration.vibrate();

    try {
      setLoading(true);

      // 1. Phân tích URL để lấy phần mã hóa
      // Code tạo QR trước đó dùng format: .../check-in?data=ENCRYPTED_STRING
      const splitKey = "data=";
      if (!rawContent.includes(splitKey)) {
        throw new Error("Mã QR không đúng định dạng của hệ thống");
      }

      const encryptedPart = rawContent.split(splitKey)[1];

      // 2. Giải mã offline
      const decryptedString = decryptData(encryptedPart);
      if (!decryptedString) throw new Error("Giải mã thất bại");

      // 3. Parse JSON để lấy requestId
      const parsedData = JSON.parse(decryptedString);
      if (!parsedData.requestId)
        throw new Error("Dữ liệu không chứa Request ID");

      console.log("🚀 Checking Request ID:", parsedData.requestId);

      // 4. GỌI API VERIFY
      const response = await apiClient.post("/api/DoorRequests/verify-access", {
        requestId: parsedData.requestId,
      });

      // 5. Lưu kết quả từ Server
      setResultData(response.data);
    } catch (error: any) {
      console.error("Scan Error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể kiểm tra thông tin. Vui lòng thử lại.",
        [
          {
            text: "Đóng",
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper để đóng modal và reset
  const handleClose = () => {
    setResultData(null);
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Đang kiểm tra dữ liệu...</Text>
        </View>
      )}

      {/* Khung quét UI */}
      {!resultData && (
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.scanTitle}>QUÉT VÉ VÀO LAB</Text>
            <Text style={styles.scanSub}>Di chuyển camera vào vùng mã QR</Text>
          </View>
          <View style={styles.scanFrame}>
            <View
              style={[
                styles.corner,
                { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
              ]}
            />
            <View
              style={[
                styles.corner,
                { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
              ]}
            />
            <View
              style={[
                styles.corner,
                {
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: 4,
                  borderLeftWidth: 4,
                },
              ]}
            />
            <View
              style={[
                styles.corner,
                {
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: 4,
                  borderRightWidth: 4,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Modal Kết Quả */}
      <Modal visible={!!resultData} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.resultCard}>
            {/* Header: Xanh nếu Valid, Đỏ nếu Invalid */}
            <View
              style={[
                styles.resultHeader,
                {
                  backgroundColor: resultData?.isValid ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Feather
                name={resultData?.isValid ? "check-circle" : "x-circle"}
                size={48}
                color="white"
              />
              <Text style={styles.resultHeaderText}>
                {resultData?.isValid ? "HỢP LỆ" : "TỪ CHỐI"}
              </Text>
              <Text style={styles.resultHeaderSub}>{resultData?.message}</Text>
            </View>

            <View style={styles.contentBody}>
              {/* Chỉ hiển thị thông tin chi tiết nếu có dữ liệu trả về */}
              {resultData?.studentName && (
                <>
                  <View style={styles.infoRow}>
                    <Feather name="user" size={24} color="#64748b" />
                    <View style={styles.textWrap}>
                      <Text style={styles.label}>Sinh viên</Text>
                      <Text style={styles.value}>{resultData.studentName}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {resultData?.labName && (
                <>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="door-open"
                      size={24}
                      color="#64748b"
                    />
                    <View style={styles.textWrap}>
                      <Text style={styles.label}>Phòng Lab</Text>
                      <Text style={styles.value}>{resultData.labName}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {resultData?.timeSlot && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={24} color="#64748b" />
                  <View style={styles.textWrap}>
                    <Text style={styles.label}>Khung giờ</Text>
                    <Text style={[styles.value, { color: "#f97316" }]}>
                      {resultData.timeSlot}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: resultData?.isValid ? "#166534" : "#991b1b",
                },
              ]}
              onPress={handleClose}
            >
              <Text style={styles.closeText}>QUÉT TIẾP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  btnPerm: {
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: { color: "white", marginTop: 10, fontWeight: "600" },

  // Scan Frame
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  topOverlay: { position: "absolute", top: 80, alignItems: "center" },
  scanTitle: {
    color: "#f97316",
    fontSize: 24,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scanSub: { color: "white", fontSize: 14, opacity: 0.9, marginTop: 5 },
  scanFrame: { width: 280, height: 280, position: "relative" },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#f97316",
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
  },
  resultHeader: {
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  resultHeaderText: {
    color: "white",
    fontWeight: "900",
    fontSize: 24,
    marginTop: 10,
    letterSpacing: 1,
  },
  resultHeaderSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  contentBody: { padding: 25 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  textWrap: { marginLeft: 15, flex: 1 },
  label: { fontSize: 13, color: "#94a3b8", marginBottom: 2 },
  value: { fontSize: 17, fontWeight: "700", color: "#334155" },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
    marginLeft: 40,
  },

  closeBtn: {
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
