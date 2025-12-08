import { useRouter } from "expo-router";
import { AlertCircle, CalendarClock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";

// --- COMPONENTS ---
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

// --- IMPORT API CLIENT ---
import apiClient from "../../utils/api";

// --- HELPER ---
const getTypeLabel = (type: string) => {
  switch (type) {
    case "Teaching":
      return "Dạy học";
    case "Project":
      return "Dự án";
    case "UniversityEvent":
      return "Sự kiện";
    default:
      return type;
  }
};

export default function SelectBookingToChange() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoading(true);
        console.log("📥 Fetching changeable bookings...");

        // Gọi API lấy danh sách (Backend đã update thêm field hasPendingChangeRequest)
        const response = await apiClient.get("/api/Bookings/changeable");

        console.log(`✅ Loaded ${response.data} bookings.`);
        setBookings(response.data);
      } catch (error: any) {
        console.error("Lỗi tải bookings:", error);
        if (error.response?.status === 401) {
          Alert.alert("Lỗi", "Phiên đăng nhập hết hạn.");
        } else {
          Alert.alert("Lỗi", "Không tải được danh sách.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();
  }, []);

  const handleSelectBooking = (bookingId: string) => {
    console.log("✏️ Chọn booking để thay đổi:", bookingId);
    router.push({
      pathname: "/book/change-slots", // Hoặc change-slots tùy flow
      params: { bookingId: bookingId },
    } as any);
  };

  // Icon header
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
        subtitle="Danh sách các lịch đã được duyệt có thể chỉnh sửa"
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy lịch nào phù hợp.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {bookings.map((b) => {
            // --- LOGIC HIỂN THỊ ---
            const roomDisplay =
              b.labRoomResponse?.labName || `Phòng: ${b.labRoomId}`;
            const totalSlots = b.slots?.length || 0;

            // Check xem có đơn pending không (QUAN TRỌNG)
            const isPendingChange = b.hasPendingChangeRequest === true;

            // Đếm số slot tương lai
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const futureSlots = (b.slots || []).filter(
              (s: any) => new Date(s.date) >= now
            ).length;

            return (
              <BookingCard key={b.id} layout="default">
                <View style={styles.cardContainer}>
                  {/* 1. CỘT TRÁI: THÔNG TIN */}
                  <View style={styles.textColumn}>
                    <Text style={styles.bookingTitle} numberOfLines={1}>
                      {b.title || "Không có tiêu đề"}
                    </Text>

                    <Text style={styles.roomName} numberOfLines={1}>
                      {roomDisplay}
                    </Text>

                    <Text style={styles.metaText}>
                      {getTypeLabel(b.type)} • {b.numberOfParticipants} người
                    </Text>

                    <View style={styles.slotRow}>
                      <CalendarClock
                        size={14}
                        color="#EA580C"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.slotText}>
                        <Text style={{ fontWeight: "700" }}>{totalSlots}</Text>{" "}
                        slot tổng •{" "}
                        <Text style={{ color: "#EA580C", fontWeight: "700" }}>
                          {futureSlots}
                        </Text>{" "}
                        slot chưa diễn ra
                      </Text>
                    </View>

                    {/* [MỚI] Dòng thông báo nhỏ nếu đang Pending */}
                    {isPendingChange && (
                      <View style={styles.pendingNote}>
                        <AlertCircle size={12} color="#D97706" />
                        <Text style={styles.pendingNoteText}>
                          Đang có yêu cầu sửa đổi chờ duyệt
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 2. CỘT PHẢI: NÚT BẤM */}
                  <View style={styles.actionColumn}>
                    <TouchableOpacity
                      onPress={() => handleSelectBooking(b.id)}
                      disabled={isPendingChange} // Chặn bấm nếu đang pending
                      style={[
                        styles.selectButton,
                        isPendingChange && styles.disabledButton, // Style xám nếu pending
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          isPendingChange && styles.disabledButtonText,
                        ]}
                      >
                        {isPendingChange ? "Đã gửi" : "Sửa"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </BookingCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  listContainer: { gap: 16 },

  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  textColumn: { flex: 1, paddingRight: 12 },
  actionColumn: { alignItems: "flex-end" },

  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EA580C",
    marginBottom: 4,
  },
  metaText: { fontSize: 13, color: "#64748B", marginBottom: 6 },

  slotRow: { flexDirection: "row", alignItems: "center" },
  slotText: { fontSize: 13, color: "#334155" },

  // Styles cho dòng thông báo nhỏ
  pendingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  pendingNoteText: { fontSize: 11, color: "#D97706", fontStyle: "italic" },

  // Styles Nút
  selectButton: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFDCC6",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  selectButtonText: { color: "#C2410C", fontWeight: "600", fontSize: 13 },

  // Styles Disabled (Khi đang chờ duyệt)
  disabledButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },

  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { textAlign: "center", color: "#64748B", fontSize: 15 },
});
