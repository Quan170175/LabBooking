// (tabs)/SecurityHistoryScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { jwtDecode } from "jwt-decode";
import {
  Trash2,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  ChevronDown,
  Check,
  X,
  Filter,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";

// --- TYPES ---
interface RoomCheckHistoryItem {
  id: string;
  labRoomName: string;
  slotName: string;
  guardName: string | null;
  type: "CheckIn" | "CheckOut";
  isPassed: boolean;
  note: string;
  checkedAt: string;
}

interface LabOption {
  id: string;
  labName: string;
}

type FilterType = "All" | "CheckIn" | "CheckOut";

interface TypeOption {
  id: FilterType;
  label: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { id: "All", label: "Tất cả loại" },
  { id: "CheckIn", label: "Check In (Vào)" },
  { id: "CheckOut", label: "Check Out (Ra)" },
];

// --- HELPER FUNCTIONS ---
const formatDateTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")} - ${date.getDate().toString().padStart(2, "0")}/${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

const formatDateOnly = (date: Date) => {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

// --- COMPONENTS ---
const FilterTrigger = ({ label, icon, isActive, onPress, onClear }: any) => (
  <TouchableOpacity
    style={[styles.dropdownTrigger, isActive && styles.dropdownTriggerActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[styles.dropdownValue, isActive && styles.dropdownValueActive]}
      >
        {label}
      </Text>
    </View>
    {isActive && onClear ? (
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onClear();
        }}
        style={styles.clearBtnMin}
      >
        <X size={14} color="white" />
      </TouchableOpacity>
    ) : (
      <ChevronDown size={18} color={isActive ? "#EA580C" : "#64748B"} />
    )}
  </TouchableOpacity>
);

const SelectionModal = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeaderDropdown}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((item: any) => {
                const isActive = selectedValue === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.sheetItem,
                      isActive && styles.sheetItemActive,
                    ]}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.sheetItemText,
                        isActive && styles.sheetItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <Check size={18} color="#EA580C" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// --- MAIN SCREEN ---
export default function SecurityHistoryScreen() {
  const [historyList, setHistoryList] = useState<RoomCheckHistoryItem[]>([]);
  const [labOptions, setLabOptions] = useState<LabOption[]>([]);

  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showLabModal, setShowLabModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoomCheckHistoryItem | null>(
    null
  );

  const [userRole, setUserRole] = useState<string | null>(null);

  // Logic check role (chuẩn hóa chữ thường)
  const isSecurityGuard =
    (userRole || "").trim().toLowerCase() === "securityguard";

  // --- 1. INIT DATA: Lấy Role từ SecureStore ---
  useEffect(() => {
    const initData = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        let finalRole = null;

        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            finalRole =
              decoded["role"] ||
              decoded[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
              ] ||
              decoded["Role"] ||
              null;

            if (Array.isArray(finalRole)) {
              if (finalRole.includes("SecurityGuard"))
                finalRole = "SecurityGuard";
              else finalRole = finalRole[0];
            }
          } catch (e) {
            console.error("❌ Error decoding token:", e);
          }
        }
        setUserRole(finalRole);

        const res = await apiClient.get("/api/LabRooms", {
          params: { PageSize: 10, PageNumber: 1 },
        });
        setLabOptions(res.data.items || []);
      } catch (err) {
        console.error("Failed to load init data", err);
      }
    };
    initData();
  }, []);

  // --- 2. FETCH HISTORY ---
  const fetchHistory = async (pageToLoad: number, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setIsLoading(true);

      const params: any = {
        PageSize: 10,
        PageNumber: pageToLoad,
        SortBy: "checkedAt",
        SortDirection: "Descending",
      };

      if (selectedLabId) {
        const selectedLab = labOptions.find((l) => l.id === selectedLabId);
        if (selectedLab) params.SearchPhrase = selectedLab.labName;
      }

      if (filterType !== "All") params.Type = filterType;

      if (selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        params.FromDate = startDate.toISOString();
        params.ToDate = endDate.toISOString();
      }

      const res = await apiClient.get("/api/RoomChecks", { params });
      const newItems = res.data.items || [];

      if (shouldRefresh) setHistoryList(newItems);
      else setHistoryList((prev) => [...prev, ...newItems]);

      setHasMore(newItems.length >= 10);
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1, true);
  }, [selectedLabId, filterType, selectedDate]);

  // --- HANDLERS ---
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleOpenDetail = (item: RoomCheckHistoryItem) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  const handleDelete = (id: string) => {
    if (!isSecurityGuard) {
      Alert.alert("Quyền hạn", "Chỉ SecurityGuard mới được xóa.");
      return;
    }
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa bản ghi này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/RoomChecks/${id}`);
            setHistoryList((prev) => prev.filter((item) => item.id !== id));
            Alert.alert("Thành công", "Đã xóa bản ghi.");
            if (detailVisible) setDetailVisible(false);
          } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi server";
            Alert.alert("Lỗi", msg);
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchHistory(1, true);
  };

  const onLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, false);
    }
  };

  // --- RENDER HELPERS ---
  const getLabLabel = () => {
    if (!selectedLabId) return "Tất cả phòng";
    const found = labOptions.find((l) => l.id === selectedLabId);
    return found ? found.labName : "Tất cả phòng";
  };
  const getTypeLabel = () =>
    TYPE_OPTIONS.find((t) => t.id === filterType)?.label || "Tất cả loại";

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: RoomCheckHistoryItem }) => {
    const isCheckIn = item.type === "CheckIn";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOpenDetail(item)}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerLeftInfo}>
            <Text style={styles.labName}>{item.labRoomName}</Text>

            {/* Đã ẩn hoàn toàn tên guard ở ngoài list */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Clock size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>
                {formatDateTime(item.checkedAt)}
              </Text>
            </View>
          </View>

          {isSecurityGuard && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            {isCheckIn ? (
              <View style={[styles.tag, styles.tagBlue]}>
                <LogIn size={14} color="#2563EB" />
                <Text style={[styles.tagText, { color: "#2563EB" }]}>
                  Check In
                </Text>
              </View>
            ) : (
              <View style={[styles.tag, styles.tagOrange]}>
                <LogOut size={14} color="#EA580C" />
                <Text style={[styles.tagText, { color: "#EA580C" }]}>
                  Check Out
                </Text>
              </View>
            )}
            <Text style={styles.slotName}>{item.slotName}</Text>
          </View>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {item.isPassed ? (
              <CheckCircle size={18} color="#16A34A" />
            ) : (
              <XCircle size={18} color="#DC2626" />
            )}
            <Text
              style={[
                styles.statusText,
                { color: item.isPassed ? "#16A34A" : "#DC2626" },
              ]}
            >
              {item.isPassed ? "Bình thường" : "Có sự cố"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.pageHeaderContainer}>
        <Text style={styles.pageTitle}>Lịch sử kiểm tra</Text>
        <Text style={styles.pageDescription}>
          {isSecurityGuard
            ? "Chế độ: Bảo vệ (SecurityGuard)"
            : "Chế độ: Xem (Chỉ đọc)"}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <FilterTrigger
          label={getLabLabel()}
          icon={
            <MapPin size={16} color={selectedLabId ? "#EA580C" : "#64748B"} />
          }
          isActive={!!selectedLabId}
          onPress={() => setShowLabModal(true)}
          onClear={() => setSelectedLabId(null)}
        />
        <View style={styles.filterRowTwo}>
          <View style={{ flex: 1 }}>
            <FilterTrigger
              label={selectedDate ? formatDateOnly(selectedDate) : "Chọn ngày"}
              icon={
                <CalendarIcon
                  size={16}
                  color={selectedDate ? "#EA580C" : "#64748B"}
                />
              }
              isActive={!!selectedDate}
              onPress={() => setShowDatePicker(true)}
              onClear={() => setSelectedDate(null)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FilterTrigger
              label={getTypeLabel()}
              icon={
                <Filter
                  size={16}
                  color={filterType !== "All" ? "#EA580C" : "#64748B"}
                />
              }
              isActive={filterType !== "All"}
              onPress={() => setShowTypeModal(true)}
              onClear={
                filterType !== "All" ? () => setFilterType("All") : undefined
              }
            />
          </View>
        </View>
      </View>

      <FlatList
        data={historyList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#EA580C"]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color="#EA580C" style={{ margin: 10 }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>Không tìm thấy bản ghi nào.</Text>
          ) : null
        }
      />

      {/* MODALS */}
      <SelectionModal
        visible={showLabModal}
        onClose={() => setShowLabModal(false)}
        title="Chọn phòng Lab"
        options={[
          { id: "ALL_LABS_DUMMY", label: "Tất cả các phòng" },
          ...labOptions.map((l) => ({ id: l.id, label: l.labName })),
        ]}
        selectedValue={selectedLabId || "ALL_LABS_DUMMY"}
        onSelect={(id: any) =>
          setSelectedLabId(id === "ALL_LABS_DUMMY" ? null : id)
        }
      />

      <SelectionModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Chọn loại"
        options={TYPE_OPTIONS}
        selectedValue={filterType}
        onSelect={(id: any) => setFilterType(id)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateChange}
          accentColor="#EA580C"
        />
      )}

      {Platform.OS === "ios" && showDatePicker && (
        <Modal transparent animationType="fade">
          <View style={styles.iosDatePickerOverlay}>
            <View style={styles.iosDatePickerContent}>
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                accentColor="#EA580C"
                style={{ height: 300 }}
              />
              <TouchableOpacity
                style={styles.iosCloseBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.iosCloseText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {detailVisible && selectedItem && (
        <Modal visible={detailVisible} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setDetailVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chi tiết kiểm tra</Text>
                    <TouchableOpacity onPress={() => setDetailVisible(false)}>
                      <X size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginBottom: 20 }}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phòng:</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.labRoomName}
                      </Text>
                    </View>

                    {/* ✅ SỬA Ở ĐÂY: Nếu KHÔNG phải bảo vệ thì mới hiện tên bảo vệ */}
                    {!isSecurityGuard && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bảo vệ:</Text>
                        <Text style={styles.detailValue}>
                          {selectedItem.guardName || "Unknown"}
                        </Text>
                      </View>
                    )}
                    {/* -------------------------------------------------------- */}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Thời gian:</Text>
                      <Text style={styles.detailValue}>
                        {formatDateTime(selectedItem.checkedAt)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ghi chú:</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.note || "Không có"}
                      </Text>
                    </View>
                  </View>
                  {isSecurityGuard && (
                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => handleDelete(selectedItem.id)}
                    >
                      <Trash2 size={18} color="white" />
                      <Text style={styles.modalDeleteText}>
                        Xóa bản ghi này
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  pageHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
  },
  pageDescription: { fontSize: 15, color: "#64748B" },
  filterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  filterRowTwo: { flexDirection: "row", gap: 10, marginTop: 10 },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 48,
  },
  dropdownTriggerActive: { borderColor: "#EA580C", backgroundColor: "#FFF7ED" },
  dropdownValue: { fontSize: 14, color: "#334155", fontWeight: "600", flex: 1 },
  dropdownValueActive: { color: "#EA580C" },
  clearBtnMin: {
    backgroundColor: "#FB923C",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  sheetContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
    width: "100%",
  },
  sheetHeaderDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  sheetItemActive: {
    backgroundColor: "#FFF7ED",
    marginHorizontal: -10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomColor: "transparent",
  },
  sheetItemText: { fontSize: 16, color: "#334155" },
  sheetItemTextActive: { color: "#EA580C", fontWeight: "600" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeftInfo: { flex: 1, paddingRight: 10 },
  labName: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  guardRowMin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  guardTextMin: { fontSize: 13, color: "#64748B", fontStyle: "italic" },
  dateText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  deleteButton: { padding: 8, backgroundColor: "#FEF2F2", borderRadius: 8 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },
  cardBody: { flexDirection: "column" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  slotName: { fontSize: 14, color: "#334155", fontWeight: "500" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBlue: { backgroundColor: "#EFF6FF" },
  tagOrange: { backgroundColor: "#FFF7ED" },
  tagText: { fontSize: 12, fontWeight: "700" },
  statusText: { fontSize: 14, fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#94A3B8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1E293B" },
  detailRow: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },
  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginTop: "auto",
  },
  modalDeleteText: { color: "white", fontWeight: "bold", fontSize: 16 },
  iosDatePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  iosDatePickerContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  iosCloseBtn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  iosCloseText: { color: "#007AFF", fontSize: 18, fontWeight: "600" },
});
