import { useRouter } from "expo-router";
import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Alert,
  Button, // --- CÓ LIÊN QUAN ĐẾN NOTIFICATION (để test) ---
  ScrollView,
  StyleSheet,
  Text, // --- CÓ LIÊN QUAN ĐẾN NOTIFICATION (để test) ---
  TouchableOpacity,
  View,
} from "react-native";
import FeatureTile from "../../../components/home/FeatureTile";

// --- START: NOTIFICATION LOGIC ---
// (Tất cả code liên quan đến thông báo được gom ở đây)

// 1. Import các hàm từ service
import {
  registerPushTokenOnServer,
  triggerTestNotification,
} from "../../../services/apiserver"; // <-- Dịch vụ gọi API
import { registerForPushNotificationsAsync } from "../../../services/notificationService"; // <-- Dịch vụ Expo Notification

// 2. Hằng số Auth Token (dùng để test)
// 🛑 QUAN TRỌNG: DÁN AUTH TOKEN (JWT) CÒN HẠN CỦA BẠN VÀO ĐÂY
const FAKE_AUTH_TOKEN_FOR_TESTING =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjI2YWUxZDc5LWUxNjktNDM4Ny04NDE5LTk1MWIxMGU4MDc4MiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im5naGlhaHRAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6Im5naGlhaHRAZ21haWwuY29tIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJHSFU0TVBLNkEyTUVDMzVUM1VNTUpRUkY3Tlg2SExITCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYyODM5MjE0LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MDg5IiwiYXVkIjoiTGFiQm9va2luZyJ9.3ANZyc0nY0sFS66jJCBnK3Gy9y_S-PiUBW0dYkWQfPQ";
// --- END: NOTIFICATION LOGIC ---

const featureGroups = [
  {
    to: "/book/choose-type",
    title: "Đặt Lab",
    description: "Chọn phòng, giờ học",
    icon: CalendarCheck2,
  },
  {
    to: "/home/history",
    title: "Lịch sử đặt",
    description: "Quản lý yêu cầu",
    icon: Clock3,
  },
  {
    to: "/home/availability",
    title: "Tình trạng phòng",
    description: "Lab còn trống",
    icon: ClipboardList,
  },
  {
    to: "/home/timetable",
    title: "Thời khóa biểu",
    description: "Đồng bộ lịch học",
    icon: CalendarDays,
  },
  {
    to: "/home/resources",
    title: "Tài liệu lab",
    description: "Hướng dẫn & SOP",
    icon: BookOpen,
  },
  {
    to: "/home/support",
    title: "Hỗ trợ",
    description: "Gửi yêu cầu giúp đỡ",
    icon: ShieldCheck,
  },
  // {
  //   to: "/home/community",
  //   title: "Cộng đồng",
  //   description: "Nhóm FPT dev",
  //   icon: UsersRound,
  // },
  // {
  //   to: "/home/reports",
  //   title: "Biên bản",
  //   description: "Kết quả lab",
  //   icon: FileText,
  // },
];

export default function Home() {
  const router = useRouter();
  // --- START: NOTIFICATION LOGIC ---

  useEffect(() => {
    async function getTokenAndRegister() {
      const token = await registerForPushNotificationsAsync();

      if (token) {
        console.log("Your Expo Push Token:", token);
        if (
          FAKE_AUTH_TOKEN_FOR_TESTING ===
          "DÁN_TOKEN_JWT_CÒN_HẠN_CỦA_BẠN_VÀO_ĐÂY"
        ) {
          Alert.alert(
            "Lưu ý",
            "Bạn cần dán Auth Token thật vào file index.tsx để test gửi token."
          );
        } else {
          console.log("Sẵn sàng gửi token lên server:", token);
          registerPushTokenOnServer(token, FAKE_AUTH_TOKEN_FOR_TESTING);
        }
      } else {
        console.log("Không thể lấy Expo Push Token.");
      }
    }
    getTokenAndRegister();
  }, []); // Mảng rỗng đảm bảo chạy 1 lần

  // 6. Hàm xử lý nhấn nút Test
  const handleTestButtonPress = () => {
    console.log("Nút test đã được nhấn!");
    if (
      FAKE_AUTH_TOKEN_FOR_TESTING.length < 50 ||
      FAKE_AUTH_TOKEN_FOR_TESTING === "DÁN_TOKEN_JWT_CÒN_HẠN_CỦA_BẠN_VÀO_ĐÂY"
    ) {
      Alert.alert(
        "Lỗi",
        "Vui lòng cung cấp Auth Token hợp lệ trong code để test."
      );
      return;
    }
    // Gọi API test
    triggerTestNotification(FAKE_AUTH_TOKEN_FOR_TESTING);
  };

  // --- END: NOTIFICATION LOGIC ---

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <View style={styles.heroIcon}>
            <Sparkles size={18} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSmall}>FPT University</Text>
            <Text style={styles.heroTitle}>
              Chào mừng đến hệ thống Lab Booking
            </Text>
            <Text style={styles.heroDesc}>
              Đặt phòng thực hành, theo dõi lịch và cập nhật thông báo ngay trên
              điện thoại của bạn.
            </Text>

            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/book/choose-type" as any)}
            >
              <CalendarCheck2 size={16} color="#ea580c" />
              <Text style={styles.ctaText}> Bắt đầu đặt Lab</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- START: NOTIFICATION LOGIC --- */}
      {/* 7. Giao diện nút Test */}
      <View style={styles.buttonContainer}>
        <Button
          title="Gửi thông báo Test cho tôi!"
          onPress={handleTestButtonPress}
          color="#ea580c"
        />
      </View>
      {/* --- END: NOTIFICATION LOGIC --- */}

      {/* Feature Grid */}
      <View style={styles.section}>
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.mainTitle}>Tiện ích chính</Text>
          <Text style={styles.mainSub}>
            Truy cập nhanh vào mọi chức năng bạn cần cho việc đặt và quản lý
            phòng lab.
          </Text>
        </View>

        <View style={styles.grid}>
          {featureGroups.map((f) => (
            <View key={f.to} style={styles.gridItem}>
              <FeatureTile {...f} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ... (Styles giữ nguyên) ...
const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40, backgroundColor: "#fff7ed" },

  // MỚI: Thêm style cho nút Test (theo Bước 8 [cite: 657])
  buttonContainer: {
    marginVertical: 10,
    paddingHorizontal: 16, // Thêm padding cho_khớp_với_layout
  },

  tokenContainer: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  tokenTitle: {
    fontWeight: "bold",
    color: "#333",
  },
  tokenText: {
    marginTop: 4,
    color: "#555",
    fontSize: 12,
  },
  hero: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#f97316",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  heroLeft: { flexDirection: "row", gap: 12, alignItems: "flex-start" } as any,
  heroIcon: {
    height: 48,
    width: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  heroSmall: {
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  heroTitle: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 6 },
  heroDesc: { color: "rgba(255,255,255,0.9)", marginTop: 6 },
  cta: {
    marginTop: 10,
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  ctaText: { color: "#ea580c", fontWeight: "700" },

  section: { marginTop: 6 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  highlightCard: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  highlightIcon: {
    height: 40,
    width: 40,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightTitle: { fontSize: 14, fontWeight: "700" },
  highlightDesc: { fontSize: 12, color: "#64748b" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  bulletCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  bulletIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletTitle: { fontSize: 14, fontWeight: "700" },
  bulletDetail: { fontSize: 12, color: "#64748b", marginTop: 4 },
  bulletTime: {
    marginTop: 6,
    color: "#ea580c",
    fontWeight: "600",
    fontSize: 12,
  },

  mainTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  mainSub: { fontSize: 13, color: "#64748b", marginTop: 4 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  gridItem: { width: "48%", marginBottom: 12 },
});
