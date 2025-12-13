import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { X, Calendar, Clock, MapPin, User, Info } from "lucide-react-native";

// --- COMPONENTS ---
import BookingHistoryCard from "../../../../components/home/BookingHistoryCard";
import BookingFilterHeader from "../../../../components/home/BookingFilterHeader";
import EmptyBookingHistory from "../../../../components/home/EmptyBookingHistory";

import apiClient from "../../../../utils/api";

// --- TYPES ---
type StatusFilter = "all" | "approved" | "pending" | "rejected";

export default function ManagerHistoryScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [slotTemplates, setSlotTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Popup State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    try {
      const [resSlots, resHistory] = await Promise.all([
        apiClient.get("/api/Slot"),
        mockFetchManagerHistory(),
      ]);

      setSlotTemplates(resSlots.data);

      const sortedHistory = resHistory.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(sortedHistory);
    } catch (e: any) {
      console.error("Load history error:", e);
      Alert.alert("Lỗi", "Không tải được lịch sử.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Mock Data
  const mockFetchManagerHistory = async () => {
    await new Promise((r) => setTimeout(r, 500));
    return [
      {
        id: "bk-01",
        title: "Mượn phòng làm đồ án tốt nghiệp",
        studentName: "Nguyễn Văn A",
        createdAt: "2025-12-10T08:00:00Z",
        checkInAt: "2025-12-12T07:00:00Z",
        checkOutAt: "2025-12-12T09:00:00Z",
        status: "Approved",
        slotId: 1,
        labName: "Lab A101 - IoT",
        reason: "Em cần phòng để test mạch điều khiển.",
      },
      {
        id: "bk-02",
        title: "Họp nhóm nghiên cứu khoa học",
        studentName: "Trần Thị B",
        createdAt: "2025-12-11T09:30:00Z",
        checkInAt: "2025-12-13T13:00:00Z",
        checkOutAt: "2025-12-13T15:00:00Z",
        status: "Pending",
        slotId: 3,
        labName: "Lab A101 - IoT",
        reason: "Nhóm em cần không gian yên tĩnh để viết báo cáo.",
      },
      {
        id: "bk-03",
        title: "Mượn phòng training",
        studentName: "Lê Văn C",
        createdAt: "2025-11-20T10:00:00Z",
        checkInAt: "2025-11-22T07:00:00Z",
        checkOutAt: "2025-11-22T11:00:00Z",
        status: "Rejected",
        slotId: 1,
        labName: "Lab A101 - IoT",
        rejectReason: "Phòng đang bảo trì máy chiếu.",
      },
    ];
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
        return ["rejected", "cancelled", "expired"].includes(s);
      return true;
    });
  }, [bookings, statusFilter]);

  // --- 3. HANDLE OPEN MODAL ---
  const openDetail = (item: any) => {
    setSelectedBooking(item);
    setModalVisible(true);
  };

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
        return "Đã từ chối";
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
              {/* Vô hiệu hóa pointerEvents của Card con để đảm bảo Card con không bắt sự kiện click */}
              <View pointerEvents="none">
                <BookingHistoryCard
                  booking={item}
                  slotTemplates={slotTemplates}
                  onRemove={function (id: string): void {
                    throw new Error("Function not implemented.");
                  }} // 🔥 QUAN TRỌNG: Không truyền onRemove để ẩn nút xóa
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

      {/* --- POPUP (MODAL) Ở GIỮA --- */}
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

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <User size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Người đặt:</Text>
                    <Text style={styles.value}>
                      {selectedBooking.studentName}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Phòng:</Text>
                    <Text style={styles.value}>{selectedBooking.labName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Calendar size={18} color="#EA580C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Thời gian Check-in:</Text>
                    <Text style={styles.value}>
                      {new Date(selectedBooking.checkInAt).toLocaleDateString(
                        "vi-VN"
                      )}
                      {" - "}
                      {new Date(selectedBooking.checkInAt).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.noteBox}>
                  <View
                    style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}
                  >
                    <Info size={16} color="#64748B" />
                    <Text style={styles.label}>Lý do:</Text>
                  </View>
                  <Text style={styles.noteText}>
                    {selectedBooking.reason || "Không có ghi chú"}
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

            {/* Footer: Chỉ nút Đóng */}
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
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "500", color: "#0F172A" },
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
