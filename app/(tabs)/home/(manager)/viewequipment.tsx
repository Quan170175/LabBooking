import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Layers,
  Filter,
} from "lucide-react-native";

// 🟢 Import API Client
import apiClient from "../../../../utils/api";

// --- TYPES ---
interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  equipmentCount: number;
}

interface SpecificEquipment {
  id: string;
  equipmentName: string;
  status: string;
  description: string | null;
  labRoomName?: string;
}

// --- HELPER ---
const getStatusConfig = (status: string) => {
  switch (status) {
    case "Available":
    case "Sẵn sàng":
      return {
        label: "Sẵn sàng",
        color: "#16A34A",
        bg: "#DCFCE7",
        icon: <CheckCircle2 size={14} color="#16A34A" />,
      };
    case "Maintain":
    case "Bảo trì":
      return {
        label: "Bảo trì",
        color: "#CA8A04",
        bg: "#FEF9C3",
        icon: <AlertTriangle size={14} color="#CA8A04" />,
      };
    case "Broken":
    case "Hỏng":
      return {
        label: "Hỏng",
        color: "#DC2626",
        bg: "#FEE2E2",
        icon: <XCircle size={14} color="#DC2626" />,
      };
    default:
      return {
        label: status || "Khác",
        color: "#64748B",
        bg: "#F1F5F9",
        icon: <Filter size={14} color="#64748B" />,
      };
  }
};

export default function ViewEquipmentStatusScreen() {
  const router = useRouter();

  // --- STATE ---
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<EquipmentCategory | null>(null);
  const [equipments, setEquipments] = useState<SpecificEquipment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- API: GET CATEGORIES ---
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/EquipmentCategories");
      // Xử lý data (tuỳ vào interceptor của bạn đã bóc vỏ chưa)
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- API: GET EQUIPMENTS BY CATEGORY ---
  const handleSelectCategory = async (category: EquipmentCategory) => {
    setSelectedCategory(category);
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        `/api/EquipmentCategories/${category.id}/equipments`
      );
      // Xử lý data
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data)) {
        setEquipments(data);
      } else {
        setEquipments([]);
      }
    } catch (error) {
      console.error("Lỗi lấy thiết bị:", error);
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setEquipments([]);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    if (selectedCategory) {
      handleSelectCategory(selectedCategory);
      setIsRefreshing(false);
    } else {
      fetchCategories();
    }
  };

  // --- RENDER CATEGORY ITEM ---
  const renderCategoryItem = ({ item }: { item: EquipmentCategory }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleSelectCategory(item)}
    >
      <View style={styles.catIcon}>
        <Layers size={24} color="#EA580C" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catCount}>
          {item.equipmentCount !== undefined ? item.equipmentCount : "N/A"}{" "}
          thiết bị
        </Text>
      </View>
      <ChevronRight size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  // --- RENDER EQUIPMENT ITEM ---
  const renderEquipmentItem = ({ item }: { item: SpecificEquipment }) => {
    const statusConf = getStatusConfig(item.status);

    return (
      <View style={styles.eqCard}>
        <View style={styles.eqHeader}>
          <Text style={styles.eqName}>{item.equipmentName}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}
          >
            {statusConf.icon}
            <Text style={[styles.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {item.labRoomName && (
          <Text style={styles.eqLocation}>📍 Tại: {item.labRoomName}</Text>
        )}

        {item.description && (
          <Text style={styles.eqDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    );
  };

  return (
    // 🟢 SỬA BACKGROUND MÀU KEM
    <SafeAreaView style={styles.container}>
      {/* 🟢 HEADER MỚI: CỐ ĐỊNH, KHÔNG NÚT BACK */}
      <View style={styles.header}>
        {/* Nếu đang xem chi tiết danh mục, hiện nút Back nhỏ nội bộ */}
        {selectedCategory ? (
          <View style={styles.subHeaderNav}>
            <TouchableOpacity
              onPress={handleBackToCategories}
              style={styles.internalBackBtn}
            >
              <ChevronLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{selectedCategory.name}</Text>
              <Text style={styles.headerSub}>Danh sách thiết bị chi tiết</Text>
            </View>
          </View>
        ) : (
          // Header chính (Trang chủ thiết bị)
          <>
            <Text style={styles.headerTitle}>Tình trạng thiết bị</Text>
            <Text style={styles.headerSub}>
              Theo dõi trạng thái hoạt động của thiết bị
            </Text>
          </>
        )}
      </View>

      {/* CONTENT */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <>
          {/* VIEW 1: CATEGORIES LIST */}
          {!selectedCategory && (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={["#EA580C"]}
                />
              }
              // Bỏ ListHeader cũ vì đã có Header xịn ở trên
            />
          )}

          {/* VIEW 2: EQUIPMENT LIST */}
          {selectedCategory && (
            <FlatList
              data={equipments}
              renderItem={renderEquipmentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={["#EA580C"]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Monitor size={48} color="#E2E8F0" />
                  <Text style={styles.emptyText}>
                    Chưa có thiết bị nào trong danh mục này.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🟢 Update background
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // 🟢 Update Header Styles
  header: {
    padding: 16,
    backgroundColor: "#FFF7ED",
    // borderBottomWidth: 1,
    // borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  // Header con khi vào chi tiết danh mục
  subHeaderNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  internalBackBtn: {
    padding: 4,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  listContent: { padding: 16, paddingBottom: 40 },

  // CATEGORY CARD
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16, // Bo góc lớn hơn
    borderWidth: 1,
    borderColor: "#F1F5F9", // Viền nhạt hơn
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  catName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  catCount: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // EQUIPMENT CARD
  eqCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  eqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eqName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600" },

  eqLocation: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
    fontStyle: "italic",
  },
  eqDesc: { fontSize: 13, color: "#94A3B8" },

  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 14 },
});
