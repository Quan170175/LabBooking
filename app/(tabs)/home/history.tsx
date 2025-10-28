import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
// Đường dẫn: app/(tabs)/home -> utils
import { Booking } from "../../../utils/bookingTypes";
import { isApproved } from "../../../utils/bookingUtils";
// Đường dẫn: app/(tabs)/home -> app/components/home
import BookingFilterHeader from "../../../components/home/BookingFilterHeader";
import BookingHistoryCard from "../../../components/home/BookingHistoryCard";
import EmptyBookingHistory from "../../../components/home/EmptyBookingHistory";

type StatusFilter = "all" | "approved" | "pending";

export default function HistoryScreen() {
  // Đổi tên component cho khớp tên file
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Tải dữ liệu
  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      try {
        const b = await AsyncStorage.getItem("bookings");
        const bookingsData = JSON.parse(b || "[]");
        setBookings(Array.isArray(bookingsData) ? bookingsData.reverse() : []);
      } catch (e) {
        console.error("Failed to load bookings", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookings();
  }, []);

  // 2. Hàm xóa
  function remove(id: number) {
    Alert.alert("Xóa lịch đặt", "Bạn có chắc muốn xóa lịch đặt này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const all = await AsyncStorage.getItem("bookings");
            const bookingsData = JSON.parse(all || "[]");
            const next = bookingsData.filter((x: Booking) => x.id !== id);
            await AsyncStorage.setItem("bookings", JSON.stringify(next));
            setBookings(next.reverse());
          } catch (e) {
            console.error("Failed to remove booking", e);
          }
        },
      },
    ]);
  }

  // 3. Lọc danh sách
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: Booking) => {
      if (statusFilter === "all") return true;
      const approved = isApproved(b);
      return statusFilter === "approved" ? approved : !approved;
    });
  }, [bookings, statusFilter]);

  // 4. Render (đã đưa vào components)
  const renderBookingCard = ({ item }: { item: Booking }) => (
    <BookingHistoryCard booking={item} onRemove={remove} />
  );

  const renderListHeader = () => (
    <BookingFilterHeader
      statusFilter={statusFilter}
      onFilterChange={setStatusFilter}
    />
  );

  // Hiển thị loading
  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  // Hiển thị danh sách trống
  if (bookings.length === 0) {
    return (
      <View style={styles.root}>
        <EmptyBookingHistory />
      </View>
    );
  }

  // Render chính
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: "Lịch sử đặt" }} />
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// StyleSheet
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
