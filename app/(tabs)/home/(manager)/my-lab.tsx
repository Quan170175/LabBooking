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
import { useRouter, Stack } from "expo-router";
import {
  MapPin,
  Users,
  Info,
  Edit,
  GraduationCap,
  FlaskConical,
  CheckCircle,
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
    return new Promise<LabDetail>((resolve) => {
      setTimeout(() => {
        resolve({
          id: "lab-a101",
          name: "Lab A101 - IoT & Embedded System",
          // Test text cực dài để đảm bảo layout không vỡ
          location:
            "Tòa nhà Innovation, Tầng 3, Phòng 305 - Khu Công Nghệ Cao Hòa Lạc",
          capacity: 45,
          status: "Active",
          labType: "Project",
          managerName: "Nguyễn Văn Quản Lý",
          description:
            "Phòng thí nghiệm chuyên sâu về các hệ thống nhúng và IoT. Được trang bị các kit phát triển mới nhất.",
          equipments: [
            {
              id: "eq1",
              name: "Máy chiếu Sony 4K HDR",
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
              status: "Broken",
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

  const renderTypeBadge = (type: LabType) => {
    const isTeaching = type === "Teaching";
    const bgColor = isTeaching ? "#DBEAFE" : "#F3E8FF";
    const textColor = isTeaching ? "#2563EB" : "#9333EA";
    const Icon = isTeaching ? GraduationCap : FlaskConical;
    const label = isTeaching ? "Phòng Dạy Học" : "Phòng Dự Án";

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Icon size={14} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const renderEqStatus = (status: string) => {
    switch (status) {
      case "Good":
        return <Text style={styles.statusGood}>Hoạt động</Text>;
      case "Maintenance":
        return <Text style={styles.statusMaintenance}>Bảo trì</Text>;
      default:
        return <Text style={styles.statusBroken}>Hỏng</Text>;
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />

      {/* Header Custom */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin Phòng Lab</Text>
        <Text style={styles.headerSub}>Quản lý thông tin và thiết bị</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#EA580C"]}
          />
        }
      >
        {/* --- CARD CHÍNH --- */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.managerName}>Quản lý: {lab.managerName}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Edit size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* --- DANH SÁCH THÔNG TIN (MỖI CÁI 1 HÀNG) --- */}
          <View style={styles.infoList}>
            {/* 1. Vị trí */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <MapPin size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Vị trí</Text>
                <Text style={styles.value}>{lab.location}</Text>
              </View>
            </View>

            {/* 2. Sức chứa */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Users size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Sức chứa</Text>
                <Text style={styles.value}>{lab.capacity} người</Text>
              </View>
            </View>

            {/* 3. Loại phòng */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Info size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Loại phòng</Text>
                <View style={{ marginTop: 4, alignSelf: "flex-start" }}>
                  {renderTypeBadge(lab.labType)}
                </View>
              </View>
            </View>

            {/* 4. Trạng thái */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <CheckCircle size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
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

          {/* Mô tả */}
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
          <View key={eq.id} style={styles.eqCard}>
            <View style={styles.eqIcon}>
              <Server size={22} color="#475569" />
            </View>
            <View style={styles.eqInfo}>
              <Text style={styles.eqName} numberOfLines={1}>
                {eq.name}
              </Text>
              <Text style={styles.eqCode}>{eq.code}</Text>
            </View>
            <View style={styles.eqStatusBox}>{renderEqStatus(eq.status)}</View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF7ED",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 14, color: "#64748B", marginTop: 4 },

  content: { paddingHorizontal: 16 },

  // --- MAIN CARD ---
  mainCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
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
    lineHeight: 26,
    marginBottom: 4,
  },
  managerName: { fontSize: 13, color: "#64748B" },
  editBtn: {
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },

  // --- INFO LIST (MỖI CÁI 1 HÀNG) ---
  infoList: {
    gap: 16, // Khoảng cách giữa các hàng
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Căn theo cạnh trên để icon không bị lệch nếu text dài
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1, // Để text tự xuống dòng
    justifyContent: "center",
    paddingVertical: 2, // Căn chỉnh nhẹ với icon
  },
  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: "#334155", lineHeight: 20 },

  // --- BADGE ---
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  // --- DESCRIPTION ---
  descBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  descText: { fontSize: 13, color: "#475569", lineHeight: 20, marginTop: 4 },

  // --- EQUIPMENT LIST ---
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
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  eqIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  eqInfo: { flex: 1 },
  eqName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 2,
  },
  eqCode: { fontSize: 12, color: "#94A3B8" },
  eqStatusBox: { alignItems: "flex-end", minWidth: 70 },

  statusGood: { color: "#16A34A", fontSize: 12, fontWeight: "600" },
  statusMaintenance: { color: "#D97706", fontSize: 12, fontWeight: "600" },
  statusBroken: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
});
