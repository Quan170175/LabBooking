import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

// Hàm hỗ trợ format ngày tháng (bạn có thể tùy chỉnh)
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN");
  } catch (e) {
    return dateString;
  }
};

export default function SelectBookingToChange() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const bookingsString = await AsyncStorage.getItem("bookings");
        const allBookings = bookingsString ? JSON.parse(bookingsString) : [];

        // Lọc ra các booking có thể thay đổi:
        // (Ví dụ: không phải 'priority' và không phải 'change_request')
        const changeableBookings = allBookings.filter(
          (b: any) =>
            b.type !== "priority" &&
            b.type !== "reschedule_request" &&
            b.status !== "pending_priority"
        );
        setBookings(changeableBookings);
      } catch (error) {
        console.error("Lỗi khi tải bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();
  }, []);

  const handleSelectBooking = (bookingId: string) => {
    // Chỉ cần gửi ID, trang sau sẽ tự tải chi tiết
    router.push({
      pathname: "/book/change-slots" as any,
      params: { bookingId: bookingId },
    });
  };

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.2 14V6c0-.53-.21-1.04-.59-1.41C20.24 4.21 19.73 4 19.2 4H5.2c-.53 0-1.04.21-1.41.59C3.41 4.96 3.2 5.47 3.2 6v14c0 .53.21 1.04.59 1.41.37.38.88.59 1.41.59h8"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.2 10h18M16.2 18l-3-3 3.5-3.5c.39-.39 1.02-.39 1.41 0l1.59 1.59c.39.39.39 1.02 0 1.41L16.2 18z"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingPageHeader
        icon={headerIcon}
        title="Chọn lịch cần thay đổi"
        subtitle="Chọn một lịch đã đặt để điều chỉnh lại các slot"
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#EA580C" />
      ) : bookings.length === 0 ? (
        <Text style={styles.emptyText}>
          Không tìm thấy lịch nào có thể thay đổi.
        </Text>
      ) : (
        <View style={styles.listContainer}>
          {bookings.map((b) => (
            <BookingCard key={b.id}>
              <View style={styles.roomInfo}>
                <View>
                  <Text style={styles.roomName}>{b.roomName}</Text>
                  <Text style={styles.roomDesc}>
                    Loại: {b.type} • Số slot: {b.slots.length}
                  </Text>
                  {/* Bạn có thể thêm ngày/giờ slot đầu tiên ở đây */}
                  {b.slots.length > 0 && (
                    <Text style={styles.roomDesc}>
                      Bắt đầu: {formatDate(b.slots[0].date)}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleSelectBooking(b.id)}
                style={styles.selectButton}
              >
                <Text style={styles.selectButtonText}>Thay đổi</Text>
              </TouchableOpacity>
            </BookingCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  listContainer: { gap: 16 },
  roomInfo: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1 },
  roomName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  roomDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  selectButton: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFDCC6",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  selectButtonText: { color: "#C2410C", fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 40,
  },
});
