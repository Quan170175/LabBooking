// SuccessMaintenanceModal.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { CheckCircle2, History } from "lucide-react-native";

// --- TYPES ---
interface SuccessMaintenanceModalProps {
  visible: boolean;
  onClose: () => void; // Đóng modal và ở lại trang hiện tại (hoặc reset form)
  onViewHistory: () => void; // Chuyển đến trang lịch sử
  modalTitle?: string; // Tiêu đề modal (mặc định là "Thành công!")
  // 🔥 message: Thông báo chi tiết, ví dụ: "Đã tạo lịch bảo trì cho 3 thiết bị."
  message: string;
}

const SuccessMaintenanceModal: React.FC<SuccessMaintenanceModalProps> = ({
  visible,
  onClose,
  onViewHistory,
  modalTitle = "Thành công!",
  message,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <CheckCircle2 size={48} color="#16A34A" />
          </View>
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalActions}>
            {/* Nút Đóng */}
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onClose}>
              <Text style={styles.modalBtnCancelText}>Đóng</Text>
            </TouchableOpacity>

            {/* Nút Xem Lịch sử */}
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={onViewHistory}
            >
              <History size={18} color="white" />
              <Text style={styles.modalBtnPrimaryText}>Xem Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- STYLES (Được trích từ style chung của bạn) ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16A34A",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  modalBtnPrimary: {
    flex: 1.5,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "600", color: "white" },
});

export default SuccessMaintenanceModal;
