import { AlertTriangle, Check, X } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking } from "../../utils/bookingTypes";

// (Hàm format)
const formatSlotsShort = (slots: any[], max = 2) => {
  if (!slots || slots.length === 0) return "Không có slot";
  const formatted = slots.map((s: any) => {
    const date = new Date(s.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    return `Slot ${s.slotId.replace("slot", "")} (${date})`;
  });
  if (formatted.length > max) {
    return `${formatted.slice(0, max).join(", ")}... và ${
      formatted.length - max
    } slot khác`;
  }
  return formatted.join(", ");
};

type Props = {
  booking: Booking;
  allBookings: Booking[];
  onApprove: () => void;
  onReject: () => void;
};

export default function ManagerPriorityCard({
  booking,
  allBookings,
  onApprove,
  onReject,
}: Props) {
  // Tìm các booking bị xung đột
  const conflicts = useMemo(() => {
    const conflicts: Booking[] = [];
    const prioritySlotKeys = new Set(
      booking.slots.map((s: any) => `${s.date}::${s.slotId}`)
    );

    allBookings.forEach((b) => {
      if (b.id === booking.id || b.status !== "approved") return;

      const hasConflict = b.slots.some((s: any) =>
        prioritySlotKeys.has(`${s.date}::${s.slotId}`)
      );
      if (hasConflict) {
        conflicts.push(b);
      }
    });
    return conflicts;
  }, [booking, allBookings]);

  return (
    <View style={[styles.card, styles.priorityBorder]}>
      {/* Yêu cầu */}
      <Text style={styles.title}>{booking.roomName}</Text>
      <Text style={styles.type}>Loại: {booking.type} (Ưu tiên)</Text>
      <Text style={styles.slots}>{formatSlotsShort(booking.slots)}</Text>

      {/* Xung đột */}
      <View style={styles.conflictBox}>
        <AlertTriangle size={16} color="#B45309" />
        <View style={{ flex: 1 }}>
          <Text style={styles.conflictTitle}>
            {conflicts.length > 0
              ? `Sẽ ghi đè ${conflicts.length} lịch:`
              : "Không có xung đột"}
          </Text>
          {conflicts.map((c) => (
            <Text key={c.id} style={styles.conflictItem}>
              - {c.roomName} ({formatSlotsShort(c.slots, 1)})
            </Text>
          ))}
        </View>
      </View>

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
            Duyệt Ưu tiên
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// (Sử dụng styles tương tự ManagerApprovalCard, nhưng thêm phần conflict)
const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  priorityBorder: {
    borderColor: "#FCD34D", // Viền vàng
    backgroundColor: "#FFFBEB",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  type: { fontSize: 13, color: "#64748B", marginTop: 2 },
  slots: { fontSize: 13, color: "#0F172A", marginTop: 8, fontStyle: "italic" },
  conflictBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF9C3",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  conflictTitle: {
    color: "#B45309",
    fontWeight: "600",
  },
  conflictItem: {
    color: "#B45309",
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    paddingTop: 12,
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