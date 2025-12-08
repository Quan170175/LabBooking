import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import BookingFilterHeader from "../../../components/home/BookingFilterHeader";
import BookingHistoryCard from "../../../components/home/BookingHistoryCard";
import EmptyBookingHistory from "../../../components/home/EmptyBookingHistory";

// Import apiClient đã cấu hình token
import apiClient from "../../../utils/api";

type StatusFilter = "all" | "approved" | "pending";

export default function HistoryScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [slotTemplates, setSlotTemplates] = useState<any[]>([]); // [MỚI] Lưu danh sách Slot
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- 1. LOAD DATA (SONG SONG) ---
  const loadData = async () => {
    try {
      console.log("📥 Fetching data...");

      // Gọi song song 2 API: Lịch sử & Danh sách Slot
      const [resHistory, resSlots] = await Promise.all([
        apiClient.get("/api/Bookings/my-history-booking"),
        apiClient.get("/api/Slot"), // Giả sử API lấy danh sách slot là /api/Slot
      ]);

      setBookings(resHistory.data);
      setSlotTemplates(resSlots.data); // Lưu template để truyền xuống card
    } catch (e: any) {
      console.error("Failed to load data", e);
      if (e.response?.status === 401) {
        Alert.alert("Lỗi", "Phiên đăng nhập hết hạn.");
      } else {
        Alert.alert("Lỗi", "Không tải được dữ liệu.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // ... (Hàm remove giữ nguyên) ...
  const remove = (id: string) => {
    /* Logic remove cũ */
  };

  // ... (Hàm filter giữ nguyên) ...
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      if (statusFilter === "all") return true;
      const apiStatus = b.status?.toLowerCase() || "pending";
      return statusFilter === "approved"
        ? apiStatus === "approved"
        : apiStatus !== "approved";
    });
  }, [bookings, statusFilter]);

  // --- RENDER ITEM (Truyền thêm slotTemplates) ---
  const renderBookingCard = ({ item }: { item: any }) => (
    <BookingHistoryCard
      booking={item}
      slotTemplates={slotTemplates} // [MỚI] Truyền xuống con
      onRemove={() => remove(item.id)}
    />
  );

  // ... (Phần render loading/empty giữ nguyên) ...
  if (isLoading)
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  if (bookings.length === 0)
    return (
      <View style={styles.root}>
        <EmptyBookingHistory />
      </View>
    );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: "Lịch sử đặt" }} />
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <BookingFilterHeader
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#EA580C"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
