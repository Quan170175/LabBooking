import {
  BookOpen,
  CalendarClock,
  Check,
  MapPin,
  Users,
  X,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- TYPE DEFINITIONS (Dựa trên JSON bạn gửi) ---
type Slot = {
  id: string;
  date: string; // "2025-11-24"
  slotId: string;
};

type LabRoomResponse = {
  labName: string;
  location: string;
  maximumLimit: number;
};

type CourseResponse = {
  courseCode: string;
  courseName: string;
};

// Định nghĩa lại type Booking cho khớp với API mới
export type BookingRequest = {
  id: string;
  title: string;
  description: string;
  type: string; // "Teaching"
  status: string; // "Pending"
  numberOfParticipants: number;
  labRoomResponse: LabRoomResponse;
  courseResponse?: CourseResponse; // Có thể null nếu không phải teaching
  slots: Slot[];
};

type Props = {
  booking: BookingRequest;
  onApprove: () => void;
  onReject: () => void;
  onPress?: () => void; // Thêm sự kiện bấm vào cả thẻ để xem chi tiết
};

// --- HELPER FUNCTION ---
const formatDate = (dateString: string) => {
  const parts = dateString.split("-"); // 2025-11-24
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateString;
};

export default function ManagerApprovalCard({
  booking,
  onApprove,
  onReject,
  onPress,
}: Props) {
  // Logic hiển thị Slot: Gom nhóm theo ngày
  const slotSummary = useMemo(() => {
    if (!booking.slots || booking.slots.length === 0) return "Chưa có lịch";

    // Gom slot theo ngày
    const groups: Record<string, number> = {};
    booking.slots.forEach((s) => {
      if (!groups[s.date]) groups[s.date] = 0;
      groups[s.date]++;
    });

    // Tạo chuỗi hiển thị: "24/11 (1 slot), 26/11 (1 slot)"
    const lines = Object.keys(groups).map(
      (date) => `${formatDate(date)} (${groups[date]} ca)`
    );

    return lines.join(" • ");
  }, [booking.slots]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress} // Cho phép bấm vào xem chi tiết
    >
      {/* 1. Header: Tiêu đề & Loại */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.title}
          </Text>
          <Text style={styles.idText}>ID: {booking.id.slice(0, 8)}...</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{booking.type}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Body: Thông tin chi tiết */}
      <View style={styles.body}>
        {/* Phòng Lab */}
        <View style={styles.row}>
          <MapPin size={16} color="#F97316" />
          <Text style={styles.rowText}>
            <Text style={{ fontWeight: "700" }}>
              {booking.labRoomResponse?.labName}
            </Text>
            <Text style={{ color: "#64748B" }}>
              {" "}
              - {booking.labRoomResponse?.location}
            </Text>
          </Text>
        </View>

        {/* Môn học (Nếu có) */}
        {booking.courseResponse && (
          <View style={styles.row}>
            <BookOpen size={16} color="#6366F1" />
            <Text style={styles.rowText} numberOfLines={1}>
              <Text style={{ fontWeight: "700" }}>
                {booking.courseResponse.courseCode}
              </Text>
              - {booking.courseResponse.courseName}
            </Text>
          </View>
        )}

        {/* Sĩ số & Sức chứa */}
        <View style={styles.row}>
          <Users size={16} color="#0EA5E9" />
          <Text style={styles.rowText}>
            Sĩ số: {booking.numberOfParticipants} /{" "}
            {booking.labRoomResponse?.maximumLimit} sinh viên
          </Text>
        </View>

        {/* Thời gian */}
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <CalendarClock size={16} color="#10B981" style={{ marginTop: 2 }} />
          <Text
            style={[styles.rowText, { color: "#0F172A", fontStyle: "normal" }]}
          >
            {slotSummary}
          </Text>
        </View>
      </View>

      {/* 3. Footer: Nút bấm */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <X size={18} color="#EF4444" />
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            Từ chối
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={onApprove}
        >
          <Check size={18} color="#16A34A" />
          <Text style={[styles.buttonText, styles.approveButtonText]}>
            Duyệt đơn
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  idText: { fontSize: 12, color: "#94A3B8" },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
  },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  // Body Rows
  body: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, color: "#334155", flex: 1 },

  // Buttons
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  buttonText: { fontSize: 14, fontWeight: "700" },

  // Button Colors
  rejectButton: { backgroundColor: "#FEF2F2" }, // Đỏ rất nhạt
  rejectButtonText: { color: "#EF4444" }, // Đỏ đậm

  approveButton: { backgroundColor: "#F0FDF4" }, // Xanh lá rất nhạt
  approveButtonText: { color: "#16A34A" }, // Xanh lá đậm
});
