import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Home,
  MapPin,
  Package,
  Users, // [MỚI] Icon cho khách mời
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Animation Imports
import apiClient from "@/utils/api";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// const apiClient = axios.create({
//   baseURL: "http://192.168.1.149:7089/api",
// });

// --- HELPER ---
const getTypeLabel = (type: string) => {
  switch (type) {
    case "Teaching":
      return "Lịch Dạy Học";
    case "Project":
      return "Lịch Dự Án";
    case "UniversityEvent":
      return "Sự Kiện Trường";
    default:
      return type || "Đặt Lịch";
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [slotTemplates, setSlotTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation Values
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);

  // --- 1. ANIMATION ---
  useEffect(() => {
    const backAction = () => {
      router.replace("/(tabs)/home");
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    progress.value = withDelay(
      300,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) })
    );
    return () => backHandler.remove();
  }, [router]);

  // --- 2. LOAD DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (params.result) {
          const data = JSON.parse(params.result as string);
          console.log("✅ Success Data:", data);
          setBooking(data);
        }
        const resSlots = await apiClient.get("/api/Slot");
        // console.log("✅ Loaded slot templates:", resSlots.data);
        setSlotTemplates(resSlots.data);
      } catch (e) {
        console.error("Error loading success data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.result]);

  // Animation Props
  const CIRCLE_LENGTH = 140;
  const CHECK_LENGTH = 40;
  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));
  const animatedCheckProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
  }));
  const animatedIconStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#FFFFFF", "#DCFCE7"]
    );
    return { transform: [{ scale: scale.value }], backgroundColor };
  });

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  if (!booking)
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy thông tin.</Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Text style={{ color: "#EA580C" }}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );

  // ==================== MAP DATA ====================
  const roomName =
    booking.labRoomResponse?.labName || booking.roomName || "Phòng Lab";
  const roomLocation =
    booking.labRoomResponse?.location || booking.roomLocation || "";

  const groupedSlots = (booking.slots || []).reduce((acc: any, slot: any) => {
    const d = slot.date.split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot.slotId);
    return acc;
  }, {});
  const dates = Object.keys(groupedSlots).sort();

  const getSlotLabel = (id: string) => {
    const t = slotTemplates.find((x) => x.id === id);
    return t ? t.label.split("(")[0].trim() : "Slot";
  };

  const devices = booking.externalEquipments || [];

  // [MỚI] Lấy danh sách Khách mời
  const guests = booking.outSideGuests || [];

  const projectInfo = booking.project || booking.projectResponse;
  const priorityInfo = booking.priorityDetail || booking.bookingPriorityDetail;
  const courseInfo = booking.courseResponse;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER ANIMATION */}
        <View style={styles.header}>
          <Animated.View
            style={[styles.animatedIconWrapper, animatedIconStyle]}
          >
            <Svg width={64} height={64} viewBox="0 0 48 48">
              <AnimatedCircle
                cx="24"
                cy="24"
                r="22"
                stroke="#16A34A"
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={CIRCLE_LENGTH}
                strokeLinecap="round"
                animatedProps={animatedCircleProps}
              />
              <AnimatedPath
                d="M14 24 L22 32 L34 16"
                stroke="#16A34A"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={CHECK_LENGTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                animatedProps={animatedCheckProps}
              />
            </Svg>
          </Animated.View>
          <Text style={styles.title}>Gửi yêu cầu thành công!</Text>
          <Text style={styles.subtitle}>Yêu cầu đang chờ Quản lý duyệt.</Text>
        </View>

        {/* CARD INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.bookingTitle}>
              {booking.title || "Tiêu đề trống"}
            </Text>
            <Text style={styles.bookingId}>
              #{booking.id?.substring(0, 6).toUpperCase()}
            </Text>
          </View>

          <View style={styles.row}>
            <MapPin size={18} color="#64748B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>
                Phòng: <Text style={styles.bold}>{roomName}</Text>
              </Text>
              {roomLocation ? (
                <Text style={styles.subLocation}>{roomLocation}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: "#E0F2FE" }]}>
              <Text style={[styles.badgeText, { color: "#0284C7" }]}>
                {getTypeLabel(booking.type)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.badgeText, { color: "#D97706" }]}>
                {booking.numberOfParticipants || 0} người
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* --- CHI TIẾT --- */}
          {projectInfo && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Briefcase size={16} color="#EA580C" />
                <Text style={styles.detailHeaderTitle}>Dự án</Text>
              </View>
              <Text style={styles.detailValueBold}>
                {projectInfo.projectName}
              </Text>
            </View>
          )}
          {priorityInfo && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={[styles.detailHeaderTitle, { color: "#DC2626" }]}>
                  Lý do ưu tiên
                </Text>
              </View>
              <View
                style={[
                  styles.detailBox,
                  { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                ]}
              >
                <Text style={[styles.detailValue, { color: "#991B1B" }]}>
                  {priorityInfo.justification}
                </Text>
              </View>
            </View>
          )}
          {courseInfo && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <BookOpen size={16} color="#2563EB" />
                <Text style={[styles.detailHeaderTitle, { color: "#2563EB" }]}>
                  Lớp học
                </Text>
              </View>
              <Text style={styles.detailValue}>
                {courseInfo.courseCode} - {courseInfo.courseName}
              </Text>
            </View>
          )}

          {/* --- LỊCH CHI TIẾT --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch chi tiết</Text>
            <View style={styles.slotListContainer}>
              {dates.map((date: string) => (
                <View key={date} style={styles.slotRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Calendar
                      size={16}
                      color="#EA580C"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.slotDate}>{formatDate(date)}</Text>
                  </View>
                  <View style={styles.slotChips}>
                    {groupedSlots[date].map((slotId: string) => (
                      <View key={slotId} style={styles.slotChip}>
                        <Text style={styles.slotChipText}>
                          {getSlotLabel(slotId)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* --- [MỚI] KHÁCH MỜI --- */}
          {guests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Khách mời ({guests.length})
              </Text>
              <View style={styles.equipContainer}>
                {guests.map((guest: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.equipRow,
                      idx === guests.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      {/* Icon User */}
                      <View
                        style={[
                          styles.equipIcon,
                          {
                            backgroundColor: "#EEF2FF",
                            borderColor: "#C7D2FE",
                          },
                        ]}
                      >
                        <Users size={16} color="#4F46E5" />
                      </View>
                      <View>
                        <Text style={styles.equipName}>{guest.fullName}</Text>
                        <Text style={styles.equipDesc}>
                          {guest.organization}{" "}
                          {guest.purpose ? `• ${guest.purpose}` : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* --- THIẾT BỊ --- */}
          {devices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thiết bị đăng ký</Text>
              <View style={styles.equipContainer}>
                {devices.map((d: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.equipRow,
                      idx === devices.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <View style={styles.equipIcon}>
                        <Package size={16} color="#64748B" />
                      </View>
                      <View>
                        <Text style={styles.equipName}>
                          {d.name || d.equipmentName}
                        </Text>
                        {d.description ? (
                          <Text style={styles.equipDesc}>{d.description}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.equipQty}>x{d.quantity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Home size={20} color="#475569" />
            <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/(tabs)/home/history" as any)}
          >
            <Text style={styles.primaryButtonText}>Xem lịch sử</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", paddingTop: 40 },
  content: { padding: 20, paddingBottom: 50 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  header: { alignItems: "center", marginBottom: 24, marginTop: 10 },
  animatedIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  bookingId: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  rowText: { fontSize: 14, color: "#475569" },
  subLocation: { fontSize: 13, color: "#64748B", marginTop: 2 },
  bold: { fontWeight: "600", color: "#0F172A" },
  badgeContainer: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },

  detailSection: { marginBottom: 12 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  detailHeaderTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EA580C",
    textTransform: "uppercase",
  },
  detailValueBold: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  detailValueLight: { fontSize: 13, color: "#64748B" },
  detailBox: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailValue: { fontSize: 14, color: "#334155" },

  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  slotListContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  slotRow: { gap: 8 },
  slotDate: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  slotChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  slotChip: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slotChipText: { fontSize: 12, color: "#C2410C", fontWeight: "600" },

  // Equipment & Guest List Styles
  equipContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  equipIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equipName: { fontSize: 14, color: "#0F172A", fontWeight: "600" },
  equipDesc: { fontSize: 12, color: "#64748B" },
  equipQty: { fontSize: 14, fontWeight: "700", color: "#0F172A" },

  footer: { flexDirection: "row", gap: 12 },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  secondaryButtonText: { color: "#475569", fontWeight: "600", fontSize: 15 },
  primaryButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
});
