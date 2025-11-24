import { Calendar, Check, Clock, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Helper: Gom nhóm slot theo ngày (VD: "22/11 (1 ca)")
const formatSlotsSummary = (slots: any[]) => {
  if (!slots || slots.length === 0) return "Không thay đổi lịch";

  const grouped: Record<string, number> = {};

  slots.forEach((s) => {
    try {
      // Xử lý ngày: Lấy dd/MM
      const dateStr = new Date(s.date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!grouped[dateStr]) grouped[dateStr] = 0;
      grouped[dateStr]++;
    } catch (e) {
      return;
    }
  });

  return Object.keys(grouped)
    .map((date) => `${date} (${grouped[date]} ca)`)
    .join(", ");
};

type Props = {
  request: any; // Nhận vào object BookingChangeRequestResponse
  onApprove: () => void;
  onReject: () => void;
};

export default function ManagerChangeCard({
  request,
  onApprove,
  onReject,
}: Props) {
  // Phân biệt loại request để đổi màu sắc
  const isSystemOverride = request.requestType === "SystemOverride"; // Do hệ thống tạo khi bị đè
  const isUserRequest = request.requestType === "UserRequest"; // Do user xin đổi

  // Format ngày tạo
  const createdDate = new Date(request.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.card,
        isSystemOverride ? styles.overrideBorder : styles.changeBorder,
      ]}
    >
      {/* Header: Tên Phòng + Tag Loại */}
      <View style={styles.header}>
        <Text style={styles.roomName}>{request.roomName || "Phòng Lab"}</Text>

        {/* Tag hiển thị trạng thái đặc biệt */}
        {isSystemOverride && (
          <View style={styles.tagWarn}>
            <Text style={styles.tagWarnText}>System Override</Text>
          </View>
        )}
        {isUserRequest && (
          <View style={styles.tagInfo}>
            <Text style={styles.tagInfoText}>Xin đổi lịch</Text>
          </View>
        )}
      </View>

      {/* Tiêu đề mới */}
      <Text style={styles.title} numberOfLines={2}>
        {request.newTitle || "Tiêu đề trống"}
      </Text>

      {/* Thông tin phụ: Ngày tạo + Loại gốc */}
      <View style={styles.metaContainer}>
        <Clock size={12} color="#64748B" />
        <Text style={styles.metaInfo}>
          {createdDate} • Loại gốc:{" "}
          <Text style={{ fontWeight: "600" }}>{request.originalType}</Text>
        </Text>
      </View>

      {/* Box hiển thị Slot Mới (Tóm tắt) */}
      <View style={styles.slotContainer}>
        <Calendar size={14} color="#4F46E5" style={{ marginTop: 2 }} />
        <Text style={styles.slotText}>
          <Text style={{ fontWeight: "600" }}>Lịch mới: </Text>
          {formatSlotsSummary(request.newSlots)}
        </Text>
      </View>

      {/* Nút bấm Actions */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <X size={16} color="#B91C1C" />
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            Từ chối
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={onApprove}
        >
          <Check size={16} color="#15803D" />
          <Text style={[styles.buttonText, styles.approveButtonText]}>
            Duyệt
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  // Style riêng cho 2 loại request
  changeBorder: { borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }, // Xanh dương nhạt
  overrideBorder: { borderColor: "#FDBA74", backgroundColor: "#FFF7ED" }, // Cam nhạt

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roomName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },

  tagInfo: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagInfoText: { fontSize: 10, color: "#1E40AF", fontWeight: "700" },

  tagWarn: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagWarnText: { fontSize: 10, color: "#9A3412", fontWeight: "700" },

  title: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 6 },

  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  metaInfo: { fontSize: 12, color: "#64748B" },

  slotContainer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
  },
  slotText: { fontSize: 13, color: "#312E81", flex: 1, lineHeight: 18 },

  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: { fontSize: 14, fontWeight: "600" },

  rejectButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  rejectButtonText: { color: "#B91C1C" },

  approveButton: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  approveButtonText: { color: "#15803D" },
});
