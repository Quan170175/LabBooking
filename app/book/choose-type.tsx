import { useRouter } from "expo-router";
// --- THAY ĐỔI: Thêm icon CalendarDays ---
import { Book, Briefcase, CalendarDays } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BookingCard from "../../components/booking/BookingCard";

export default function BookChooseType() {
  const router = useRouter();

  // --- THAY ĐỔI: Thêm type 'teaching_flexible' và 'teaching_recurring' ---
  const handleSelectType = (
    type: "teaching_flexible" | "teaching_recurring" | "project"
  ) => {
    router.replace({
      pathname: "/book/rooms" as any,
      params: { type: type },
    });
  };

  return (
    <Pressable onPress={() => router.back()} style={styles.overlay}>
      <Pressable style={styles.container}>
        <Text style={styles.headerTitle}>Chọn loại đặt phòng</Text>

        {/* --- THAY ĐỔI: Card "Đặt lịch dạy học" (Linh hoạt) --- */}
        <BookingCard
          layout="option"
          onPress={() => handleSelectType("teaching_flexible")}
        >
          <View style={styles.iconWrapper}>
            <Book size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch dạy học</Text>
            <Text style={styles.optionDesc}>Chọn linh hoạt tối đa 20 slot</Text>
          </View>
        </BookingCard>

        {/* --- THAY ĐỔI: Card MỚI "Đặt lịch dạy học (Định kỳ)" --- */}
        <BookingCard
          layout="option"
          onPress={() => handleSelectType("teaching_recurring")}
        >
          <View style={styles.iconWrapper}>
            <CalendarDays size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch dạy học định kỳ</Text>
            <Text style={styles.optionDesc}>
              Chọn lặp lại theo tuần (tối đa 20 slot)
            </Text>
          </View>
        </BookingCard>

        {/* Card "Đặt lịch dự án" (Giữ nguyên) */}
        <BookingCard
          layout="option"
          onPress={() => handleSelectType("project")}
        >
          <View style={styles.iconWrapper}>
            <Briefcase size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch dự án</Text>
            <Text style={styles.optionDesc}>
              Chọn linh hoạt tối đa 5 slot, mời thành viên
            </Text>
          </View>
        </BookingCard>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

// --- THAY ĐỔI: Cập nhật style cho 3 card ---
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-start",
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    gap: 16,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { color: "#0F172A", fontWeight: "600", fontSize: 16 },
  optionDesc: { color: "#64748B", fontSize: 13, marginTop: 2 },
  closeButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 16,
  },
  closeButtonText: { fontSize: 18, color: "white" },
});
