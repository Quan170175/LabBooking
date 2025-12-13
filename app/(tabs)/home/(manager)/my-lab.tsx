import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MapPin,
  Users,
  Monitor,
  Info,
  Edit,
  GraduationCap, // Icon cho Dạy học
  FlaskConical, // Icon cho Dự án/Nghiên cứu
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Server,
} from "lucide-react-native";

// --- TYPES ---
type LabType = "Teaching" | "Project";

interface Equipment {
  id: string;
  name: string;
  code: string;
  status: "Good" | "Maintenance" | "Broken";
}

interface LabDetail {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: "Active" | "Inactive";
  labType: LabType;
  description: string;
  managerName: string;
  equipments: Equipment[];
}

export default function MyLabInfoScreen() {
  const router = useRouter();
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- MOCK API ---
  const fetchLabDetails = useCallback(async () => {
    // Giả lập gọi API
    return new Promise<LabDetail>((resolve) => {
      setTimeout(() => {
        resolve({
          id: "lab-a101",
          name: "Lab A101 - IoT & Embedded System",
          location: "Tòa nhà B, Tầng 3, Phòng 305",
          capacity: 45,
          status: "Active",
          labType: "Project", // 🔥 Thử đổi thành 'Teaching' để xem icon khác
          managerName: "Nguyễn Văn Quản Lý",
          description:
            "Phòng thí nghiệm chuyên sâu về các hệ thống nhúng và IoT. Được trang bị các kit phát triển mới nhất.",
          equipments: [
            {
              id: "eq1",
              name: "Máy chiếu Sony 4K",
              code: "PROJ-01",
              status: "Good",
            },
            {
              id: "eq2",
              name: "Oscilloscope Tektronix",
              code: "OSC-05",
              status: "Maintenance",
            },
            {
              id: "eq3",
              name: "PC Workstation Dell",
              code: "PC-12",
              status: "Good",
            },
            {
              id: "eq4",
              name: "3D Printer Creality",
              code: "3DP-02",
              status: "Good",
            },
          ],
        });
      }, 1000);
    });
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchLabDetails();
      setLab(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // --- RENDER HELPERS ---

  // Render Badge Loại phòng
  const renderTypeBadge = (type: LabType) => {
    if (type === "Teaching") {
      return (
        <View style={[styles.badge, { backgroundColor: "#DBEAFE" }]}>
          <GraduationCap size={14} color="#2563EB" />
          <Text style={[styles.badgeText, { color: "#2563EB" }]}>
            Phòng Dạy Học
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: "#F3E8FF" }]}>
        <FlaskConical size={14} color="#9333EA" />
        <Text style={[styles.badgeText, { color: "#9333EA" }]}>
          Phòng Dự Án
        </Text>
      </View>
    );
  };

  // Render Trạng thái thiết bị
  const renderEqStatus = (status: string) => {
    switch (status) {
      case "Good":
        return (
          <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "600" }}>
            Hoạt động
          </Text>
        );
      case "Maintenance":
        return (
          <Text style={{ color: "#D97706", fontSize: 12, fontWeight: "600" }}>
            Bảo trì
          </Text>
        );
      default:
        return (
          <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>
            Hỏng
          </Text>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  if (!lab) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin Phòng Lab</Text>
        <Text style={styles.headerSub}>Quản lý thông tin và thiết bị</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#EA580C"]}
          />
        }
      >
        {/* --- CARD CHÍNH: THÔNG TIN PHÒNG --- */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.managerName}>Quản lý: {lab.managerName}</Text>
            </View>
            {/* Nút chỉnh sửa (Mock) */}
            <TouchableOpacity style={styles.editBtn}>
              <Edit size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Grid thông tin */}
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <MapPin size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.label}>Vị trí</Text>
                <Text style={styles.value}>{lab.location}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Users size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.label}>Sức chứa</Text>
                <Text style={styles.value}>{lab.capacity} người</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Info size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.label}>Loại phòng</Text>
                <View style={{ alignItems: "flex-start", marginTop: 4 }}>
                  {renderTypeBadge(lab.labType)}
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <CheckCircle size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.label}>Trạng thái</Text>
                <Text
                  style={[
                    styles.value,
                    { color: lab.status === "Active" ? "#16A34A" : "#DC2626" },
                  ]}
                >
                  {lab.status === "Active"
                    ? "Đang hoạt động"
                    : "Ngưng hoạt động"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descBox}>
            <Text style={styles.label}>Mô tả:</Text>
            <Text style={styles.descText}>{lab.description}</Text>
          </View>
        </View>

        {/* --- DANH SÁCH THIẾT BỊ --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Danh sách thiết bị ({lab.equipments.length})
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push("/(tabs)/home/(manager)/viewequipment" as any)
            }
          >
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {lab.equipments.map((eq) => (
          <TouchableOpacity
            key={eq.id}
            style={styles.eqCard}
            activeOpacity={0.7}
          >
            <View style={styles.eqIcon}>
              <Server size={20} color="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eqName}>{eq.name}</Text>
              <Text style={styles.eqCode}>{eq.code}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {renderEqStatus(eq.status)}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { padding: 16, backgroundColor: "#FFF7ED" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 14, color: "#64748B", marginTop: 4 },

  content: { padding: 16 },

  // Main Card Styles
  mainCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  labName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  managerName: { fontSize: 13, color: "#64748B" },
  editBtn: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 20 },
  infoRow: { width: "50%", flexDirection: "row", gap: 10, paddingRight: 8 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: "#334155" },

  // Badge Styles
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  descBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  descText: { fontSize: 13, color: "#475569", lineHeight: 20, marginTop: 4 },

  // Equipment Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  seeAll: { fontSize: 13, color: "#EA580C", fontWeight: "600" },

  eqCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  eqIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  eqName: { fontSize: 14, fontWeight: "600", color: "#334155" },
  eqCode: { fontSize: 12, color: "#94A3B8" },
});
