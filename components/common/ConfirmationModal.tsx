import React, { useEffect, useState } from "react";
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

// Đặt thời gian đếm ngược ban đầu (giây)
const INITIAL_COUNTDOWN = 3;

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);

  useEffect(() => {
    if (visible) {
      // Reset về 3 mỗi khi mở modal
      setCountdown(INITIAL_COUNTDOWN);

      const interval = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevCount - 1; // Giảm 1
        });
      }, 1000); // 1 giây

      // Dọn dẹp interval khi modal đóng
      return () => clearInterval(interval);
    }
  }, [visible]);

  const isCountingDown = countdown > 0;
  // Đảm bảo label là string (ví dụ: "3") để BookingButton render
  const buttonLabel = isCountingDown ? `${countdown}` : confirmText;

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
              label={buttonLabel} // Hiển thị số đếm ngược
              variant="primary"
              onPress={onConfirm}
              disabled={isCountingDown} // Vô hiệu hóa khi đếm
              isLoading={false} // Tắt spinner
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Styles của ConfirmationModal
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
