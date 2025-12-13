import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Vibration,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { decryptData } from "../../../../utils/security";

interface StudentInfo {
  id: string;
  name: string;
  class: string;
}

export default function SecurityScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState<StudentInfo | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10 }}>Cần quyền truy cập Camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPerm}>
          <Text style={{ color: "white" }}>Cấp quyền ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({
    data: rawContent,
  }: BarcodeScanningResult) => {
    setScanned(true);
    Vibration.vibrate();

    try {
      // rawContent = "https://canh-bao...?code=U2FsdGVk..."

      // 1. Định nghĩa từ khóa phân tách
      const splitKey = "?code=";

      // 2. Kiểm tra xem có đúng Link của trường không
      if (!rawContent.includes(splitKey)) {
        throw new Error("Mã QR không đúng định dạng URL");
      }

      // 3. Cắt lấy phần đuôi (Sau dấu = )
      const encryptedPart = rawContent.split(splitKey)[1];

      // 4. Giải mã phần đuôi
      const result = decryptData(encryptedPart);

      // 5. Kiểm tra kết quả
      if (result && result.id) {
        setData(result);
      } else {
        throw new Error("Giải mã thất bại");
      }
    } catch (error) {
      // Xử lý khi quét nhầm mã QR ngoài
      Alert.alert(
        "Mã không hợp lệ",
        "Vui lòng quét đúng mã QR Thẻ sinh viên của nhà trường.",
        [{ text: "Quét lại", onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.scanTitle}>MÁY QUÉT THẺ</Text>
          <Text style={styles.scanSub}>Chỉ nhận diện mã QR nội bộ</Text>
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
              { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
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

      <Modal visible={!!data} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.resultCard}>
            <View style={styles.successHeader}>
              <Feather name="check-circle" size={40} color="white" />
              <Text style={styles.successText}>HỢP LỆ</Text>
            </View>

            <View style={styles.contentBody}>
              <View style={styles.infoRow}>
                <Feather name="user" size={24} color="#555" />
                <View style={styles.textWrap}>
                  <Text style={styles.label}>Họ và tên</Text>
                  <Text style={styles.value}>{data?.name}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="id-card-outline" size={24} color="#555" />
                <View style={styles.textWrap}>
                  <Text style={styles.label}>Mã số</Text>
                  <Text style={styles.value}>{data?.id}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="google-classroom"
                  size={24}
                  color="#555"
                />
                <View style={styles.textWrap}>
                  <Text style={styles.label}>Lớp</Text>
                  <Text style={styles.value}>{data?.class}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setData(null);
                setScanned(false);
              }}
            >
              <Text style={styles.closeText}>XONG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  btnPerm: {
    backgroundColor: "#2980b9",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  topOverlay: { position: "absolute", top: 60, alignItems: "center" },
  scanTitle: { color: "#00ff00", fontSize: 20, fontWeight: "bold" },
  scanSub: { color: "white", fontSize: 14, opacity: 0.8 },
  scanFrame: { width: 260, height: 260, position: "relative" },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#00ff00",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  successHeader: {
    backgroundColor: "#27ae60",
    padding: 20,
    alignItems: "center",
  },
  successText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 5,
  },
  contentBody: { padding: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  textWrap: { marginLeft: 15 },
  label: { fontSize: 12, color: "#888" },
  value: { fontSize: 18, fontWeight: "bold", color: "#333" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 5 },
  closeBtn: {
    backgroundColor: "#34495e",
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "white", fontWeight: "bold" },
});
