import { Check, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking } from "../../utils/bookingTypes";

// (Hàm format slot, bạn nên đưa vào utils)
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
  onApprove: () => void;
  onReject: () => void;
};

export default function ManagerApprovalCard({
  booking,
  onApprove,
  onReject,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{booking.roomName}</Text>
      <Text style={styles.type}>Loại: {booking.type}</Text>
      <Text style={styles.slots}>{formatSlotsShort(booking.slots)}</Text>

      {/* (Bạn có thể thêm chi tiết User ở đây nếu có) */}

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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  type: { fontSize: 13, color: "#64748B", marginTop: 2 },
  slots: { fontSize: 13, color: "#0F172A", marginTop: 8, fontStyle: "italic" },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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
