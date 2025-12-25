import * as Clipboard from "expo-clipboard";
import { Stack } from "expo-router";
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
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- COMPONENTS ---
import BookingFilterHeader from "../../../../components/home/BookingFilterHeader";
import BookingHistoryCard from "../../../../components/home/BookingHistoryCard";
import EmptyBookingHistory from "../../../../components/home/EmptyBookingHistory";

import apiClient from "../../../../utils/api";

// --- TYPES ---
type StatusFilter = "all" | "approved" | "pending" | "rejected";

interface SlotMaster {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface GroupedSlot {
  date: string;
  slotNames: string[];
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

  // --- HELPERS ---
  const formatTimeStr = (time: string) => time?.substring(0, 5) || "";

  const formatDateVN = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // [MỚI] Helper lấy nhãn loại lịch (giống trang cá nhân)
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "UniversityEvent":
        return "Sự kiện trường";
      case "Teaching":
        return "Lịch giảng dạy";
      case "Booking":
        return "Đặt phòng mượn";
      default:
        return type || "Khác";
    }
  };

  const copyToClipboard = async (qrString: string) => {
    if (!qrString) {
      Alert.alert("Thông báo", "Không tìm thấy dữ liệu QR.");
      return;
    }
    await Clipboard.setStringAsync(qrString);
    Alert.alert("Đã sao chép", "QR Code đã lưu vào bộ nhớ tạm.");
  };

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    try {
      setIsLoading(true);

      const [resSlots, resHistory] = await Promise.all([
        apiClient.get("/api/Slot"),
        apiClient.get("/api/Bookings/HistoryApprove"), // API của Manager
      ]);

      // 1. Xử lý Slot Master
      const rawSlots: SlotMaster[] = resSlots.data?.data || resSlots.data || [];
      setSlotTemplates(rawSlots);

      const slotMap: Record<string, SlotMaster> = {};
      rawSlots.forEach((s) => {
        slotMap[s.id.toLowerCase()] = s;
      });

      // 2. Xử lý Booking History
      const rawHistory = resHistory.data?.data || resHistory.data || [];

      const mappedHistory = rawHistory.map((item: any) => {
        const itemSlots = item.slots || [];
        let checkInAt = null;
        let checkOutAt = null;

        // --- XỬ LÝ GOM NHÓM SLOT ---
        const slotsByDate: Record<string, string[]> = {};
        const sortedSlots = [...itemSlots].sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedSlots.forEach((slot: any) => {
          const dateStr = formatDateVN(slot.date);
          if (!slotsByDate[dateStr]) slotsByDate[dateStr] = [];

          const masterSlot = slotMap[slot.slotId?.toLowerCase()];
          const label = masterSlot ? masterSlot.label : "Slot ???";

          slotsByDate[dateStr].push(label);
        });

        const groupedSlotsArray: GroupedSlot[] = Object.keys(slotsByDate).map(
          (date) => ({
            date: date,
            slotNames: slotsByDate[date],
          })
        );

        // Tính check-in/check-out tổng thể
        if (sortedSlots.length > 0) {
          const firstSlot = sortedSlots[0];
          const lastSlot = sortedSlots[sortedSlots.length - 1];
          const startMaster = slotMap[firstSlot.slotId?.toLowerCase()];
          const endMaster = slotMap[lastSlot.slotId?.toLowerCase()];

          if (startMaster && endMaster) {
            checkInAt = `${firstSlot.date}T${startMaster.startTime}`;
            checkOutAt = `${lastSlot.date}T${endMaster.endTime}`;
          }
        }

        // [MỚI] Logic hiển thị tên Môn/Dự án chuẩn (giống trang cá nhân)
        let displayTitle = "Sự kiện";
        let displayCode = "";
        if (item.courseResponse) {
          displayTitle = item.courseResponse.courseName;
          displayCode = item.courseResponse.courseCode;
        } else if (item.projectResponse) {
          displayTitle = item.projectResponse.projectName;
        } else {
          displayTitle = item.title;
        }

        return {
          id: item.id,
          title: item.title || "Yêu cầu",

          // [UPDATE] Các trường quan trọng để Card hiển thị đúng
          studentName: displayTitle, // Dùng trường này để hiển thị tên chính trên Card
          courseCode: displayCode, // Dùng trường này để hiển thị mã môn
          type: item.type,
          typeLabel: getTypeLabel(item.type), // Tiếng Việt hóa loại lịch

          createdAt: checkInAt || new Date().toISOString(),
          checkInAt: checkInAt,
          checkOutAt: checkOutAt,
          status: item.status,
          labName: item.labRoomResponse?.labName || "Chưa chọn phòng",
          reason: item.description,
          rejectReason: item.priorityDetail?.managerNote || null,
          totalSlots: itemSlots.length,
          qrCodeString: item.qrCodeString || item.qrCode || "",
          groupedSlots: groupedSlotsArray,
        };
      });

      mappedHistory.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(mappedHistory);
    } catch (e: any) {
      console.error("Load history error:", e);
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
                  onRemove={() => {}}
                  showCancelButton={false} // Trang duyệt đơn thường ko cần nút Hủy của user
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
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* [UPDATE] Dùng studentName làm tiêu đề chính cho khớp Card */}
                <Text style={styles.bookingTitle}>
                  {selectedBooking.studentName}
                </Text>
                {selectedBooking.courseCode ? (
                  <Text style={styles.courseCodeText}>
                    {selectedBooking.courseCode}
                  </Text>
                ) : null}

                {/* Status Row & Copy QR */}
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

                  {selectedBooking.status?.toLowerCase() === "approved" &&
                  selectedBooking.qrCodeString ? (
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() =>
                        copyToClipboard(selectedBooking.qrCodeString)
                      }
                    >
                      <Copy size={14} color="#0F172A" />
                      <Text style={styles.copyBtnText}>Copy QR</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.divider} />

                {/* --- Nội dung chi tiết --- */}
                <View style={styles.infoRow}>
                  <Briefcase size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Loại lịch:</Text>
                    {/* [UPDATE] Dùng typeLabel hiển thị tiếng Việt */}
                    <Text style={styles.value}>
                      {selectedBooking.typeLabel}
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

                {/* --- DANH SÁCH SLOT GOM NHÓM NGANG --- */}
                <View style={styles.scheduleContainer}>
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}
                  >
                    <Calendar size={18} color="#EA580C" />
                    <Text style={[styles.label, { marginTop: 2 }]}>
                      Chi tiết lịch đặt ({selectedBooking.totalSlots} slots):
                    </Text>
                  </View>

                  <View style={styles.groupedList}>
                    {selectedBooking.groupedSlots?.map(
                      (group: GroupedSlot, index: number) => (
                        <View key={index} style={styles.rowItem}>
                          <Text style={styles.rowDateText}>{group.date}:</Text>
                          <View style={styles.slotsCol}>
                            {group.slotNames.map((slotName, sIndex) => (
                              <View key={sIndex} style={styles.slotBadgeDetail}>
                                <Text style={styles.slotTextDetail}>
                                  {slotName}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )
                    )}
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

                {selectedBooking.rejectReason && (
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  closeIconBtn: { padding: 4, backgroundColor: "#F1F5F9", borderRadius: 50 },
  modalBody: { marginBottom: 16 },

  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 2,
  },
  courseCodeText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
    fontStyle: "italic",
  },

  statusRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 4,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },

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
  copyBtnText: { fontSize: 11, fontWeight: "600", color: "#334155" },

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

  // --- Styles list slot trong modal ---
  scheduleContainer: {
    backgroundColor: "#FAFAFA",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  groupedList: { gap: 8, paddingLeft: 4 },

  rowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 2,
  },
  rowDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
    minWidth: 70,
  },
  slotsCol: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotBadgeDetail: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotTextDetail: { fontSize: 12, color: "#EA580C", fontWeight: "500" },

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
