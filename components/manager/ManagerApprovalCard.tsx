import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  Check,
  Info,
  MapPin,
  Users,
  X,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- TYPE DEFINITIONS ---
type Slot = { id: string; date: string; slotId: string };
type LabRoomResponse = {
  labName: string;
  location: string;
  maximumLimit: number;
};
type CourseResponse = { courseCode: string; courseName: string };

export type BookingRequest = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  numberOfParticipants: number;
  labRoomResponse: LabRoomResponse;
  courseResponse?: CourseResponse;
  priorityDetail?: any; // Thêm
  bookingPriorityDetail?: any; // Thêm
  slots: Slot[];
};

type Props = {
  booking: BookingRequest;
  onApprove: () => void;
  onReject: () => void;
  onDetail: () => void;
};

// Helper format ngày
const formatDate = (dateString: string) => {
  const parts = dateString.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateString;
};

export default function ManagerApprovalCard({
  booking,
  onApprove,
  onReject,
  onDetail,
}: Props) {
  // Logic hiển thị slot
  const slotSummary = useMemo(() => {
    if (!booking.slots || booking.slots.length === 0) return "Chưa có lịch";
    const groups: Record<string, number> = {};
    booking.slots.forEach((s) => {
      const datePart = s.date.split("T")[0]; // Cắt chuỗi ngày để gom nhóm đúng
      if (!groups[datePart]) groups[datePart] = 0;
      groups[datePart]++;
    });
    const lines = Object.keys(groups).map(
      (date) => `${formatDate(date)} (${groups[date]} ca)`
    );
    return lines.join(" • ");
  }, [booking.slots]);

  // Lấy thông tin Priority (nếu có)
  const priorityData = booking.priorityDetail || booking.bookingPriorityDetail;

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.title}
          </Text>
          <Text style={styles.idText}>
            ID: {booking.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{booking.type}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Body */}
      <View style={styles.body}>
        {/* Phòng */}
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

        {/* [HIỂN THỊ RIÊNG] Môn học (Teaching) */}
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

        {/* [HIỂN THỊ RIÊNG] Sự kiện ưu tiên (Priority) */}
        {priorityData && (
          <View style={[styles.row, { alignItems: "flex-start" }]}>
            <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.rowText,
                  { color: "#DC2626", fontWeight: "700" },
                ]}
              >
                Sự kiện ưu tiên
              </Text>
              <Text
                style={[
                  styles.rowText,
                  { fontSize: 13, fontStyle: "italic", color: "#7F1D1D" },
                ]}
              >
                {priorityData.justification}
              </Text>
            </View>
          </View>
        )}

        {/* Sĩ số */}
        <View style={styles.row}>
          <Users size={16} color="#0EA5E9" />
          <Text style={styles.rowText}>
            Sĩ số: {booking.numberOfParticipants} /{" "}
            {booking.labRoomResponse?.maximumLimit}
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

      {/* 3. Footer: HÀNG 3 NÚT BẤM */}
      <View style={styles.buttonContainer}>
        {/* Nút 1: Từ chối */}
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <X size={16} color="#EF4444" />
          <Text style={[styles.buttonText, styles.rejectButtonText]}>
            Từ chối
          </Text>
        </TouchableOpacity>

        {/* Nút 2: Chi tiết (NẰM GIỮA) */}
        <TouchableOpacity
          style={[styles.button, styles.detailButton]}
          onPress={onDetail}
        >
          <Info size={16} color="#0369A1" />
          <Text style={[styles.buttonText, styles.detailButtonText]}>
            Chi tiết
          </Text>
        </TouchableOpacity>

        {/* Nút 3: Duyệt */}
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={onApprove}
        >
          <Check size={16} color="#16A34A" />
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
  body: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, color: "#334155", flex: 1 },

  // --- BUTTON STYLES ---
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
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
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  buttonText: { fontSize: 12, fontWeight: "700" },

  rejectButton: { backgroundColor: "#FEF2F2" },
  rejectButtonText: { color: "#EF4444" },

  detailButton: { backgroundColor: "#E0F2FE" },
  detailButtonText: { color: "#0284C7" },

  approveButton: { backgroundColor: "#F0FDF4" },
  approveButtonText: { color: "#16A34A" },
});
