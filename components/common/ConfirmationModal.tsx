import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
// Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn
import BookingButton from "../booking/BookingButton";

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container}>
          <Text style={styles.title}>{title || ""}</Text>
          <Text style={styles.message}>{message || ""}</Text>
          <View style={styles.buttonContainer}>
            <BookingButton
              label={cancelText}
              variant="secondary"
              onPress={onClose}
              style={styles.button}
            />
            <BookingButton
              label={confirmText} // Hiển thị text trực tiếp
              variant="primary"
              onPress={onConfirm}
              disabled={false} // Luôn cho phép bấm
              isLoading={false}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Styles giữ nguyên
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
