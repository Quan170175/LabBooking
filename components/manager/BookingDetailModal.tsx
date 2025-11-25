import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  HardDrive,
  MapPin,
  Package,
  X,
  User,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  booking: any;
  onClose: () => void;
  slotTemplates?: any[]; // Truyền thêm list slot template để map tên Ca
};

// --- HELPER ---
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "Teaching":
      return "Lịch Dạy Học";
    case "Project":
      return "Lịch Dự Án";
    case "UniversityEvent":
      return "Sự Kiện Trường";
    default:
      return type || "Đặt Lịch";
  }
};

export default function BookingDetailModal({
  visible,
  booking,
  onClose,
  slotTemplates = [],
}: Props) {
  if (!booking) return null;

  // 1. Map Data
  const roomName =
    booking.labRoomResponse?.labName || booking.roomName || "Phòng Lab";
  const roomLocation =
    booking.labRoomResponse?.location || booking.roomLocation || "";
  const requesterName =
    booking.userResponse?.fullName || booking.userName || "Người dùng";
  const requesterEmail = booking.userResponse?.email || booking.userEmail || "";

  // 2. Group Slots
  const groupedSlots = (booking.slots || []).reduce((acc: any, slot: any) => {
    const d = slot.date.split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot.slotId);
    return acc;
  }, {});
  const dates = Object.keys(groupedSlots).sort();

  const getSlotLabel = (id: string) => {
    const t = slotTemplates.find((x) => x.id === id);
    return t ? t.label.split("(")[0].trim() : "Slot";
  };

  // 3. Info Objects
  const projectInfo = booking.project || booking.projectResponse;
  const priorityInfo = booking.priorityDetail || booking.bookingPriorityDetail;
  const courseInfo = booking.courseResponse;
  const devices = booking.externalEquipments || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* CARD INFO (Style giống Success Screen) */}
            <View style={styles.card}>
              {/* Header Booking: Title & ID */}
              <View style={styles.cardHeader}>
                <Text style={styles.bookingTitle}>
                  {booking.title || "Yêu cầu đặt phòng"}
                </Text>
                <Text style={styles.bookingId}>
                  #{booking.id.substring(0, 6).toUpperCase()}
                </Text>
              </View>

              {/* Người đặt */}
              <View style={styles.row}>
                <User size={18} color="#64748B" />
                <View>
                  <Text style={styles.rowText}>
                    Người đặt: <Text style={styles.bold}>{requesterName}</Text>
                  </Text>
                  <Text style={styles.subText}>{requesterEmail}</Text>
                </View>
              </View>

              {/* Phòng */}
              <View style={styles.row}>
                <MapPin size={18} color="#64748B" />
                <View>
                  <Text style={styles.rowText}>
                    Phòng: <Text style={styles.bold}>{roomName}</Text>
                  </Text>
                  {roomLocation ? (
                    <Text style={styles.subText}>{roomLocation}</Text>
                  ) : null}
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: "#E0F2FE" }]}>
                  <Text style={[styles.badgeText, { color: "#0284C7" }]}>
                    {getTypeLabel(booking.type)}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.badgeText, { color: "#D97706" }]}>
                    {booking.numberOfParticipants || 0} người
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* --- CHI TIẾT --- */}
              {projectInfo && (
                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <Briefcase size={16} color="#EA580C" />
                    <Text style={styles.detailHeaderTitle}>Dự án</Text>
                  </View>
                  <Text style={styles.detailValueBold}>
                    {projectInfo.projectName}
                  </Text>
                  {projectInfo.description ? (
                    <Text style={styles.detailValueLight}>
                      {projectInfo.description}
                    </Text>
                  ) : null}
                </View>
              )}

              {priorityInfo && (
                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text
                      style={[styles.detailHeaderTitle, { color: "#DC2626" }]}
                    >
                      Lý do ưu tiên
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.detailBox,
                      { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                    ]}
                  >
                    <Text style={[styles.detailValue, { color: "#991B1B" }]}>
                      {priorityInfo.justification}
                    </Text>
                  </View>
                </View>
              )}

              {courseInfo && (
                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <BookOpen size={16} color="#2563EB" />
                    <Text
                      style={[styles.detailHeaderTitle, { color: "#2563EB" }]}
                    >
                      Lớp học
                    </Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {courseInfo.courseCode} - {courseInfo.courseName}
                  </Text>
                </View>
              )}

              {/* --- LỊCH --- */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lịch chi tiết</Text>
                <View style={styles.slotListContainer}>
                  {dates.map((date: string) => (
                    <View key={date} style={styles.slotRow}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Calendar
                          size={16}
                          color="#EA580C"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.slotDate}>{formatDate(date)}</Text>
                      </View>
                      <View style={styles.slotChips}>
                        {groupedSlots[date].map((slotId: string) => (
                          <View key={slotId} style={styles.slotChip}>
                            <Text style={styles.slotChipText}>
                              {getSlotLabel(slotId)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* --- THIẾT BỊ --- */}
              {devices.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Thiết bị đăng ký</Text>
                  <View style={styles.equipContainer}>
                    {devices.map((d: any, idx: number) => (
                      <View
                        key={idx}
                        style={[
                          styles.equipRow,
                          idx === devices.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                          }}
                        >
                          <View style={styles.equipIcon}>
                            <Package size={16} color="#64748B" />
                          </View>
                          <View>
                            <Text style={styles.equipName}>
                              {d.name || d.equipmentName}
                            </Text>
                            {d.description ? (
                              <Text style={styles.equipDesc}>
                                {d.description}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.equipQty}>x{d.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS (Tùy chọn: Có thể thêm nút Duyệt/Từ chối ngay tại đây) */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F8FAFC",
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  closeBtn: { padding: 4 },

  content: { padding: 16 },

  // Card Styles (Copy từ Success Screen)
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  bookingId: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  rowText: { fontSize: 14, color: "#475569" },
  subText: { fontSize: 13, color: "#64748B", marginTop: 2 },
  bold: { fontWeight: "600", color: "#0F172A" },

  badgeContainer: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },

  detailSection: { marginBottom: 12 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  detailHeaderTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EA580C",
    textTransform: "uppercase",
  },
  detailValue: { fontSize: 14, color: "#334155" },
  detailValueBold: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  detailValueLight: { fontSize: 13, color: "#64748B" },
  detailBox: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  slotListContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  slotRow: { gap: 8 },
  slotDate: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  slotChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  slotChip: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  slotChipText: { fontSize: 12, color: "#C2410C", fontWeight: "600" },

  equipContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  equipIcon: {
    width: 32,
    height: 32,
    backgroundColor: "white",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equipName: { fontSize: 14, color: "#0F172A", fontWeight: "600" },
  equipDesc: { fontSize: 12, color: "#64748B" },
  equipQty: { fontSize: 14, fontWeight: "700", color: "#0F172A" },

  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  btnClose: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#475569", fontWeight: "700", fontSize: 15 },
});
