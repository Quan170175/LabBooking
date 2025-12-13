import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";

// 🟢 IMPORT API CLIENT
import apiClient from "../../../utils/api";

// --- INTERFACES ---
interface SelectedFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

interface FileRowProps {
  label: string;
  file: SelectedFile | null;
  onPick: () => void;
  onClear: () => void;
  required?: boolean;
}

export default function EmailComposerScreen() {
  // --- STATE ---
  const [studentFile, setStudentFile] = useState<SelectedFile | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<SelectedFile | null>(
    null
  );
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref Editor
  const richText = useRef<RichEditor>(null);

  // --- LOGIC FUNCTIONS ---

  // 1. Chọn file (Giữ nguyên logic DocumentPicker)
  const pickFile = async (
    setFileAction: React.Dispatch<React.SetStateAction<SelectedFile | null>>
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileAction({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || undefined,
          size: file.size,
        });
      }
    } catch (err) {
      console.log("Lỗi chọn file:", err);
    }
  };

  // 2. Insert biến vào editor
  const insertVariable = (variable: string) => {
    richText.current?.insertText(variable);
  };

  // 3. GỬI EMAIL (Sử dụng apiClient)
  const handleSendEmail = async () => {
    // Validate
    if (!studentFile) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn file danh sách sinh viên (Excel)."
      );
      return;
    }
    if (!subject.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề email.");
      return;
    }
    if (!bodyHtml || bodyHtml === "<p><br></p>") {
      Alert.alert("Thiếu thông tin", "Vui lòng soạn nội dung email.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Append Text
      formData.append("Subject", subject);
      formData.append("Body", bodyHtml);

      // Append File 1 (Bắt buộc)
      formData.append("StudentFile", {
        uri: studentFile.uri,
        name: studentFile.name,
        type:
          studentFile.mimeType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      } as any);

      // Append File 2 (Optional)
      if (attachmentFile) {
        formData.append("AttachmentFile", {
          uri: attachmentFile.uri,
          name: attachmentFile.name,
          type: attachmentFile.mimeType || "application/octet-stream",
        } as any);
      }

      console.log("🚀 Đang gửi request...");

      // 🟢 GỌI API QUA CLIENT
      const response = await apiClient.post(
        "/api/Emails/send-custom-email",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Kết quả:", response.data);
      Alert.alert("Thành công", "Hệ thống đang tiến hành gửi email!");
    } catch (error: any) {
      console.error("❌ Lỗi API:", error);
      // apiClient đã xử lý 401/403, ở đây chỉ catch lỗi logic hoặc 500
      const msg =
        error.response?.data?.message || "Có lỗi xảy ra khi gửi email.";
      Alert.alert(
        "Gửi thất bại",
        typeof msg === "string" ? msg : JSON.stringify(msg)
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER UI ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Soạn Email Hàng Loạt</Text>
          <Text style={styles.subtitle}>
            Gửi thông báo tới danh sách sinh viên
          </Text>
        </View>

        {/* --- KHU VỰC CHỌN FILE --- */}
        <View style={styles.section}>
          <FileRow
            label="1. Danh sách SV (Excel)"
            file={studentFile}
            onPick={() => pickFile(setStudentFile)}
            onClear={() => setStudentFile(null)}
            required
          />
          <View style={{ height: 10 }} />
          <FileRow
            label="2. File đính kèm (Tùy chọn)"
            file={attachmentFile}
            onPick={() => pickFile(setAttachmentFile)}
            onClear={() => setAttachmentFile(null)}
          />
        </View>

        {/* --- KHU VỰC NHẬP LIỆU --- */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Tiêu đề Email <Text style={{ color: "red" }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Thông báo nghỉ học..."
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={[styles.label, { marginTop: 15 }]}>
            Nội dung Email <Text style={{ color: "red" }}>*</Text>
          </Text>

          {/* Thanh công cụ chèn biến */}
          <View style={styles.variableBar}>
            <Text style={styles.varLabel}>Chèn nhanh:</Text>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => insertVariable("{{FullName}}")}
            >
              <Text style={styles.chipText}>+ Tên SV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => insertVariable("{{Email}}")}
            >
              <Text style={styles.chipText}>+ Email</Text>
            </TouchableOpacity>
          </View>

          {/* Editor Container */}
          <View style={styles.editorWrapper}>
            <RichToolbar
              editor={richText}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.heading1,
                actions.insertBulletsList,
                actions.setTextColor,
              ]}
              iconTint="#64748B"
              selectedIconTint="#EA580C"
              style={styles.toolbar}
            />
            <RichEditor
              ref={richText}
              onChange={setBodyHtml}
              placeholder="Nhập nội dung tại đây..."
              initialHeight={200}
              editorStyle={{ backgroundColor: "white", color: "#334155" }}
            />
          </View>
        </View>

        {/* --- NÚT GỬI --- */}
        <View style={styles.footer}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#EA580C" />
            </View>
          ) : (
            <TouchableOpacity style={styles.btnSend} onPress={handleSendEmail}>
              <Text style={styles.btnSendText}>GỬI THÔNG BÁO</Text>
              <Ionicons
                name="send"
                size={20}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- SUB COMPONENTS ---
const FileRow = ({ label, file, onPick, onClear, required }: FileRowProps) => (
  <View style={styles.fileCard}>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Text style={styles.fileLabel}>
        {label} {required && <Text style={{ color: "red" }}>*</Text>}
      </Text>
    </View>

    {file ? (
      <View style={styles.fileSelected}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name="document-text" size={24} color="#16A34A" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileSize}>
              {(file.size ? file.size / 1024 : 0).toFixed(1)} KB
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClear} style={{ padding: 5 }}>
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={styles.btnPick} onPress={onPick}>
        <Ionicons name="cloud-upload-outline" size={20} color="#64748B" />
        <Text style={styles.btnPickText}>Chọn file từ thiết bị</Text>
      </TouchableOpacity>
    )}
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED" },
  scrollContent: { padding: 16, paddingBottom: 50 },
  centered: { alignItems: "center", justifyContent: "center" },

  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

  section: { marginBottom: 20 },

  // File Picker Styles
  fileCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  fileLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  btnPick: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    marginTop: 4,
  },
  btnPickText: { color: "#64748B", fontWeight: "500", marginLeft: 8 },
  fileSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 4,
  },
  fileName: { fontSize: 14, fontWeight: "600", color: "#15803D" },
  fileSize: { fontSize: 12, color: "#166534" },

  // Input Styles
  label: { fontSize: 15, fontWeight: "700", color: "#334155", marginBottom: 8 },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    fontSize: 16,
    color: "#0F172A",
  },

  // Variable Bar
  variableBar: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  varLabel: { fontSize: 12, color: "#64748B", marginRight: 8 },
  chip: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#7DD3FC",
  },
  chipText: { color: "#0284C7", fontWeight: "bold", fontSize: 12 },

  // Editor Styles
  editorWrapper: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "white",
  },
  toolbar: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },

  // Footer Button
  footer: { marginTop: 10 },
  btnSend: {
    flexDirection: "row",
    backgroundColor: "#EA580C",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnSendText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
