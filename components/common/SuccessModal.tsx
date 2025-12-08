// SuccessIncidentModal.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Check, ListChecks } from "lucide-react-native";

// --- TYPES ---
interface SuccessIncidentModalProps {
  visible: boolean;
  onClose: () => void; // Xử lý đóng modal và trở về trang trước/xóa form
  onViewHistory: () => void; // Xử lý điều hướng đến trang lịch sử
}

const SuccessIncidentModal: React.FC<SuccessIncidentModalProps> = ({
  visible,
  onClose,
  onViewHistory,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIconWrapper}>
            <Check size={32} color="#16A34A" strokeWidth={3} />
          </View>
          <Text style={styles.modalTitle}>Thành công!</Text>
          <Text style={styles.modalMessage}>Báo cáo sự cố đã được gửi.</Text>

          {/* CONTAINER CHO 2 NÚT */}
          <View style={styles.modalButtonRow}>
            {/* NÚT TRÁI: Cancel/Trở về */}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextCancel}>Trở về</Text>
            </TouchableOpacity>

            {/* NÚT PHẢI: Xem lịch sử */}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onViewHistory}
            >
              <ListChecks size={18} color="white" />
              <Text style={styles.modalButtonTextPrimary}>Xem lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalButtonPrimary: {
    backgroundColor: "#16A34A", // Màu xanh lá cho nút chính
  },
  modalButtonTextPrimary: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  modalButtonCancel: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalButtonTextCancel: {
    color: "#475569", // Màu xám cho nút phụ
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SuccessIncidentModal;
