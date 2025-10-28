import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
// Đường dẫn: app/(tabs)/home -> utils
import { Booking, Room } from "../../../utils/bookingTypes";
import { DEFAULT_ROOMS, SLOTS } from "../../../utils/bookingUtils";
// Đường dẫn: app/(tabs)/home -> app/components/home
import AvailabilityFilters from "../../../components/home/AvailabilityFilters";
import RoomAvailabilityCard from "../../../components/home/RoomAvailabilityCard";

export default function AvailabilityScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>(SLOTS[0].id);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Tải dữ liệu
  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      try {
        const b = await AsyncStorage.getItem("bookings");
        const bookingsData = JSON.parse(b || "[]");
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (e) {
        console.error("Failed to load bookings", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookings();
  }, []);

  // 2. Xử lý logic tính toán phòng
  const rooms: Room[] = useMemo(() => {
    const roomsMap: Record<string, Room> = {};
    DEFAULT_ROOMS.forEach((r) => {
      roomsMap[r.id] = { ...r, bookings: [] };
    });

    bookings.forEach((b) => {
      const id = b.roomId || b.roomName || `room-${b.id}`;
      if (!roomsMap[id]) {
        roomsMap[id] = { id, name: b.roomName || b.roomId, bookings: [] };
      }
      roomsMap[id].bookings.push(b);
    });

    return Object.values(roomsMap);
  }, [bookings]);

  // 3. Render Header
  const renderListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Tình trạng phòng</Text>
        <Text style={styles.subtitle}>
          Tổng quan trạng thái các phòng lab theo thời gian thực.
        </Text>
      </View>
      <AvailabilityFilters
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        setSelectedDate={setSelectedDate}
        setSelectedSlot={setSelectedSlot}
      />
    </>
  );

  // 4. Render từng Room Card
  const renderRoomCard = ({ item }: { item: Room }) => (
    <RoomAvailabilityCard
      room={item}
      selectedDate={selectedDate}
      selectedSlot={selectedSlot}
    />
  );

  // 5. Render khi không có dữ liệu
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Không có dữ liệu phòng</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có lịch đặt nào để hiển thị tình trạng phòng.
      </Text>
    </View>
  );

  // 6. Render Loading
  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  // 7. Render chính
  return (
    <View style={styles.root}>
      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  emptyContainer: {
    marginTop: 24,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
});
