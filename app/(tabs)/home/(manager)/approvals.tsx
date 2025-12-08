import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Components
import BookingDetailModal from "../../../../components/manager/BookingDetailModal";
import ManagerApprovalCard from "../../../../components/manager/ManagerApprovalCard";
import ManagerChangeCard from "../../../../components/manager/ManagerChangeCard";
// 👇 IMPORT MODAL MỚI
import RejectModal from "../../../../components/manager/RejectModal";

import apiClient from "../../../../utils/api";

type ActiveTab = "booking" | "change";

export default function ManagerApprovalsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("booking");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // --- STATE MỚI CHO REJECT MODAL ---
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [itemToReject, setItemToReject] = useState<any>(null);

  const [slotTemplates, setSlotTemplates] = useState<any[]>([]);

  // --- 1. LOAD DATA (Giữ nguyên) ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resBookings, resChanges, resSlots] = await Promise.all([
        apiClient.get("/api/Bookings/pending"),
        apiClient.get("/api/BookingChangeRequest/pending"),
        apiClient.get("/api/Slot"),
      ]);

      setSlotTemplates(resSlots.data);

      const listBookings = resBookings.data.map((b: any) => ({
        ...b,
        uiType: "BOOKING",
      }));
      const listChanges = resChanges.data.map((c: any) => ({
        ...c,
        uiType: "CHANGE_REQUEST",
      }));

      const combined = [...listBookings, ...listChanges].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllRequests(combined);
    } catch (e: any) {
      console.error("Load error:", e);
      if (e.response?.status === 401)
        Alert.alert("Lỗi", "Hết phiên đăng nhập.");
      else Alert.alert("Lỗi", "Không tải được dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetail = (item: any) => {
    setSelectedBooking(item);
    setDetailModalVisible(true);
  };

  // --- 2. LOGIC PRE-ACTION (Phân loại nút bấm) ---
  const onActionPress = (item: any, isApprove: boolean) => {
    if (isApprove) {
      // Nếu duyệt -> Gọi API luôn (hoặc hiện Alert confirm nhẹ)
      callApiAction(item, true, null);
    } else {
      // Nếu từ chối -> Mở Modal nhập lý do
      setItemToReject(item);
      setRejectModalVisible(true);
    }
  };

  // --- 3. GỌI API THỰC SỰ ---
  const callApiAction = async (
    item: any,
    isApprove: boolean,
    reason: string | null
  ) => {
    try {
      const action = isApprove ? "approve" : "reject";
      const endpoint =
        item.uiType === "CHANGE_REQUEST"
          ? `/api/BookingChangeRequest/${action}`
          : `/api/Bookings/${action}`;

      // Payload: Thêm reason nếu là Reject
      const payload: any = { bookingId: item.id };
      if (!isApprove && reason) {
        payload.reason = reason;
      }

      await apiClient.put(endpoint, payload);

      Alert.alert(
        "Thành công",
        `Đã ${isApprove ? "duyệt" : "từ chối"} yêu cầu.`
      );

      // Reset state & Load lại
      setDetailModalVisible(false);
      setRejectModalVisible(false);
      setItemToReject(null);
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Lỗi hệ thống.";
      Alert.alert("Thất bại", msg);
    }
  };

  // --- 4. CALLBACK TỪ MODAL REJECT ---
  const handleConfirmReject = (reason: string) => {
    if (!itemToReject) return;
    // Gọi API với reason
    callApiAction(itemToReject, false, reason);
  };

  // --- RENDER ---
  const bookingRequests = useMemo(
    () => allRequests.filter((b) => b.uiType === "BOOKING"),
    [allRequests]
  );
  const changeRequests = useMemo(
    () => allRequests.filter((b) => b.uiType === "CHANGE_REQUEST"),
    [allRequests]
  );

  const renderList = () => {
    if (isLoading)
      return (
        <ActivityIndicator
          style={styles.centered}
          size="large"
          color="#EA580C"
        />
      );

    let data: any[] = [];
    let EmptyComp = null;

    switch (activeTab) {
      case "booking":
        data = bookingRequests;
        EmptyComp = <Text style={styles.emptyText}>Không có đơn đặt mới.</Text>;
        break;
      case "change":
        data = changeRequests;
        EmptyComp = (
          <Text style={styles.emptyText}>Không có yêu cầu thay đổi.</Text>
        );
        break;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={EmptyComp}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          // Pass hàm onActionPress vào thay vì gọi api trực tiếp
          if (item.uiType === "CHANGE_REQUEST") {
            return (
              <ManagerChangeCard
                request={item}
                onApprove={() => onActionPress(item, true)}
                onReject={() => onActionPress(item, false)}
                onDetail={() => openDetail(item)}
              />
            );
          } else {
            return (
              <ManagerApprovalCard
                booking={item}
                onApprove={() => onActionPress(item, true)}
                onReject={() => onActionPress(item, false)}
                onDetail={() => openDetail(item)}
              />
            );
          }
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duyệt yêu cầu</Text>
      </View>

      <View style={styles.tabContainer}>
        <TabButton
          title="Lịch mới"
          count={bookingRequests.length}
          isActive={activeTab === "booking"}
          onPress={() => setActiveTab("booking")}
        />
        <TabButton
          title="Thay đổi"
          count={changeRequests.length}
          isActive={activeTab === "change"}
          onPress={() => setActiveTab("change")}
        />
      </View>

      <View style={styles.listContainer}>{renderList()}</View>

      {/* DETAIL MODAL (Cần sửa cả nút trong Detail Modal nếu có) */}
      <BookingDetailModal
        visible={detailModalVisible}
        booking={selectedBooking}
        slotTemplates={slotTemplates}
        onClose={() => setDetailModalVisible(false)}
        // Sửa prop onApprove/onReject để dùng chung logic
        onApprove={() => onActionPress(selectedBooking, true)}
        onReject={() => onActionPress(selectedBooking, false)}
      />

      {/* 👇 MODAL TỪ CHỐI MỚI */}
      <RejectModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onConfirm={handleConfirmReject}
      />
    </View>
  );
}

// ... (Giữ nguyên TabButton và Styles)
const TabButton = ({ title, count, isActive, onPress }: any) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
      {title}
    </Text>
    {count > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  tabActive: { borderBottomColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#EA580C" },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    backgroundColor: "#E0F2FE",
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#0369A1" },
  listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 40,
  },
});
