import { Clock } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Định nghĩa cấu trúc Slot Time nếu cần (hoặc nhận props từ ngoài)
// Ở đây tôi fix cứng để tái sử dụng nhanh, hoặc bạn có thể truyền props `slotTimes`
const SLOT_TIMES: Record<string, string> = {
  slot1: "07:30 - 09:45",
  slot2: "10:00 - 12:15",
  slot3: "13:00 - 15:15",
  slot4: "15:30 - 17:45",
};

const SLOTS = [
  { id: "slot1", label: "Slot 1" },
  { id: "slot2", label: "Slot 2" },
  { id: "slot3", label: "Slot 3" },
  { id: "slot4", label: "Slot 4" },
];

export default function SlotTimeInfo() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Clock size={16} color="#EA580C" />
        <Text style={styles.title}>Khung giờ hoạt động</Text>
      </View>

      <View style={styles.grid}>
        {SLOTS.map((slot, index) => (
          <View
            key={slot.id}
            style={[
              styles.row,
              index === SLOTS.length - 1 && styles.lastRow, // Bỏ border dòng cuối
            ]}
          >
            <Text style={styles.label}>{slot.label}:</Text>
            <Text style={styles.value}>{SLOT_TIMES[slot.id]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // Thêm shadow nhẹ cho đẹp nếu muốn
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EA580C", // Màu cam chủ đạo
  },
  value: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
});
