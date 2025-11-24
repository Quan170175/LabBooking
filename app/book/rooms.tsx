import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
// --- THAY ĐỔI 1: Imports ---
import axios from "axios"; // Thêm
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, // Thêm
  Alert, // Thêm (để báo lỗi)
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";

// --- THAY ĐỔI 2: Thêm API Client ---
const apiClient = axios.create({
  baseURL: "https://developerops.xyz/api",
});

// --- THAY ĐỔI 3: Xóa Dữ Liệu Giả Lập ---
// const ROOMS = [ ... ]; // Xóa

export default function BookRooms() {
  const router = useRouter();
  const { type = "project" } = useLocalSearchParams<{ type: string }>();

  // --- THAY ĐỔI 4: Thêm State cho Dữ Liệu API ---
  const [rooms, setRooms] = useState<any[]>([]); // Lưu danh sách phòng
  const [isLoading, setIsLoading] = useState(true); // Trạng thái loading

  // --- THAY ĐỔI 5: Thêm useEffect để Tải Dữ Liệu ---
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        // Gọi API thật
        const response = await apiClient.get(
          "/LabRooms?PageNumber=1&PageSize=10"
        );
        // Dữ liệu phòng nằm trong 'items'
        setRooms(response.data.items);
      } catch (e: any) {
        console.error("Lỗi khi tải danh sách phòng:", e);
        Alert.alert("Lỗi API", `Không thể tải danh sách phòng: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, []); // [] = Chạy 1 lần khi component được tải

  // --- THAY ĐỔI 6: Cập nhật `handleSelectRoom` ---
  // (Thay `room.name` bằng `room.labName`)
  const handleSelectRoom = async (room: any) => {
    try {
      const currentBooking = {
        roomId: room.id,
        roomName: room.labName, // <-- Sửa ở đây
        type,
        slots: [],
        devices: [],
      };
      await AsyncStorage.setItem(
        "currentBooking",
        JSON.stringify(currentBooking)
      );
      router.push({
        pathname: "/book/slots" as any,
        params: { type, roomId: room.id },
      });
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu đặt phòng:", error);
    }
  };

  const headerIcon = (
    // ... (SVG icon giữ nguyên) ...
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.2 2V6M16.2 2V6M21.2 14V6c0-.53-.21-1.04-.59-1.41C20.24 4.21 19.73 4 19.2 4H5.2c-.53 0-1.04.21-1.41.59C3.41 4.96 3.2 5.47 3.2 6v14c0 .53.21 1.04.59 1.41.37.38.88.59 1.41.59h8"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.2 10h18M16.2 20l2 2 4-4"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getSubtitle = () => {
    // ... (Logic subtitle giữ nguyên) ...
    switch (type) {
      case "teaching_flexible":
        return "Chọn linh hoạt tối đa 20 slot";
      case "teaching_recurring":
        return "Chọn lặp lại theo tuần (tối đa 20 slot)";
      case "project":
        return "Chọn linh hoạt tối đa 5 slot";
      case "priority":
        return "Chọn tối đa 4 slot (có thể chọn trùng lịch)";
      default:
        return "Chọn lịch của bạn";
    }
  };

  // --- THAY ĐỔI 7: Thêm Trạng Thái Loading ---
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={1} />

      <BookingPageHeader
        icon={headerIcon}
        title="Chọn phòng lab"
        subtitle={getSubtitle()}
      />

      {/* --- THAY ĐỔI 8: Dùng `rooms.map` và dữ liệu thật --- */}
      <View style={styles.roomList}>
        {rooms.map((room) => {
          // Tạo mô tả (desc) từ dữ liệu API
          let desc = `${room.location} - ${room.maximumLimit} chỗ ngồi`;
          if (room.equipments && room.equipments.length > 0) {
            desc += ` (${room.equipments.length} thiết bị)`;
          }

          return (
            <BookingCard key={room.id}>
              <View style={styles.roomInfo}>
                <View style={styles.roomIcon}>
                  {/* ... (SVG icon giữ nguyên) ... */}
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M15.2 2H9.2C8.65 2 8.2 2.45 8.2 3v2c0 .55.45 1 1 1h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM16.2 4h2c.55 0 1 .45 1 1v15c0 .55-.45 1-1 1h-12c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1h2"
                      stroke="#EA580C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12.2 11h4M12.2 16h4M8.2 11h.01M8.2 16h.01"
                      stroke="#EA580C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.roomName}>{room.labName}</Text>
                  <Text style={styles.roomDesc}>{desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleSelectRoom(room)}
                style={styles.selectButton}
              >
                <Text style={styles.selectButtonText}>Chọn</Text>
              </TouchableOpacity>
            </BookingCard>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (Styles cũ giữ nguyên) ...
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  roomList: { gap: 16 },
  roomInfo: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1 },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
  },
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

  // --- THAY ĐỔI 9: Thêm style cho loading ---
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
});
