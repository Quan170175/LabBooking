import { useRouter } from "expo-router"; // 1. Import useRouter
import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FeatureTile from "../../components/home/FeatureTile";

const featureGroups = [
  {
    to: "/book",
    title: "Đặt Lab",
    description: "Chọn phòng, giờ học",
    icon: CalendarCheck2,
  },
  {
    to: "/my-bookings",
    title: "Lịch sử đặt",
    description: "Quản lý yêu cầu",
    icon: Clock3,
  },
  {
    to: "/availability",
    title: "Tình trạng phòng",
    description: "Lab còn trống",
    icon: ClipboardList,
  },
  {
    to: "/schedule",
    title: "Thời khóa biểu",
    description: "Đồng bộ lịch học",
    icon: CalendarDays,
  },
  {
    to: "/resources",
    title: "Tài liệu lab",
    description: "Hướng dẫn & SOP",
    icon: BookOpen,
  },
  {
    to: "/support",
    title: "Hỗ trợ",
    description: "Gửi yêu cầu giúp đỡ",
    icon: ShieldCheck,
  },
  {
    to: "/community",
    title: "Cộng đồng",
    description: "Nhóm FPT dev",
    icon: UsersRound,
  },
  {
    to: "/reports",
    title: "Biên bản",
    description: "Kết quả lab",
    icon: FileText,
  },
];

export default function Home() {
  const router = useRouter();

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
              onPress={() => router.push("/book" as any)}
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
