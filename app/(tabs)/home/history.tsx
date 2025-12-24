import { Stack } from "expo-router";
// 1. Thêm icon Copy
import {
  Briefcase,
  Calendar,
  Copy,
  Info,
  MapPin,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert, // 2. Thêm Alert để thông báo
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 3. Import thư viện Clipboard
import * as Clipboard from "expo-clipboard";

// --- COMPONENTS ---
import BookingFilterHeader from "../../../components/home/BookingFilterHeader";
import BookingHistoryCard from "../../../components/home/BookingHistoryCard";
import EmptyBookingHistory from "../../../components/home/EmptyBookingHistory";

import apiClient from "../../../utils/api";

// --- TYPES ---
type StatusFilter = "all" | "approved" | "pending" | "rejected";

interface SlotMaster {
  id: string;
  startTime: string; // "07:00:00"
  endTime: string; // "09:15:00"
  label: string;
}

export default function ManagerHistoryScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [slotTemplates, setSlotTemplates] = useState<SlotMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Popup State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- HELPER: Format Time ---
  const formatTimeStr = (time: string) => time?.substring(0, 5) || "";

  // --- 4. HÀM COPY QR ---
  const copyToClipboard = async (qrString: string) => {
    if (!qrString) {
      Alert.alert("Thông báo", "Không tìm thấy dữ liệu QR của yêu cầu này.");
      return;
    }
    await Clipboard.setStringAsync(qrString);
    Alert.alert("Đã sao chép", "Chuỗi QR Code đã được lưu vào bộ nhớ tạm.");
  };

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Gọi song song 2 API
      const [resSlots, resHistory] = await Promise.all([
        apiClient.get("/api/Slot"),
        apiClient.get("/api/Bookings/HistoryApprove"),
      ]);

      // 1. Xử lý Slot Master Data -> Tạo Map để tra cứu nhanh
      const rawSlots: SlotMaster[] = resSlots.data?.data || resSlots.data || [];
      setSlotTemplates(rawSlots);

      const slotMap: Record<string, SlotMaster> = {};
      rawSlots.forEach((s) => {
        // Lưu key là lowercase ID để tra cứu cho an toàn
        slotMap[s.id.toLowerCase()] = s;
      });

      // 2. Xử lý Booking History
      const rawHistory = resHistory.data?.data || resHistory.data || [];

      const mappedHistory = rawHistory.map((item: any) => {
        // --- Xử lý thời gian Check-in / Check-out dựa trên Slots ---
        const itemSlots = item.slots || [];
        let checkInAt = null;
        let checkOutAt = null;

        if (itemSlots.length > 0) {
          // Sắp xếp slot theo ngày + slotId
          const sortedSlots = [...itemSlots].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const firstSlot = sortedSlots[0];
          const lastSlot = sortedSlots[sortedSlots.length - 1];

          // Tra cứu giờ từ SlotMap
          const startMaster = slotMap[firstSlot.slotId?.toLowerCase()];
          const endMaster = slotMap[lastSlot.slotId?.toLowerCase()];

          if (startMaster && endMaster) {
            // Ghép chuỗi ISO: YYYY-MM-DD + T + HH:mm:ss
            checkInAt = `${firstSlot.date}T${startMaster.startTime}`;
            checkOutAt = `${lastSlot.date}T${endMaster.endTime}`;
          }
        }

        // --- Map các trường dữ liệu ---
        return {
          id: item.id,
          title: item.title || "Yêu cầu không tiêu đề",
          // API không trả về tên sinh viên, ta hiển thị CourseCode hoặc Title
          studentName:
            item.courseResponse?.courseName ||
            item.courseResponse?.courseCode ||
            "Sự kiện",
          courseCode: item.courseResponse?.courseCode,

          // Dùng ngày của slot đầu tiên làm ngày tạo (hoặc ngày diễn ra) để sắp xếp
          createdAt: checkInAt || new Date().toISOString(),

          checkInAt: checkInAt, // Để hiển thị giờ bắt đầu
          checkOutAt: checkOutAt, // Để hiển thị giờ kết thúc

          status: item.status,
          // Lấy labName từ object con
          labName: item.labRoomResponse?.labName || "Chưa chọn phòng",

          // Reason mapped từ description
          reason: item.description,

          // Nếu bị từ chối/hủy, lấy lý do
          rejectReason: null,

          totalSlots: itemSlots.length,

          // 5. LẤY CHUỖI QR (Dự phòng tên trường qrCode hoặc qrCodeString)
          qrCodeString: item.qrCodeString || item.qrCode || "",
        };
      });

      // Sắp xếp: Mới nhất lên đầu (dựa vào thời gian check-in)
      mappedHistory.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(mappedHistory);
    } catch (e: any) {
      console.error("Load history error:", e);
      // Alert.alert("Lỗi", "Không tải được lịch sử.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // --- 2. FILTER ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter === "all") return true;
      const s = b.status?.toLowerCase() || "";
      if (statusFilter === "approved") return s === "approved";
      if (statusFilter === "pending") return s === "pending";
      if (statusFilter === "rejected")
        return ["rejected", "cancelled", "expired", "denied"].includes(s);
      return true;
    });
  }, [bookings, statusFilter]);

  // --- 3. HANDLE OPEN MODAL ---
  const openDetail = (item: any) => {
    setSelectedBooking(item);
    setModalVisible(true);
  };

  // --- HELPERS UI ---
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#16A34A";
      case "pending":
        return "#D97706";
      case "rejected":
      case "cancelled":
        return "#DC2626";
      default:
        return "#64748B";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Từ chối";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDateTimeVN = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "N/A";

    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")} - ${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Lịch sử duyệt đơn" }} />

      <BookingFilterHeader
        statusFilter={statusFilter as any}
        onFilterChange={(val: any) => setStatusFilter(val)}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openDetail(item)}
            >
              <View pointerEvents="none">
                <BookingHistoryCard
                  booking={item}
                  slotTemplates={slotTemplates}
                  onRemove={() => {}} // Ẩn nút xóa
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyBookingHistory />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#EA580C"]}
            />
          }
        />
      )}

      {/* --- POPUP (MODAL) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeIconBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.bookingTitle}>{selectedBooking.title}</Text>

                {/* Phần hiển thị Status và nút Copy QR */}
                <View style={styles.statusRowContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(selectedBooking.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedBooking.status) },
                      ]}
                    >
                      {getStatusText(selectedBooking.status)}
                    </Text>
                  </View>

                  {/* NÚT COPY QR (Chỉ hiện khi Approved) */}
                  {selectedBooking.status?.toLowerCase() === "approved" && (
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() =>
                        copyToClipboard(selectedBooking.qrCodeString)
                      }
                    >
                      <Copy size={14} color="#0F172A" />
                      <Text style={styles.copyBtnText}>Copy QR String</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />

                {/* --- Nội dung chi tiết --- */}

                {/* Lớp / Môn học (Thay cho Người đặt vì API ẩn info user) */}
                <View style={styles.infoRow}>
                  <Briefcase size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Nội dung / Môn học:</Text>
                    <Text style={styles.value}>
                      {selectedBooking.studentName}
                      {selectedBooking.courseCode
                        ? ` (${selectedBooking.courseCode})`
                        : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Phòng Lab:</Text>
                    <Text style={styles.value}>{selectedBooking.labName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Calendar size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>
                      Thời gian (Bắt đầu - Kết thúc):
                    </Text>
                    <Text style={styles.value}>
                      {selectedBooking.checkInAt ? (
                        <>
                          {formatDateTimeVN(selectedBooking.checkInAt)}
                          {"\n-> "}
                          {formatDateTimeVN(selectedBooking.checkOutAt)}
                        </>
                      ) : (
                        "Chưa có lịch cụ thể"
                      )}
                    </Text>
                    <Text style={styles.subValue}>
                      (Tổng: {selectedBooking.totalSlots} slots)
                    </Text>
                  </View>
                </View>

                <View style={styles.noteBox}>
                  <View
                    style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}
                  >
                    <Info size={16} color="#64748B" />
                    <Text style={styles.label}>Mô tả / Ghi chú:</Text>
                  </View>
                  <Text style={styles.noteText}>
                    {selectedBooking.reason || "Không có mô tả"}
                  </Text>
                </View>

                {selectedBooking.status === "Rejected" &&
                  selectedBooking.rejectReason && (
                    <View
                      style={[
                        styles.noteBox,
                        { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
                      ]}
                    >
                      <Text style={[styles.label, { color: "#DC2626" }]}>
                        Lý do từ chối:
                      </Text>
                      <Text style={[styles.noteText, { color: "#B91C1C" }]}>
                        {selectedBooking.rejectReason}
                      </Text>
                    </View>
                  )}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  closeIconBtn: { padding: 4, backgroundColor: "#F1F5F9", borderRadius: 50 },
  modalBody: { marginBottom: 16 },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },

  // Container cho Status Badge và nút Copy
  statusRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: "600" },

  // Style cho nút copy mới
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  divider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
    flexWrap: "wrap",
  },
  subValue: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  noteBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },
  noteText: { fontSize: 13, color: "#475569", lineHeight: 18 },
  modalFooter: { marginTop: 4 },
  closeBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeBtnText: { color: "#475569", fontWeight: "600", fontSize: 15 },
});
