import axios from "axios";
import { useRouter } from "expo-router";
import { CalendarClock } from "lucide-react-native"; // Icon đồng hồ
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

const apiClient = axios.create({
  baseURL: "https://localhost:7089/api", // Đổi IP nếu cần
});

// --- HELPER ---
const getTypeLabel = (type: string) => {
    switch(type) {
        case "Teaching": return "Dạy học";
        case "Project": return "Dự án";
        case "UniversityEvent": return "Sự kiện";
        default: return type;
    }
};

export default function SelectBookingToChange() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const userId = "c2f3a4d8-9b7e-43c1-8c4f-2e7a0f4c12ab"; // TODO: Lấy ID thật
        const response = await apiClient.get("/Bookings/changeable", {
            params: { userId: userId }
        });
        setBookings(response.data);
      } catch (error) {
        console.error("Lỗi tải bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();
  }, []);

  const handleSelectBooking = (bookingId: string) => {
    router.push({
      pathname: "/book/change-slots",
      params: { bookingId: bookingId },
    } as any);
  };

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M21.2 14V6c0-.53-.21-1.04-.59-1.41C20.24 4.21 19.73 4 19.2 4H5.2c-.53 0-1.04.21-1.41.59C3.41 4.96 3.2 5.47 3.2 6v14c0 .53.21 1.04.59 1.41.37.38.88.59 1.41.59h8" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.2 10h18M16.2 18l-3-3 3.5-3.5c.39-.39 1.02-.39 1.41 0l1.59 1.59c.39.39.39 1.02 0 1.41L16.2 18z" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingPageHeader
        icon={headerIcon}
        title="Chọn lịch cần thay đổi"
        subtitle="Chọn lịch đã đặt để dời ngày hoặc chỉnh sửa thông tin"
      />

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#EA580C" /></View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy lịch nào phù hợp.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {bookings.map((b) => {
             // --- LOGIC HIỂN THỊ ---
             const roomDisplay = b.labRoomResponse 
                ? `${b.labRoomResponse.labName} - ${b.labRoomResponse.location}`
                : `Phòng: ${b.labRoomId.substring(0, 8).toUpperCase()}`;

             // Tính số slot chưa diễn ra
             const totalSlots = b.slots?.length || 0;
             const now = new Date();
             now.setHours(0,0,0,0);
             const futureSlots = (b.slots || []).filter((s: any) => new Date(s.date) >= now).length;

             return (
                <BookingCard key={b.id} layout="default">
                  {/* QUAN TRỌNG: View này giúp chia đôi hàng ngang */}
                  <View style={styles.cardContainer}>
                    
                    {/* 1. CỘT TRÁI (Nội dung Text) - Chiếm hết chỗ trống */}
                    <View style={styles.textColumn}>
                      
                      {/* Dòng 1: Tiêu đề */}
                      <Text style={styles.bookingTitle} numberOfLines={1}>
                          {b.title || "Không có tiêu đề"}
                      </Text>
                      
                      {/* Dòng 2: Tên Phòng */}
                      <Text style={styles.roomName} numberOfLines={1}>
                          {roomDisplay}
                      </Text>

                      {/* Dòng 3: Loại & Số người */}
                      <Text style={styles.metaText}>
                        {getTypeLabel(b.type)} • {b.numberOfParticipants} người
                      </Text>
                      
                      {/* Dòng 4: Slot Info */}
                      <View style={styles.slotRow}>
                        <CalendarClock size={14} color="#EA580C" style={{marginRight: 4}}/>
                        <Text style={styles.slotText}>
                           <Text style={{fontWeight:'700'}}>{totalSlots}</Text> slot tổng • <Text style={{color:'#EA580C', fontWeight:'700'}}>{futureSlots}</Text> slot chưa diễn ra
                        </Text>
                      </View>
                    </View>
                    
                    {/* 2. CỘT PHẢI (Nút bấm) - Kích thước tự động */}
                    <TouchableOpacity
                      onPress={() => handleSelectBooking(b.id)}
                      style={styles.selectButton}
                    >
                      <Text style={styles.selectButtonText}>Sửa</Text>
                    </TouchableOpacity>

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
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  listContainer: { gap: 16 },
  
  // --- LAYOUT CHÍNH ---
  cardContainer: { 
    flexDirection: 'row',       // Xếp ngang
    alignItems: 'center',       // Căn giữa dọc
    justifyContent: 'space-between', 
    width: '100%',
  },
  
  // Cột trái: flex: 1 để đẩy nút sang lề phải
  textColumn: { 
    flex: 1, 
    paddingRight: 12 
  },

  bookingTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  roomName: { fontSize: 14, fontWeight: "600", color: "#EA580C", marginBottom: 4 },
  metaText: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  
  // Dòng slot
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotText: { fontSize: 13, color: "#334155" },

  // Nút bấm
  selectButton: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFDCC6",
    paddingVertical: 10,    // Tăng nhẹ chiều cao nút cho dễ bấm
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  selectButtonText: { color: "#C2410C", fontWeight: "600", fontSize: 13 },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { textAlign: "center", color: "#64748B", fontSize: 15 },
});