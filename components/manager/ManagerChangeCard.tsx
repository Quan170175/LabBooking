import { Calendar, Check, Clock, Info, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatSlotsSummary = (slots: any[]) => {
  if (!slots || slots.length === 0) return "Không thay đổi lịch";
  const grouped: Record<string, number> = {};
  slots.forEach((s) => {
    try {
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
  request: any;
  onApprove: () => void;
  onReject: () => void;
  onDetail: () => void; // [NEW] Thêm prop onDetail
};

export default function ManagerChangeCard({
  request,
  onApprove,
  onReject,
  onDetail,
}: Props) {
  const isSystemOverride = request.requestType === "SystemOverride";
  const isUserRequest = request.requestType === "UserRequest";
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roomName}>{request.roomName || "Phòng Lab"}</Text>
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

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {request.newTitle || "Tiêu đề trống"}
      </Text>

      {/* Meta Info */}
      <View style={styles.metaContainer}>
        <Clock size={12} color="#64748B" />
        <Text style={styles.metaInfo}>
          {createdDate} • Loại gốc:{" "}
          <Text style={{ fontWeight: "600" }}>{request.originalType}</Text>
        </Text>
      </View>

      {/* Slots */}
      <View style={styles.slotContainer}>
        <Calendar size={14} color="#4F46E5" style={{ marginTop: 2 }} />
        <Text style={styles.slotText}>
          <Text style={{ fontWeight: "600" }}>Lịch mới: </Text>
          {formatSlotsSummary(request.newSlots)}
        </Text>
      </View>

      {/* Footer: 3 Nút Bấm */}
      <View style={styles.buttonContainer}>
        {/* Từ chối */}
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <X size={16} color="#B91C1C" />
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            Từ chối
          </Text>
        </TouchableOpacity>

        {/* Chi tiết */}
        <TouchableOpacity
          style={[styles.button, styles.detailButton]}
          onPress={onDetail}
        >
          <Info size={16} color="#0369A1" />
          <Text style={[styles.buttonText, styles.detailButtonText]}>
            Chi tiết
          </Text>
        </TouchableOpacity>

        {/* Duyệt */}
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
  changeBorder: { borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" },
  overrideBorder: { borderColor: "#FDBA74", backgroundColor: "#FFF7ED" },
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

  // Button Styles
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
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
    gap: 4,
  },
  buttonText: { fontSize: 13, fontWeight: "600" },

  rejectButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectButtonText: { color: "#B91C1C" },

  detailButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  detailButtonText: { color: "#0284C7" },

  approveButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  approveButtonText: { color: "#15803D" },
});
