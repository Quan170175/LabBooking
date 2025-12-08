import { useRouter } from "expo-router";
import {
  Book,
  Briefcase,
  CalendarDays,
  History,
  Star,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import BookingCard from "../../components/booking/BookingCard";
// 🟢 1. Import API Client
import apiClient from "../../utils/api";

// Định nghĩa interface cho User Profile
interface UserProfile {
  id: string;
  email: string;
  userName: string;
  roles: string[];
}

export default function BookChooseType() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🟢 2. Lấy thông tin User khi component được mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get<UserProfile>("/api/Auth/profile");
        if (response.data && response.data.roles) {
          if (response.data.roles.includes("Lecturer")) {
            setUserRole("Lecturer");
          } else if (response.data.roles.includes("Student")) {
            setUserRole("Student");
          } else {
            setUserRole("Other");
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        // Có thể set default role hoặc xử lý lỗi tùy ý
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSelectType = (
    type: "teaching_flexible" | "teaching_recurring" | "project" | "priority"
  ) => {
    router.replace({
      pathname: "/book/rooms" as any,
      params: { type: type },
    });
  };

  const handleChangeBooking = () => {
    router.push("/book/select-booking-to-change" as any);
  };

  if (loading) {
    return (
      <View style={[styles.overlay, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // 🟢 3. Biến kiểm tra xem có phải là Lecturer không
  const isLecturer = userRole === "Lecturer";

  return (
    <Pressable onPress={() => router.back()} style={styles.overlay}>
      <Pressable style={styles.container}>
        <Text style={styles.headerTitle}>Chọn loại đặt phòng</Text>

        {/* 🟢 4. Chỉ hiển thị nếu là Lecturer */}
        {isLecturer && (
          <>
            <BookingCard
              layout="option"
              onPress={() => handleSelectType("teaching_flexible")}
            >
              <View style={styles.iconWrapper}>
                <Book size={24} color="#C2410C" />
              </View>
              <View>
                <Text style={styles.optionTitle}>Đặt lịch dạy học</Text>
                <Text style={styles.optionDesc}>
                  Chọn linh hoạt tối đa 20 slot
                </Text>
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
          </>
        )}

        {/* Các mục hiển thị cho cả Student và Lecturer */}
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

        {/* Có thể bạn muốn ẩn mục này với Student hoặc hiện tùy logic nghiệp vụ */}
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
              Sự kiện quan trọng (tối đa 4 slot)
            </Text>
          </View>
        </BookingCard>

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
