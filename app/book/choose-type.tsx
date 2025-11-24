import { useRouter } from "expo-router";
// --- THAY ĐỔI: Thêm icon History ---
import {
  Book,
  Briefcase,
  CalendarDays,
  History, // Icon mới
  Star,
} from "lucide-react-native";
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

  const handleSelectType = (
    type: "teaching_flexible" | "teaching_recurring" | "project" | "priority"
  ) => {
    router.replace({
      pathname: "/book/rooms" as any,
      params: { type: type },
    });
  };

  // --- THAY ĐỔI: Hàm mới để điều hướng đến trang thay đổi ---
  const handleChangeBooking = () => {
    router.push("/book/select-booking-to-change" as any);
  };

  return (
    <Pressable onPress={() => router.back()} style={styles.overlay}>
      <Pressable style={styles.container}>
        <Text style={styles.headerTitle}>Chọn loại đặt phòng</Text>

        {/* ... (3 card cũ: flexible, recurring, project giữ nguyên) ... */}
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
              Chọn linh hoạt tối đa 10 slot, mời thành viên
            </Text>
          </View>
        </BookingCard>

        <BookingCard
          layout="option"
          onPress={() => handleSelectType("priority")}
        >
          <View style={styles.iconWrapper}>
            <Star size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch ưu tiên</Text>
            <Text style={styles.optionDesc}>
              Sự kiện quan trọng (tối đa 10 slot)
            </Text>
          </View>
        </BookingCard>

        {/* --- THAY ĐỔI: Card MỚI "Thay đổi lịch đã đặt" --- */}
        <BookingCard layout="option" onPress={handleChangeBooking}>
          <View style={styles.iconWrapper}>
            <History size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Thay đổi lịch đã đặt</Text>
            <Text style={styles.optionDesc}>
              Chọn và điều chỉnh lại các slot đã đặt
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

const styles = StyleSheet.create({
  // ... (styles giữ nguyên) ...
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
