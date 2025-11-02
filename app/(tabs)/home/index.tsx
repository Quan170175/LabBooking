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
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FeatureTile from "../../../components/home/FeatureTile";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

// Cấu hình cách thông báo hiển thị khi app đang chạy (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Hiển thị pop-up
    shouldPlaySound: true, // Phát âm thanh
    shouldSetBadge: false, // (iOS) Hiển thị số trên icon app

    // THÊM 2 DÒNG NÀY ĐỂ SỬA LỖI
    shouldShowBanner: false, // Tắt banner (vì đã có pop-up)
    shouldShowList: false, // Tắt hiển thị ở list (vì đã có pop-up)
  }),
});

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

  // 6. Thêm State và Ref để quản lý token/notification
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  // 7. Thêm useEffect để chạy logic lấy token khi component mount
  useEffect(() => {
    // Hàm đăng ký và lấy token
    async function registerForPushNotificationsAsync() {
      let token;

      // Chỉ hoạt động trên THIẾT BỊ VẬT LÝ
      if (!Device.isDevice) {
        Alert.alert(
          "Lỗi",
          "Phải sử dụng thiết bị vật lý để nhận Push Notifications"
        );
        return;
      }

      // Kiểm tra quyền
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Hỏi quyền nếu chưa cấp
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert(
          "Lỗi",
          "Không thể lấy push token vì người dùng từ chối quyền!"
        );
        return;
      }

      // Lấy Expo Push Token
      try {
        // Lấy Project ID từ cấu hình app
        // File app.json của bạn có projectId tại: extra.eas.projectId

        token = (await Notifications.getExpoPushTokenAsync()).data;

        console.log("Your Expo Push Token:", token);
        setExpoPushToken(token);
      } catch (e) {
        let message = "Đã xảy ra lỗi không xác định";
        if (e instanceof Error) {
          message = e.message;
        }
        Alert.alert("Lỗi khi lấy Expo Push Token", message);
      }

      // Cấu hình Kênh (Channel) cho Android
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      return token;
    }

    // Chạy hàm lấy token
    registerForPushNotificationsAsync();

    // Listener khi nhận được thông báo (app đang chạy)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Listener khi người dùng tương tác với thông báo (nhấn vào)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
      });

    // Hủy đăng ký listener khi component unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy 1 lần

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {/* 8. Thêm View để hiển thị Token */}
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenTitle}>Your Expo Push Token:</Text>
        <Text style={styles.tokenText} selectable={true}>
          {expoPushToken || "Đang lấy token..."}
        </Text>
      </View>

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
