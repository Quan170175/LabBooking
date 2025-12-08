import { useRouter } from "expo-router";
import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  ShieldCheck,
  LifeBuoy,
  LayoutDashboard,
  Monitor,
  Wrench,
  DoorOpen, // 🟢 Mới: Icon mở cửa
  History, // 🟢 Mới: Icon lịch sử
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import FeatureTile from "../../../components/home/FeatureTile";
import { registerPushTokenOnServer } from "../../../services/apiserver";
import { registerForPushNotificationsAsync } from "../../../services/notificationService";
// import "../../../assets/images/flms.png"; // Comment lại dòng này nếu gây lỗi import ảnh, hoặc đảm bảo đường dẫn đúng

// 1. ĐỊNH NGHĨA ROLES
const ROLES = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  MANAGER: "Manager",
  SECURITYGUARD: "SecurityGuard",
};

// 2. CẤU HÌNH MENU THEO SECTIONS (Phân loại)
const APP_SECTIONS = [
  {
    id: "booking",
    title: "Hoạt động đặt phòng",
    description: "Các chức năng chính để đăng ký phòng Lab",
    items: [
      {
        to: "/book/choose-type",
        title: "Đặt Lab",
        description: "Chọn phòng, giờ học",
        icon: CalendarCheck2,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
      {
        to: "/home/history",
        title: "Lịch sử đặt",
        description: "Quản lý yêu cầu",
        icon: Clock3,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
      {
        to: "/home/availability",
        title: "Tình trạng phòng",
        description: "Check phòng trống",
        icon: ClipboardList,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER, ROLES.MANAGER],
      },
      {
        to: "/home/timetable",
        title: "Thời khóa biểu",
        description: "Lịch toàn trường",
        icon: CalendarDays,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
    ],
  },
  {
    id: "info",
    title: "Tài nguyên & Hỗ trợ",
    description: "Tài liệu hướng dẫn và trợ giúp",
    items: [
      {
        to: "/home/resources",
        title: "Tài liệu lab",
        description: "Hướng dẫn & SOP",
        icon: BookOpen,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
      {
        to: "/home/support",
        title: "Hỗ trợ",
        description: "Gửi yêu cầu giúp đỡ",
        icon: LifeBuoy,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER, ROLES.MANAGER],
      },
      {
        to: "/home/doorrequest",
        title: "Yêu cầu mở cửa",
        description: "Gửi yêu cầu mở cửa",
        icon: DoorOpen, // 🟢 Đã đổi icon thành Cửa mở
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
    ],
  },
  {
    id: "admin",
    title: "Khu vực quản lý",
    description: "Chức năng dành riêng cho Manager",
    items: [
      {
        to: "/(tabs)/home/approvals",
        title: "Phê duyệt",
        description: "Duyệt yêu cầu",
        icon: LayoutDashboard,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/security-incidents",
        title: "Sự cố bảo mật",
        description: "Báo cáo sự cố",
        icon: ShieldCheck,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/viewequipment",
        title: "Xem thiết bị",
        description: "Xem tình trạng thiết bị",
        icon: Monitor, // 🟢 Đã đổi icon thành Màn hình
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/create-room-maintenance",
        title: "Bảo trì phòng",
        description: "Đóng phòng để sửa chữa",
        icon: Wrench,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/create-equipment-maintenance",
        title: "Bảo trì thiết bị",
        description: "Sửa chữa thiết bị hỏng",
        icon: Wrench, // Đổi sang Wrench cho đồng bộ với bảo trì
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/maintenancehistory",
        title: "Lịch sử bảo trì",
        description: "Xem lịch sử bảo trì",
        icon: History, // 🟢 Đã đổi icon thành Lịch sử
        allowedRoles: [ROLES.MANAGER],
      },
    ],
  },
  {
    id: "security",
    title: "Khu vực An ninh",
    description: "Chức năng dành riêng cho Bảo vệ",
    items: [
      {
        to: "/(tabs)/home/door-requests",
        title: "Yêu cầu mở cửa",
        description: "Xử lý yêu cầu ra vào",
        icon: DoorOpen, // 🟢 Đã đổi icon thành Cửa mở
        allowedRoles: [ROLES.SECURITYGUARD],
      },
      {
        to: "/(tabs)/home/incident-history",
        title: "Lịch sử sự cố",
        description: "Xem danh sách sự cố",
        icon: ShieldCheck,
        allowedRoles: [ROLES.SECURITYGUARD],
      },
      {
        to: "/(tabs)/home/create-incident",
        title: "Báo cáo sự cố",
        description: "Tạo báo cáo mới",
        icon: ShieldCheck,
        allowedRoles: [ROLES.SECURITYGUARD],
      },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  // --- INIT LOGIC ---
  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const decoded: any = jwtDecode(token);
        const roleKey =
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const nameKey =
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

        const role = decoded[roleKey] || decoded.role || "Student";
        const name = decoded[nameKey] || decoded.name || "User";

        setUserRole(role);
        setUserName(name);

        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await registerPushTokenOnServer(pushToken, token);
        }
      } catch (error) {
        console.error("Lỗi khởi tạo Home:", error);
      } finally {
        setLoading(false);
      }
    }
    initializeApp();
  }, []);

  // Hàm lấy lời chào theo giờ
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {/* --- HERO SECTION (ANIMATED) --- */}
      <Animated.View
        entering={FadeInDown.duration(800).springify()}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIcon}>
              <Image
                source={require("../../../assets/images/flms.png")}
                style={styles.heroImage}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userNameText} numberOfLines={1}>
                {userName.split("@")[0]}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            {userRole === ROLES.MANAGER || userRole === ROLES.SECURITYGUARD
              ? "Hệ thống đang hoạt động ổn định. Kiểm tra các yêu cầu cần duyệt bên dưới."
              : "Đặt phòng thực hành, theo dõi lịch và cập nhật thông báo ngay trên điện thoại."}
          </Text>

          {/* Nút CTA chỉ hiện khi KHÔNG PHẢI là Manager VÀ KHÔNG PHẢI là Security */}
          {userRole !== ROLES.MANAGER && userRole !== ROLES.SECURITYGUARD && (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/book/choose-type" as any)}
            >
              <CalendarCheck2 size={18} color="#ea580c" strokeWidth={2.5} />
              <Text style={styles.ctaText}>Đặt Lab Ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* --- SECTIONS LOOP --- */}
      {APP_SECTIONS.map((section, sectionIndex) => {
        // Lọc các items trong section dựa trên Role
        const validItems = section.items.filter((item) =>
          userRole ? item.allowedRoles.includes(userRole) : false
        );

        // Nếu section không có item nào phù hợp với Role thì ẩn đi
        if (validItems.length === 0) return null;

        return (
          <Animated.View
            key={section.id}
            entering={FadeInUp.delay(sectionIndex * 200).duration(600)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {/* <Text style={styles.sectionDesc}>{section.description}</Text> */}
            </View>

            <View style={styles.grid}>
              {validItems.map((item) => (
                <View key={item.to} style={styles.gridItem}>
                  <FeatureTile {...item} />
                </View>
              ))}
            </View>
          </Animated.View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// STYLES
const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingTop: 20, // Tăng padding top chút
    paddingBottom: 40,
    backgroundColor: "#fff7ed",
    flexGrow: 1,
  },

  // Hero Styles
  hero: {
    borderRadius: 24,
    backgroundColor: "#f97316", // Màu cam chủ đạo
    marginBottom: 24,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  heroContent: {
    padding: 20,
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIcon: {
    height: 56,
    width: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  greetingText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userNameText: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  heroDesc: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 99, // Pill shape
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    color: "#ea580c",
    fontWeight: "700",
    fontSize: 15,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  sectionDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12, // Khoảng cách dòng
  },
  gridItem: {
    width: "48%", // 2 cột
  },
});
