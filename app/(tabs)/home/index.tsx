import { useRouter } from "expo-router";
import {
  CalendarCheck2,
  ClipboardList,
  Clock3,
  ShieldCheck,
  LifeBuoy,
  LayoutDashboard,
  Monitor,
  Wrench,
  DoorOpen,
  History,
  HomeIcon,
  Mail,
  ScanLine,
  ClipboardCheck,
  HistoryIcon,
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
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import FeatureTile from "../../../components/home/FeatureTile";
import { registerPushTokenOnServer } from "../../../services/apiserver";
import { registerForPushNotificationsAsync } from "../../../services/notificationService";

// --- IMPORT API CLIENT ---
import apiClient from "../../../utils/api";

// 1. ĐỊNH NGHĨA ROLES
const ROLES = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  MANAGER: "Manager",
  SECURITYGUARD: "SecurityGuard",
};

// 2. CẤU HÌNH MENU THEO SECTIONS (Giữ nguyên)
const APP_SECTIONS = [
  {
    id: "booking",
    title: "Hoạt động đặt phòng",
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
        to: "/(tabs)/home/(manager)/view-equipment",
        title: "Xem thiết bị",
        description: "Xem tình trạng thiết bị",
        icon: Monitor,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/home/send-email",
        title: "Gửi thông báo",
        description: "Soạn và gửi email cho SV",
        icon: Mail,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
      {
        to: "/(tabs)/home/change-request-history",
        title: "Yêu cầu thay đổi",
        description: "Xem yêu cầu thay đổi",
        icon: CalendarCheck2,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
    ],
  },
  {
    id: "admin",
    title: "Khu vực quản lý",
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
        to: "/(tabs)/home/(manager)/appovals-history",
        title: "Lịch sử duyệt",
        description: "Xem lịch duyệt",
        icon: History,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/my-lab",
        title: "Thông tin phòng",
        description: "Xem thông tin phòng",
        icon: HomeIcon,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/manage-door-requests",
        title: "Duyệt mở cửa",
        description: "Duyệt yêu cầu mở cửa",
        icon: DoorOpen,
        allowedRoles: [ROLES.MANAGER],
      },
    ],
  },
  {
    id: "manager",
    title: "Khu vực bảo trì",
    items: [
      {
        to: "/(tabs)/home/(manager)/create-room-maintenance",
        title: "Bảo trì phòng",
        description: "Đóng phòng sửa chữa",
        icon: Wrench,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/create-equipment-maintenance",
        title: "Bảo trì thiết bị",
        description: "Sửa chữa thiết bị hỏng",
        icon: Wrench,
        allowedRoles: [ROLES.MANAGER],
      },
      {
        to: "/(tabs)/home/(manager)/maintenancehistory",
        title: "Lịch sử bảo trì",
        description: "Xem lịch sử bảo trì",
        icon: History,
        allowedRoles: [ROLES.MANAGER],
      },
    ],
  },
  {
    id: "info",
    title: "Tài nguyên & Hỗ trợ",
    items: [
      {
        to: "/home/support",
        title: "Hỗ trợ",
        description: "Gửi yêu cầu giúp đỡ",
        icon: LifeBuoy,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER, ROLES.MANAGER],
      },
      {
        to: "/home/door-request",
        title: "Yêu cầu mở cửa",
        description: "Gửi yêu cầu mở cửa",
        icon: DoorOpen,
        allowedRoles: [ROLES.STUDENT, ROLES.LECTURER],
      },
    ],
  },
  {
    id: "security",
    title: "Khu vực An ninh",
    items: [
      {
        to: "/(tabs)/home/create-incident",
        title: "Báo cáo sự cố",
        description: "Tạo báo cáo mới",
        icon: ShieldCheck,
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
        to: "/(tabs)/home/today-schedule",
        title: "Bàn giao phòng",
        description: "Kiểm tra thiết bị",
        icon: ClipboardCheck,
        allowedRoles: [ROLES.SECURITYGUARD],
      },
      {
        to: "/(tabs)/home/scanner",
        title: "Quét xác thực",
        description: "Kiểm tra quyền vào phòng",
        icon: ScanLine,
        allowedRoles: [ROLES.SECURITYGUARD],
      },
      {
        to: "/(tabs)/home/today-schedule-history",
        title: "Lịch sử bàn giao",
        description: "Xem lịch sử bàn giao",
        icon: HistoryIcon,
        allowedRoles: [ROLES.SECURITYGUARD, ROLES.MANAGER],
      },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Người dùng");

  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        // 1. Lấy Role từ JWT để render menu nhanh
        const decoded: any = jwtDecode(token);
        const roleKey =
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = decoded[roleKey] || decoded.role || "Student";
        setUserRole(role);

        // 2. GỌI API PROFILE ĐỂ LẤY FULLNAME CHÍNH XÁC
        try {
          // Sử dụng apiClient giống như trong EmailComposerScreen
          const response = await apiClient.get("/api/Auth/profile");

          if (response.data && response.data.fullName) {
            setUserName(response.data.fullName);
          } else {
            // Fallback nếu API không trả về fullName (dùng tạm tên từ JWT)
            setUserName(decoded.fullName || decoded.name || "User");
          }
        } catch (apiError) {
          console.error("Lỗi lấy thông tin Profile từ API:", apiError);
          // Nếu API lỗi, lấy tên từ JWT làm dự phòng
          setUserName(decoded.fullName || decoded.name || "User");
        }

        // 3. Đăng ký thông báo
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
    <View style={styles.containerWrapper}>
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
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
                  {userName}
                </Text>
              </View>
            </View>

            <Text style={styles.heroDesc}>
              {userRole === ROLES.MANAGER || userRole === ROLES.SECURITYGUARD
                ? "Hệ thống đang hoạt động ổn định. Kiểm tra các yêu cầu cần duyệt bên dưới."
                : "Đặt phòng thực hành, theo dõi lịch và cập nhật thông báo ngay trên điện thoại."}
            </Text>

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

        {APP_SECTIONS.map((section, sectionIndex) => {
          const validItems = section.items.filter((item) =>
            userRole ? item.allowedRoles.includes(userRole) : false
          );
          if (validItems.length === 0) return null;

          return (
            <Animated.View
              key={section.id}
              entering={FadeInUp.delay(sectionIndex * 200).duration(600)}
              style={styles.sectionContainer}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
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
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: { flex: 1, backgroundColor: "#fff7ed" },
  root: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "#fff7ed",
    flexGrow: 1,
  },
  hero: {
    borderRadius: 24,
    backgroundColor: "#f97316",
    marginBottom: 24,
    elevation: 10,
    overflow: "hidden",
  },
  heroContent: { padding: 20 },
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
  },
  userNameText: { color: "white", fontSize: 22, fontWeight: "800" },
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
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  ctaText: { color: "#ea580c", fontWeight: "700", fontSize: 15 },
  sectionContainer: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridItem: { width: "48%" },
});
