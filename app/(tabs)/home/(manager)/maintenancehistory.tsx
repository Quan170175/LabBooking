import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Monitor,
  FileText,
  CheckCircle,
  Clock,
  ChevronDown,
  Filter,
  Check,
  SearchX,
  MapPin,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";

// 🟢 Client Axios
import apiClient from "../../../../utils/api";

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

type StatusFilterOption = "ALL" | "COMPLETED" | "PENDING";

interface MaintenanceRecord {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  status: "Done" | "NotYet";
  equipmentCount: number;
  equipmentNames: string[];
}

export default function MaintenanceHistoryScreen() {
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"room" | "equipment">("equipment");
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter Date
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter Status
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("ALL");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // --- DELETE STATE ---
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // 2. HELPER: FETCH DATA
  // ==========================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    if (activeTab === "room") {
      setData([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      const params: any = {
        FromDate: startDate.toISOString(),
        ToDate: endDate.toISOString(),
        SortBy: "startTime",
        IsDescending: true,
      };

      if (statusFilter === "COMPLETED") params.Status = "Done";
      else if (statusFilter === "PENDING") params.Status = "NotYet";

      const response: any = await apiClient.get(
        "/api/EquipmentMaintainSchedule",
        {
          params: params,
        }
      );

      let finalData: MaintenanceRecord[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        finalData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        finalData = response.data;
      } else if (Array.isArray(response?.data)) {
        finalData = response.data;
      }

      setData(finalData);
    } catch (error: any) {
      console.error("❌ API Error:", error);
      setData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterDate, statusFilter, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // 3. LOGIC XÓA (DELETE) - UPDATE
  // ==========================================

  const handleConfirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteAction = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      // Gọi API DELETE
      await apiClient.delete(`/api/EquipmentMaintainSchedule/${itemToDelete}`);

      // Xóa thành công trên UI
      setData((prevData) =>
        prevData.filter((item) => item.id !== itemToDelete)
      );

      setDeleteModalVisible(false);
      Alert.alert("Thành công", "Đã xóa lịch bảo trì.");
    } catch (error: any) {
      console.error("❌ Delete Error:", error);

      // 🟢 BẮT MESSAGE TỪ BE TRẢ VỀ
      // Nếu BE trả về { statusCode: 400, message: "..." } thì lấy message đó
      const serverMessage =
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";

      // Ẩn modal trước rồi mới hiện thông báo lỗi
      setDeleteModalVisible(false);

      // Hiện thông báo đúng như BE trả về
      setTimeout(() => {
        Alert.alert("Thông báo", serverMessage);
      }, 200);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // ==========================================
  // 4. UI COMPONENTS
  // ==========================================

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setFilterDate(selectedDate);
  };

  const handleSelectStatus = (value: StatusFilterOption) => {
    setStatusFilter(value);
    setShowStatusModal(false);
  };

  const displayDate = `${filterDate.getDate()}/${
    filterDate.getMonth() + 1
  }/${filterDate.getFullYear()}`;

  const getStatusLabel = () => {
    if (statusFilter === "ALL") return "Tất cả";
    if (statusFilter === "COMPLETED") return "Đã hoàn thành";
    return "Chưa xử lý";
  };

  const formatTimeRange = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const f = (n: number) => n.toString().padStart(2, "0");
      return `${f(s.getHours())}:${f(s.getMinutes())} - ${f(e.getHours())}:${f(
        e.getMinutes()
      )}`;
    } catch {
      return "--:--";
    }
  };

  const getStatusConfig = (status: string) => {
    if (status === "Done")
      return {
        label: "Đã hoàn thành",
        bgColor: "#DCFCE7",
        textColor: "#166534",
        icon: <CheckCircle size={12} color="#166534" />,
      };
    return {
      label: "Chưa xử lý",
      bgColor: "#FEF9C3",
      textColor: "#854D0E",
      icon: <Clock size={12} color="#854D0E" />,
    };
  };

  const renderItem = ({ item }: { item: MaintenanceRecord }) => {
    const statusConfig = getStatusConfig(item.status);
    const targetName =
      item.equipmentNames?.length > 0
        ? item.equipmentNames.join(", ")
        : "Thiết bị";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", flex: 1, gap: 12 }}>
            <View
              style={[
                styles.iconBox,
                activeTab === "room" ? styles.bgOrange : styles.bgBlue,
              ]}
            >
              {activeTab === "room" ? (
                <MapPin size={20} color="#EA580C" />
              ) : (
                <Monitor size={20} color="#2563EB" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.targetName} numberOfLines={1}>
                {targetName}
              </Text>
              <View style={styles.locationRow}>
                <Monitor size={12} color="#64748B" />
                <Text style={styles.locationText}>
                  SL: {item.equipmentCount || 1}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            {statusConfig.icon}
            <Text
              style={[styles.statusText, { color: statusConfig.textColor }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentRow}>
          <FileText size={16} color="#64748B" style={{ marginTop: 2 }} />
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={16} color="#64748B" />
            <Text style={styles.timeText}>
              {formatTimeRange(item.startTime, item.endTime)}
            </Text>
          </View>

          {/* 🔴 LUÔN HIỂN THỊ NÚT XÓA ĐỂ BE BẮT LỖI */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleConfirmDelete(item.id)}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={styles.deleteText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Bảo trì</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FILTER */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowDatePicker(true)}
        >
          <CalendarIcon size={16} color="#475569" />
          <Text style={styles.filterChipText}>{displayDate}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter !== "ALL" && styles.filterChipActive,
          ]}
          onPress={() => setShowStatusModal(true)}
        >
          <Filter
            size={16}
            color={statusFilter !== "ALL" ? "#EA580C" : "#475569"}
          />
          <Text
            style={[
              styles.filterChipText,
              statusFilter !== "ALL" && styles.filterChipTextActive,
            ]}
          >
            {getStatusLabel()}
          </Text>
          <ChevronDown
            size={14}
            color={statusFilter !== "ALL" ? "#EA580C" : "#94A3B8"}
          />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "room" && styles.activeTab]}
          onPress={() => setActiveTab("room")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "room" && styles.activeTabText,
            ]}
          >
            Phòng Lab
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "equipment" && styles.activeTab]}
          onPress={() => setActiveTab("equipment")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "equipment" && styles.activeTabText,
            ]}
          >
            Thiết bị
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchData();
              }}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <SearchX size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Không có dữ liệu</Text>
              <Text style={styles.emptyText}>
                {activeTab === "room"
                  ? "Đang phát triển..."
                  : `Không tìm thấy bảo trì nào vào ngày ${displayDate}.`}
              </Text>
            </View>
          }
        />
      )}

      {/* DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={filterDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* STATUS MODAL */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Lọc theo trạng thái</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSelectStatus("ALL")}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    statusFilter === "ALL" && styles.modalOptionTextActive,
                  ]}
                >
                  Tất cả
                </Text>
                {statusFilter === "ALL" && <Check size={18} color="#EA580C" />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSelectStatus("COMPLETED")}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <CheckCircle size={16} color="#166534" />
                  <Text
                    style={[
                      styles.modalOptionText,
                      statusFilter === "COMPLETED" &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    Đã hoàn thành
                  </Text>
                </View>
                {statusFilter === "COMPLETED" && (
                  <Check size={18} color="#EA580C" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSelectStatus("PENDING")}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Clock size={16} color="#854D0E" />
                  <Text
                    style={[
                      styles.modalOptionText,
                      statusFilter === "PENDING" &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    Chưa xử lý
                  </Text>
                </View>
                {statusFilter === "PENDING" && (
                  <Check size={18} color="#EA580C" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconBg}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>Xóa lịch bảo trì?</Text>
            <Text style={styles.deleteMessage}>
              Bạn có chắc chắn muốn xóa bản ghi này không? Hành động này không
              thể hoàn tác.
            </Text>
            <View style={styles.deleteActionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeleteAction}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Xóa ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF7ED",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  backButton: { padding: 4 },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterChipActive: { borderColor: "#FED7AA", backgroundColor: "#FFF7ED" },
  filterChipText: { fontSize: 14, color: "#334155", fontWeight: "500" },
  filterChipTextActive: { color: "#EA580C", fontWeight: "600" },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: { backgroundColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "white" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // --- CARD ---
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bgOrange: { backgroundColor: "#FFF7ED" },
  bgBlue: { backgroundColor: "#EFF6FF" },
  targetName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, color: "#64748B" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  contentRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  descriptionText: { fontSize: 14, color: "#334155", lineHeight: 20, flex: 1 },

  // Footer in Card
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  timeText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    gap: 6,
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },

  // --- EMPTY STATE ---
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalOptionText: { fontSize: 15, color: "#475569" },
  modalOptionTextActive: { color: "#EA580C", fontWeight: "600" },

  // --- DELETE MODAL ---
  deleteModalContent: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 5,
  },
  deleteIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteActionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
