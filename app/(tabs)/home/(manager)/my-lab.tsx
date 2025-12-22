import React, { useState, useEffect } from "react";
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
import { MapPin, Users, CheckCircle, Server } from "lucide-react-native";

import apiClient from "../../../../utils/api";

interface APIEquipmentItem {
  id: string;
  equipmentName: string;
  category: string;
  description: string | null;
  status: string;
  isAvailable: boolean;
}

interface APIEquipmentGroup {
  categoryName: string;
  totalCount: number;
  items: APIEquipmentItem[];
}

interface APILab {
  id: string;
  labName: string;
  location: string;
  maximumLimit: number;
  status: string;
  equipmentGroups: APIEquipmentGroup[];
}

interface ManagerData {
  id: string;
  userName: string;
  email: string;
  managedLabs: APILab[];
}

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
  managerName: string;
  equipments: Equipment[];
}

export default function MyLabInfoScreen() {
  const router = useRouter();
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapEquipmentStatus = (
    status: string
  ): "Good" | "Maintenance" | "Broken" => {
    const s = (status || "").toLowerCase();
    if (
      s.includes("sẵn sàng") ||
      s.includes("tốt") ||
      s === "available" ||
      s === "good"
    )
      return "Good";
    if (s.includes("bảo trì") || s.includes("sửa chữa") || s === "maintenance")
      return "Maintenance";
    return "Broken";
  };

  // Helper: Chuyển đổi trạng thái phòng Lab
  const mapLabStatus = (status: string): "Active" | "Inactive" => {
    return status === "Active" ||
      status === "Đang hoạt động" ||
      status === "true"
      ? "Active"
      : "Inactive";
  };

  // --- HÀM GỌI API ---
  const fetchLabDetails = async (): Promise<LabDetail | null> => {
    try {
      const response = await apiClient.get<ManagerData>(
        "/api/Managers/lab-details"
      );

      const managerData = response.data;

      if (
        managerData &&
        managerData.managedLabs &&
        managerData.managedLabs.length > 0
      ) {
        const apiLab = managerData.managedLabs[0];

        const flatEquipments: Equipment[] = [];
        if (apiLab.equipmentGroups) {
          apiLab.equipmentGroups.forEach((group) => {
            group.items.forEach((item) => {
              flatEquipments.push({
                id: item.id,
                name: item.equipmentName,
                code: item.category || group.categoryName,
                status: mapEquipmentStatus(item.status),
              });
            });
          });
        }

        return {
          id: apiLab.id,
          name: apiLab.labName,
          location: apiLab.location,
          capacity: apiLab.maximumLimit,
          status: mapLabStatus(apiLab.status),
          managerName: managerData.userName,
          equipments: flatEquipments,
        };
      }
      return null;
    } catch (error) {
      console.error("Lỗi khi tải thông tin Lab:", error);
      return null;
    }
  };

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

  if (!lab) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text
          style={{
            color: "#64748B",
            marginBottom: 10,
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          Không tìm thấy thông tin phòng Lab.{"\n"}Hoặc bạn chưa được phân công
          quản lý.
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={{ color: "#EA580C", fontWeight: "600", marginTop: 10 }}>
            Tải lại
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />

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
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.managerName}>Quản lý: {lab.managerName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <MapPin size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Vị trí</Text>
                <Text style={styles.value}>{lab.location}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Users size={20} color="#EA580C" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Sức chứa</Text>
                <Text style={styles.value}>{lab.capacity} người</Text>
              </View>
            </View>

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
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Danh sách thiết bị ({lab.equipments.length})
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push("/(tabs)/home/(manager)/view-equipment" as any)
            }
          >
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {lab.equipments.length === 0 ? (
          <Text
            style={{ textAlign: "center", color: "#94A3B8", marginTop: 10 }}
          >
            Chưa có thiết bị nào
          </Text>
        ) : (
          lab.equipments.map((eq) => (
            <View key={eq.id} style={styles.eqCard}>
              <View style={styles.eqIcon}>
                <Server size={22} color="#475569" />
              </View>
              <View style={styles.eqInfo}>
                <Text style={styles.eqName} numberOfLines={1}>
                  {eq.name}
                </Text>
                <Text style={styles.eqCode} numberOfLines={1}>
                  {eq.code}
                </Text>
              </View>
              <View style={styles.eqStatusBox}>
                {renderEqStatus(eq.status)}
              </View>
            </View>
          ))
        )}

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
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },

  infoList: { gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1, justifyContent: "center", paddingVertical: 2 },
  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: "#334155", lineHeight: 20 },

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
