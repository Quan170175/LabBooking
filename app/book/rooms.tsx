import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
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

// ... (ROOMS data giữ nguyên) ...
const ROOMS = [
  {
    id: "lab1",
    name: "Phòng Lab A101",
    desc: "30 máy tính, 3 máy chủ, 2 máy in",
  },
  {
    id: "lab2",
    name: "Phòng Lab B202",
    desc: "20 máy tính, thiết bị mạng, 1 máy in",
  },
];

export default function BookRooms() {
  const router = useRouter();
  const { type = "project" } = useLocalSearchParams<{ type: string }>();

  const handleSelectRoom = async (room: (typeof ROOMS)[0]) => {
    // ... (logic handleSelectRoom giữ nguyên) ...
    try {
      const currentBooking = {
        roomId: room.id,
        roomName: room.name,
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

  // --- THAY ĐỔI: Logic subtitle cho 4 loại ---
  const getSubtitle = () => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={1} />

      <BookingPageHeader
        icon={headerIcon}
        title="Chọn phòng lab"
        subtitle={getSubtitle()}
      />

      <View style={styles.roomList}>
        {ROOMS.map((room) => (
          <BookingCard key={room.id}>
            {/* ... (Phần render room list giữ nguyên) ... */}
            <View style={styles.roomInfo}>
              <View style={styles.roomIcon}>
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
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomDesc}>{room.desc}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleSelectRoom(room)}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>Chọn</Text>
            </TouchableOpacity>
          </BookingCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (Styles giữ nguyên) ...
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
});
