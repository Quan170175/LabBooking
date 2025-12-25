import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- IMPORTS ---
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";

import apiClient from "../../../utils/api";

// FIX LỖI TS: Ép kiểu để không bị gạch chân đỏ
const FS = FileSystem as any;

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
  onDownloadTemplate?: () => void; // Thêm lại prop này để dùng nút cũ
}

export default function EmailComposerScreen() {
  const [studentFile, setStudentFile] = useState<SelectedFile | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<SelectedFile | null>(
    null
  );
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loading, setLoading] = useState(false);

  const richText = useRef<RichEditor>(null);

  // ========================================================================
  // LOGIC TẢI FILE: ĐỌC -> GHI -> SHARE
  // ========================================================================
  const handleDownloadTemplate = async () => {
    try {
      // 1. Load Asset
      const templateAsset = Asset.fromModule(
        require("../../../assets/files/students_mail_template.xlsx")
      );
      await templateAsset.downloadAsync(); // Đảm bảo asset đã tải về máy

      // 2. Đọc file asset thành chuỗi Base64
      // Lưu ý: Dùng localUri nếu có, nếu không dùng uri
      const uriToRead = templateAsset.localUri || templateAsset.uri;
      const fileContent = await FS.readAsStringAsync(uriToRead, {
        encoding: "base64",
      });

      // 3. Tạo đường dẫn lưu tạm
      const cacheDir = FS.cacheDirectory || FS.documentDirectory;
      const fileUri = cacheDir + "students_mail_template.xlsx";

      // 4. Ghi file vào bộ nhớ tạm
      await FS.writeAsStringAsync(fileUri, fileContent, {
        encoding: "base64",
      });

      // 5. Mở hộp thoại chia sẻ (Share Sheet) để user tự lưu
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          UTI: "com.microsoft.excel.xlsx",
          dialogTitle: "Lưu file mẫu",
        });
      } else {
        Alert.alert("Lỗi", "Thiết bị không hỗ trợ chia sẻ.");
      }
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      Alert.alert(
        "Lỗi",
        "Không thể lấy file mẫu. Kiểm tra lại thư mục assets."
      );
    }
  };

  // --- LOGIC GỬI MAIL ---
  const handleSendEmail = async () => {
    if (!studentFile || !subject || !bodyHtml) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đủ: Tiêu đề, Nội dung và File danh sách."
      );
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("Subject", subject);
      formData.append("Body", bodyHtml);
      formData.append("StudentFile", {
        uri: studentFile.uri,
        name: studentFile.name,
        type:
          studentFile.mimeType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      } as any);

      if (attachmentFile) {
        formData.append("AttachmentFile", {
          uri: attachmentFile.uri,
          name: attachmentFile.name,
          type: attachmentFile.mimeType || "application/octet-stream",
        } as any);
      }

      await apiClient.post("/api/Emails/send-custom-email", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Thành công", "Đang gửi email!");
    } catch (error: any) {
      Alert.alert("Thất bại", error.response?.data?.message || "Lỗi gửi email");
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async (setFileAction: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        setFileAction({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType,
          size: result.assets[0].size,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const insertVariable = (variable: string) =>
    richText.current?.insertText(variable);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Soạn Email</Text>
          <Text style={styles.subtitle}>
            Gửi thông báo tới danh sách sinh viên
          </Text>
        </View>

        {/* Đã xóa nút to, quay lại dùng nút nhỏ tích hợp trong FileRow */}

        <View style={styles.section}>
          <FileRow
            label="1. Danh sách SV (Excel)"
            file={studentFile}
            onPick={() => pickFile(setStudentFile)}
            onClear={() => setStudentFile(null)}
            required
            onDownloadTemplate={handleDownloadTemplate} // Truyền hàm download vào đây
          />
          <View style={{ height: 10 }} />
          <FileRow
            label="2. File đính kèm (Tùy chọn)"
            file={attachmentFile}
            onPick={() => pickFile(setAttachmentFile)}
            onClear={() => setAttachmentFile(null)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Tiêu đề Email <Text style={{ color: "red" }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Nhập tiêu đề..."
          />

          <Text style={[styles.label, { marginTop: 15 }]}>
            Nội dung Email <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View style={styles.variableBar}>
            <Text style={styles.varLabel}>Chèn nhanh:</Text>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => insertVariable("{{FullName}}")}
            >
              <Text style={styles.chipText}>+ Tên</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => insertVariable("{{Email}}")}
            >
              <Text style={styles.chipText}>+ Email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorWrapper}>
            <RichToolbar
              editor={richText}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.heading1,
                actions.insertBulletsList,
              ]}
            />
            <RichEditor
              ref={richText}
              onChange={setBodyHtml}
              placeholder="Nhập nội dung..."
              initialHeight={200}
            />
          </View>
        </View>

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator size="large" color="#EA580C" />
          ) : (
            <TouchableOpacity style={styles.btnSend} onPress={handleSendEmail}>
              <Text style={styles.btnSendText}>GỬI THÔNG BÁO</Text>
              <Ionicons
                name="paper-plane-outline"
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

// --- FILE ROW VỚI NÚT DOWNLOAD NHỎ (GIAO DIỆN CŨ) ---
const FileRow = ({
  label,
  file,
  onPick,
  onClear,
  required,
  onDownloadTemplate,
}: FileRowProps) => (
  <View style={styles.fileCard}>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <Text style={styles.fileLabel}>
        {label} {required && <Text style={{ color: "red" }}>*</Text>}
      </Text>

      {/* Nút download nhỏ nằm ở đây */}
      {onDownloadTemplate && (
        <TouchableOpacity
          onPress={onDownloadTemplate}
          style={styles.btnTemplate}
        >
          <Ionicons name="download-outline" size={14} color="#0284C7" />
          <Text style={styles.btnTemplateText}>Tải mẫu</Text>
        </TouchableOpacity>
      )}
    </View>

    {file ? (
      <View style={styles.fileSelected}>
        <Ionicons name="document-text" size={24} color="#16A34A" />
        <Text style={[styles.fileName, { flex: 1, marginLeft: 10 }]}>
          {file.name}
        </Text>
        <TouchableOpacity onPress={onClear}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED" },
  scrollContent: { padding: 16, paddingBottom: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  section: { marginBottom: 20 },
  fileCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  fileLabel: { fontSize: 14, fontWeight: "600" },

  // Style cho nút download nhỏ
  btnTemplate: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  btnTemplateText: {
    fontSize: 12,
    color: "#0284C7",
    marginLeft: 4,
    fontWeight: "600",
  },

  fileSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  fileName: { fontWeight: "600", color: "#15803D" },
  btnPick: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  btnPickText: { color: "#64748B", marginLeft: 8 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  variableBar: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  varLabel: { fontSize: 12, marginRight: 8 },
  chip: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: { color: "#0284C7", fontWeight: "bold", fontSize: 12 },
  editorWrapper: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "white",
  },
  footer: { marginTop: 10 },
  btnSend: {
    backgroundColor: "#EA580C",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  btnSendText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
