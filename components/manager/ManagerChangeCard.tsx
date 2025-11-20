import { Check, X } from "lucide-react-native";
import React from "react";
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
  onApprove: () => void;
  onReject: () => void;
};

export default function ManagerChangeCard({
  booking,
  onApprove,
  onReject,
}: Props) {
  const isSelfChange = booking.status === "pending_change";
  const changeInfo = booking.changeInfo || {}; // { slotsRemoved, slotsAdded }
  const rescheduleInfo = booking.type === "reschedule_request";

  return (
    <View style={[styles.card, styles.changeBorder]}>
      <Text style={styles.title}>{booking.roomName}</Text>

      {isSelfChange && (
        <>
          <Text style={styles.type}>Loại: Tự thay đổi slot</Text>
          <View style={styles.changeBox}>
            <Text style={styles.changeRemoved}>
              <Text style={styles.changeLabel}>Bỏ:</Text>{" "}
              {formatSlotsShort(changeInfo.slotsRemoved, 10)}
            </Text>
            <Text style={styles.changeAdded}>
              <Text style={styles.changeLabel}>Thêm:</Text>{" "}
              {formatSlotsShort(changeInfo.slotsAdded, 10)}
            </Text>
          </View>
        </>
      )}

      {rescheduleInfo && (
        <>
          <Text style={styles.type}>Loại: Đổi lịch (do bị trùng)</Text>
          <Text style={styles.changeAdded}>
            <Text style={styles.changeLabel}>Slot mới:</Text>{" "}
            {formatSlotsShort(booking.slots, 10)}
          </Text>
        </>
      )}

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
  },
  changeBorder: {
    borderColor: "#C7D2FE", // Viền xanh
    backgroundColor: "#EEF2FF",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  type: { fontSize: 13, color: "#312E81", marginTop: 2, fontWeight: "500" },
  changeBox: {
    marginTop: 8,
    gap: 4,
  },
  changeLabel: {
    fontWeight: "700",
  },
  changeRemoved: {
    color: "#B91C1C", // Đỏ
    fontSize: 13,
  },
  changeAdded: {
    color: "#15803D", // Xanh
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#C7D2FE",
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
