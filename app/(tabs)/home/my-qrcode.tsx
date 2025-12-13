import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { FontAwesome5 } from "@expo/vector-icons";
import { encryptData } from "../../../utils/security";

export default function StudentCardScreen() {
  // 1. Dữ liệu thật
  const studentProfile = {
    id: "SV_20215001",
    name: "Nguyễn Văn Sinh Viên",
    role: "Sinh Viên",
    class: "KTPM_K17",
    valid_until: "2025-12-31",
  };

  // 2. Mã hóa dữ liệu
  const encryptedPayload = encryptData(studentProfile);

  // 3. TẠO URL GIẢ (Trick)
  // Camera thường sẽ thấy đây là một Link và ẩn phần mã hóa đi
  // Phần mã hóa nằm sau dấu "?code="
  const qrUrl = `https://canh-bao-bao-mat.vn/vui-long-dung-app-noi-bo?code=${encryptedPayload}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Thẻ Sinh Viên Điện Tử</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="university" size={24} color="white" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.uniName}>TRƯỜNG ĐH FPT</Text>
            <Text style={styles.uniSub}>STUDENT ID CARD</Text>
          </View>
        </View>

        <View style={styles.qrWrapper}>
          <QRCode value={qrUrl} size={220} quietZone={10} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.studentName}>{studentProfile.name}</Text>
          <Text style={styles.mssv}>MSSV: {studentProfile.id}</Text>
          <Text style={styles.classInfo}>{studentProfile.class}</Text>
        </View>

        <View style={styles.footerTag}>
          <Text style={styles.validText}>
            HSD: {studentProfile.valid_until}
          </Text>
        </View>
      </View>

      <Text style={styles.instruction}>
        Mã được bảo mật. Chỉ App nội bộ mới quét được thông tin chi tiết.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    alignItems: "center",
    paddingBottom: 20,
  },
  cardHeader: {
    width: "100%",
    backgroundColor: "#f97316",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uniName: { color: "white", fontWeight: "bold", fontSize: 14 },
  uniSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, letterSpacing: 1 },
  qrWrapper: {
    marginTop: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
  },
  infoContainer: { alignItems: "center", marginTop: 20 },
  studentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
  },
  mssv: { fontSize: 16, color: "#666", marginTop: 5 },
  classInfo: {
    fontSize: 16,
    color: "#f97316",
    fontWeight: "500",
    marginTop: 5,
  },
  footerTag: {
    marginTop: 20,
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  validText: { color: "#f97316", fontSize: 12 },
  instruction: {
    marginTop: 30,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
