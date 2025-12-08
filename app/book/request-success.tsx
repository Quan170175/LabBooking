import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  Home,
  MapPin,
  Minus,
  Package,
  Plus,
  Users, // [MỚI] Icon Users
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

import apiClient from "@/utils/api";

// --- CONFIG & HELPER ---
// const apiClient = axios.create({ baseURL: "http://192.168.1.149:7089/api" });

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "Teaching":
      return "Dạy học";
    case "Project":
      return "Dự án";
    case "UniversityEvent":
      return "Sự kiện";
    default:
      return type || "Khác";
  }
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function RequestSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [requestData, setRequestData] = useState<any>(null);
  const [slotTemplates, setSlotTemplates] = useState<any[]>([]);
  const [addedSlots, setAddedSlots] = useState<any[]>([]);
  const [removedSlots, setRemovedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ANIMATION HOOKS ---
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);
  const CIRCLE_LENGTH = 140;
  const CHECK_LENGTH = 40;

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));
  const animatedCheckProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
  }));
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["#FFF", "#DCFCE7"]
    ),
  }));

  // --- INIT DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        if (params.result) {
          const data = JSON.parse(params.result as string);
          setRequestData(data);
        }
        if (params.addedSlots)
          setAddedSlots(JSON.parse(params.addedSlots as string));
        if (params.removedSlots)
          setRemovedSlots(JSON.parse(params.removedSlots as string));

        const resSlots = await apiClient.get("/api/Slot");
        setSlotTemplates(resSlots.data);
      } catch (e) {
        console.error("Error loading success data:", e);
      } finally {
        setLoading(false);
      }
    };
    init();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(tabs)/home");
        return true;
      }
    );

    scale.value = withSpring(1, { damping: 12 });
    progress.value = withDelay(
      300,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) })
    );

    return () => backHandler.remove();
  }, []);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  if (!requestData)
    return (
      <View style={styles.centered}>
        <Text>Lỗi dữ liệu</Text>
      </View>
    );

  // --- HELPER ---
  const getSlotName = (id: string) => {
    const t = slotTemplates.find((x) => x.id === id);
    return t ? t.label.split("(")[0].trim() : "Slot";
  };

  const groupSlots = (list: any[]) => {
    return list.reduce((acc: any, s: any) => {
      const d = s.date.split("T")[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push(s.slotId);
      return acc;
    }, {});
  };

  const groupedAdded = groupSlots(addedSlots);
  const groupedRemoved = groupSlots(removedSlots);
  const allDates = Array.from(
    new Set([...Object.keys(groupedAdded), ...Object.keys(groupedRemoved)])
  ).sort();

  const devices = requestData.newExternalEquipments || [];
  const guests = requestData.newOutSideGuests || []; // [MỚI] Lấy danh sách khách

  // --- RENDER UI ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
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
                strokeDasharray={140}
                strokeLinecap="round"
                animatedProps={animatedCircleProps}
              />
              <AnimatedPath
                d="M14 24 L22 32 L34 16"
                stroke="#16A34A"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={40}
                strokeLinecap="round"
                strokeLinejoin="round"
                animatedProps={animatedCheckProps}
              />
            </Svg>
          </Animated.View>
          <Text style={styles.title}>Đã gửi yêu cầu!</Text>
          <Text style={styles.subtitle}>
            Yêu cầu thay đổi của bạn đang chờ duyệt.
          </Text>
        </View>

        <View style={styles.card}>
          {/* INFO CƠ BẢN */}
          <View style={styles.cardHeader}>
            <Text style={styles.reqTitle}>
              {requestData.newTitle || "Không có tiêu đề"}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {requestData.status || "Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <FileText size={16} color="#64748B" />
            <Text style={styles.rowText}>
              Mã đơn:{" "}
              <Text style={{ color: "#0F172A", fontWeight: "600" }}>
                #{requestData.id.substring(0, 6).toUpperCase()}
              </Text>
            </Text>
          </View>

          <View style={styles.row}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.rowText}>
              {requestData.roomName || "Phòng Lab"}{" "}
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                (ID: {requestData.labRoomId?.substring(0, 6).toUpperCase()})
              </Text>
            </Text>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: "#E0F2FE" }]}>
              <Text style={[styles.badgeText, { color: "#0284C7" }]}>
                {getTypeLabel(requestData.originalType)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.badgeText, { color: "#D97706" }]}>
                {requestData.newNumberOfParticipants || 0} người
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* PROJECT INFO */}
          {requestData.newProject && (
            <View style={styles.subSection}>
              <View style={styles.subHeader}>
                <Briefcase size={14} color="#EA580C" />
                <Text style={styles.subTitle}>Thông tin dự án</Text>
              </View>
              <Text style={styles.subValue}>
                {requestData.newProject.projectName}
              </Text>
            </View>
          )}

          {/* PRIORITY INFO */}
          {requestData.newPriorityDetail && (
            <View style={styles.subSection}>
              <View style={styles.subHeader}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={[styles.subTitle, { color: "#DC2626" }]}>
                  Lý do ưu tiên
                </Text>
              </View>
              <View
                style={[
                  styles.noteBox,
                  { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                ]}
              >
                <Text style={[styles.noteText, { color: "#991B1B" }]}>
                  {requestData.newPriorityDetail.justification}
                </Text>
              </View>
            </View>
          )}

          {/* SLOTS CHANGES */}
          <View style={styles.subSection}>
            <View style={styles.subHeader}>
              <Calendar size={14} color="#2563EB" />
              <Text style={[styles.subTitle, { color: "#2563EB" }]}>
                Thay đổi lịch trình
              </Text>
            </View>
            <View style={styles.slotContainer}>
              {allDates.length === 0 && (
                <Text style={styles.emptyText}>
                  Không có thay đổi về thời gian.
                </Text>
              )}
              {allDates.map((date) => {
                const added = groupedAdded[date] || [];
                const removed = groupedRemoved[date] || [];
                return (
                  <View key={date} style={styles.slotRowDateGroup}>
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                    <View style={styles.slotChangesWrapper}>
                      {removed.map((sid: string) => (
                        <View
                          key={`rem_${sid}`}
                          style={[styles.slotChip, styles.slotChipRemoved]}
                        >
                          <Minus size={12} color="#DC2626" />
                          <Text
                            style={[styles.chipText, styles.chipTextRemoved]}
                          >
                            {getSlotName(sid)}
                          </Text>
                        </View>
                      ))}
                      {added.map((sid: string) => (
                        <View
                          key={`add_${sid}`}
                          style={[styles.slotChip, styles.slotChipAdded]}
                        >
                          <Plus size={12} color="#16A34A" />
                          <Text style={[styles.chipText, styles.chipTextAdded]}>
                            {getSlotName(sid)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* [MỚI] GUESTS SECTION */}
          {guests.length > 0 && (
            <View style={styles.subSection}>
              <View style={styles.subHeader}>
                <Users size={14} color="#4F46E5" />
                <Text style={[styles.subTitle, { color: "#4F46E5" }]}>
                  Khách mời bên ngoài
                </Text>
              </View>
              {guests.map((g: any, idx: number) => (
                <View key={idx} style={styles.equipRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.equipName}>{g.fullName}</Text>
                    <Text style={styles.equipDesc}>
                      {g.organization} {g.purpose ? `• ${g.purpose}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* DEVICES */}
          {devices.length > 0 && (
            <View style={styles.subSection}>
              <View style={styles.subHeader}>
                <Package size={14} color="#059669" />
                <Text style={[styles.subTitle, { color: "#059669" }]}>
                  Thiết bị yêu cầu
                </Text>
              </View>
              {devices.map((eq: any, idx: number) => (
                <View key={idx} style={styles.equipRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.equipName}>
                      {eq.name || "Thiết bị"}
                    </Text>
                    {eq.description ? (
                      <Text style={styles.equipDesc}>{eq.description}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.equipQty}>x{eq.quantity}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Home size={20} color="#475569" />
          <Text style={styles.secondaryButtonText}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(tabs)/home/history" as any)}
        >
          <Text style={styles.primaryButtonText}>Theo dõi đơn</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", paddingTop: 40 },
  content: { padding: 20, paddingBottom: 100, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  card: {
    width: "100%",
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
  reqTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "700", color: "#D97706" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  rowText: { fontSize: 14, color: "#334155" },
  badgeContainer: { flexDirection: "row", gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },

  subSection: { marginBottom: 16 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EA580C",
    textTransform: "uppercase",
  },
  subValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
    paddingLeft: 20,
  },

  noteBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "white",
  },
  noteText: { fontSize: 13, color: "#64748B", fontStyle: "italic" },

  slotContainer: { gap: 12, paddingLeft: 8 },
  slotRowDateGroup: { marginBottom: 4 },
  dateText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 6,
  },
  slotChangesWrapper: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  slotChipAdded: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  chipTextAdded: { fontSize: 12, color: "#16A34A", fontWeight: "700" },
  slotChipRemoved: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  chipTextRemoved: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  chipText: { fontSize: 12 },

  equipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingVertical: 4,
    alignItems: "flex-start",
  },
  equipName: { fontSize: 14, color: "#0F172A", fontWeight: "500" },
  equipDesc: { fontSize: 12, color: "#64748B" },
  equipQty: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  emptyText: {
    color: "#94A3B8",
    fontStyle: "italic",
    paddingLeft: 20,
    fontSize: 13,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    gap: 12,
  },
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
    elevation: 3,
  },
  primaryButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
});
