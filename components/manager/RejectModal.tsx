import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface RejectModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectModal({
  visible,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason(""); // Reset sau khi gửi
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Từ chối yêu cầu</Text>
              <Text style={styles.subtitle}>Vui lòng nhập lý do từ chối:</Text>

              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Trùng lịch bảo trì, thông tin chưa rõ..."
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={onClose}
                >
                  <Text style={styles.textCancel}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnConfirm]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.textConfirm}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: { width: "100%", alignItems: "center" },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
  },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnCancel: { backgroundColor: "#F1F5F9" },
  btnConfirm: { backgroundColor: "#EF4444" },
  textCancel: { color: "#64748B", fontWeight: "600" },
  textConfirm: { color: "white", fontWeight: "600" },
});
