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
    case "Hu nang":
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

export default function viewequipmentStatusScreen() {
  const router = useRouter();

  // --- STATE ---
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<EquipmentCategory | null>(null);
  const [equipments, setEquipments] = useState<SpecificEquipment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/EquipmentCategories", {
        params: {
          PageNumber: 1,
          PageSize: 10,
        },
      });

      const responseBody = response.data;

      let items = responseBody?.items;
      if (!items && responseBody?.data?.items) {
        items = responseBody.data.items;
      }

      // 3. Đảm bảo luôn là mảng
      if (Array.isArray(items)) {
        setCategories(items);
      } else {
        setCategories([]);
        console.warn("Không tìm thấy danh sách items hợp lệ");
      }
    } catch (error: any) {
      let errorMessage = "Lỗi hệ thống không xác định.";
      if (error.response) {
        errorMessage =
          error.response.data?.message || `Lỗi: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Không có phản hồi từ máy chủ.";
      }
      console.error("Lỗi lấy danh mục:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSelectCategory = async (category: EquipmentCategory) => {
    setSelectedCategory(category);
    setIsLoading(true);
    setError(null);
    setEquipments([]);

    try {
      const response = await apiClient.get(
        `/api/EquipmentCategories/${category.id}/equipments`
      );
      const responseData = response.data?.data || response.data;
      let items = [];
      if (Array.isArray(responseData)) {
        items = responseData;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        items = responseData.items;
      }

      setEquipments(items);
    } catch (error: any) {
      let errorMessage = "Lỗi tải thiết bị.";
      if (error.response) {
        errorMessage =
          error.response.data?.message || `Lỗi ${error.response.status}`;
      }
      console.error("Lỗi lấy thiết bị:", error);
      setError(errorMessage);
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setEquipments([]);
    setError(null);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    if (selectedCategory) {
      handleSelectCategory(selectedCategory);
      setIsRefreshing(false);
    } else {
      fetchCategories();
    }
  };

  // --- RENDER ITEMS ---
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
          {item.equipmentCount !== undefined ? item.equipmentCount : 0} thiết bị
        </Text>
      </View>
      <ChevronRight size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {selectedCategory ? (
          <View style={styles.subHeaderNav}>
            <TouchableOpacity
              onPress={handleBackToCategories}
              style={styles.internalBackBtn}
            >
              <ChevronLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {selectedCategory.name}
              </Text>
              <Text style={styles.headerSub}>Danh sách thiết bị chi tiết</Text>
            </View>
          </View>
        ) : (
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
          {error && (
            <View style={styles.errorContainer}>
              <XCircle size={20} color="#DC2626" />
              <Text style={styles.errorText}>Lỗi: {error}</Text>
            </View>
          )}

          {/* View 1: category list*/}
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
              ListEmptyComponent={
                !isLoading && !error ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Không có danh mục nào.</Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* View 2: equipment list */}
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
                !error ? (
                  <View style={styles.emptyState}>
                    <Monitor size={48} color="#E2E8F0" />
                    <Text style={styles.emptyText}>
                      Chưa có thiết bị nào trong danh mục này.
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
  },

  header: {
    padding: 16,
    backgroundColor: "#FFF7ED",
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

  subHeaderNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  internalBackBtn: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  listContent: { padding: 16, paddingBottom: 40 },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
function equipmentStatusScreen() {
  throw new Error("Function not implemented.");
}
