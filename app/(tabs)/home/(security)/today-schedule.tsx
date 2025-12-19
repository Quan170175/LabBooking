import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  MapPin,
  X,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  LogIn,
  LogOut,
  ChevronDown,
  Check,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";

// --- 1. TYPES (GIỮ NGUYÊN ĐỂ KHÔNG BỊ LỖI TS) ---
interface SlotDefinition {
  id: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  label: string;
}

interface Equipment {
  id: string;
  equipmentName?: string;
  name?: string;
  quantity: number;
}

interface LabRoomApiResponse {
  id: string;
  labName: string;
  location: string;
  maximumLimit: number;
  equipments: Equipment[];
}

interface BookingSlotUI extends SlotDefinition {
  status: "Pending" | "CheckedIn" | "CheckedOut" | "Empty";
  bookerName?: string;
}

interface LabScheduleUI extends LabRoomApiResponse {
  uiSlots: BookingSlotUI[];
}

// --- UTILS ---
const formatDateForApi = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const formatTimeDisplay = (timeString: string) => {
  if (!timeString) return "";
  return timeString.split(":").slice(0, 2).join(":");
};

// --- COMPONENT: DROPDOWN CHỌN PHÒNG (MỚI THÊM) ---
const BottomSheetSelect = ({
  label,
  data,
  value,
  onSelect,
}: {
  label: string;
  data: LabRoomApiResponse[];
  value: string | null;
  onSelect: (val: string | null) => void;
}) => {
  const [visible, setVisible] = useState(false);

  const selectedItem = data.find((item) => item.id === value);
  const displayValue = selectedItem ? selectedItem.labName : "Tất cả các phòng";

  return (
    <View style={styles.dropdownWrapper}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownValue, !value && { color: "#64748B" }]}>
          {displayValue}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.sheetOverlay}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeaderDropdown}>
                <Text style={styles.sheetTitle}>Chọn phòng</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                <TouchableOpacity
                  style={[
                    styles.sheetItem,
                    value === null && styles.sheetItemActive,
                  ]}
                  onPress={() => {
                    onSelect(null);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetItemText,
                      value === null && styles.sheetItemTextActive,
                    ]}
                  >
                    Tất cả các phòng
                  </Text>
                  {value === null && <Check size={18} color="#EA580C" />}
                </TouchableOpacity>

                {data.map((item) => {
                  const isActive = value === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.sheetItem,
                        isActive && styles.sheetItemActive,
                      ]}
                      onPress={() => {
                        onSelect(item.id);
                        setVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sheetItemText,
                          isActive && styles.sheetItemTextActive,
                        ]}
                      >
                        {item.labName}
                      </Text>
                      {isActive && <Check size={18} color="#EA580C" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function SecurityTodayScheduleScreen() {
  const router = useRouter();

  // --- STATE ---
  const [labs, setLabs] = useState<LabScheduleUI[]>([]);
  const [labOptions, setLabOptions] = useState<LabRoomApiResponse[]>([]); // List cho dropdown
  const [slotsDefinition, setSlotsDefinition] = useState<SlotDefinition[]>([]);

  // Filter & Pagination
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // State Filter (Dropdown)
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Modal Check-in/out State (GIỮ NGUYÊN LOGIC CŨ)
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLab, setCurrentLab] = useState<LabScheduleUI | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"CheckIn" | "CheckOut">(
    "CheckIn"
  );
  const [note, setNote] = useState("");
  const [isPassed, setIsPassed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. INIT DATA (Slots & Lab Options) ---
  useEffect(() => {
    const initData = async () => {
      try {
        // Lấy danh sách Slot
        const slotRes = await apiClient.get<SlotDefinition[]>("/api/Slot");
        const slotsData = slotRes.data || [];
        setSlotsDefinition(slotsData.sort((a, b) => a.slotIndex - b.slotIndex));

        // Lấy danh sách Full Labs cho Dropdown (PageSize lớn để lấy hết)
        const allLabsRes = await apiClient.get("/api/LabRooms", {
          params: { PageSize: 10, PageNumber: 1 },
        });
        setLabOptions(allLabsRes.data.items || []);
      } catch (error) {
        console.error("Init Error:", error);
      }
    };
    initData();
  }, []);

  // --- 2. FETCH LABS LIST (CÓ LOGIC SEARCH PHRASE) ---
  const fetchLabs = async (pageToLoad: number, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setIsLoading(true);

      const today = formatDateForApi(new Date());
      const labParams: any = {
        PageSize: 10,
        PageNumber: pageToLoad,
        FilterDate: today,
      };

      // --- LOGIC MỚI: Dùng Dropdown ID -> Map ra Tên phòng -> Gửi SearchPhrase ---
      if (selectedLabId) {
        const selectedLab = labOptions.find((l) => l.id === selectedLabId);
        if (selectedLab) {
          labParams.SearchPhrase = selectedLab.labName;
        }
      }

      console.log(`Fetch Labs (Page ${pageToLoad}) Params:`, labParams);

      const labRes = await apiClient.get("/api/LabRooms", {
        params: labParams,
      });
      const labItems: LabRoomApiResponse[] = labRes.data.items || [];

      // Map Slots vào Labs (Logic cũ của bạn)
      const labsWithUi: LabScheduleUI[] = labItems.map((lab) => ({
        ...lab,
        uiSlots: slotsDefinition.map((s) => ({
          ...s,
          status: "Pending", // Mặc định pending vì chưa có API get status thật
          bookerName: "...",
        })),
      }));

      if (shouldRefresh) {
        setLabs(labsWithUi);
      } else {
        setLabs((prev) => [...prev, ...labsWithUi]);
      }

      setHasMore(labItems.length >= 10);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // --- 3. RELOAD KHI ĐỔI DROPDOWN ---
  useEffect(() => {
    if (slotsDefinition.length > 0) {
      setPage(1);
      fetchLabs(1, true);
    }
  }, [selectedLabId, slotsDefinition]);

  // --- HANDLERS (GIỮ NGUYÊN LOGIC CŨ CỦA BẠN) ---
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchLabs(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLabs(nextPage, false);
    }
  };

  const handleOpenModal = (lab: LabScheduleUI) => {
    setCurrentLab(lab);
    if (lab.uiSlots.length > 0) setSelectedSlotId(lab.uiSlots[0].id);
    setActionType("CheckIn");
    setNote("");
    setIsPassed(true);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!currentLab || !selectedSlotId) return;

    if (!isPassed && (!note || note.trim() === "")) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập ghi chú sự cố.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        labRoomId: currentLab.id,
        slotId: selectedSlotId,
        type: actionType,
        isPassed: isPassed,
        note: note,
      };

      const response = await apiClient.post("/api/RoomChecks", payload);

      if (isPassed) {
        Alert.alert("Thành công", `Đã ${actionType} thành công!`);
        setModalVisible(false);
      } else {
        setModalVisible(false);
        const realCheckId = response.data?.id || response.data;
        Alert.alert("Cảnh báo", "Phát hiện sự cố. Tạo báo cáo ngay?", [
          { text: "Để sau", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: () =>
              router.push({
                pathname: "/(tabs)/home/(security)/create-incident",
                params: {
                  preSelectedRoomId: currentLab.id,
                  linkedCheckId: realCheckId,
                  isFromCheckRoom: "true",
                },
              }),
          },
        ]);
      }
    } catch (error: any) {
      let msg = "Lỗi hệ thống";
      if (error.response?.data?.message) msg = error.response.data.message;
      Alert.alert("Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Lịch trình hôm nay",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FFF7ED" },
        }}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.dateText}>Lịch trình hôm nay</Text>
        <Text style={styles.subText}>
          {new Date().toLocaleDateString("vi-VN")}
        </Text>
      </View>

      {/* --- DROPDOWN (MỚI) --- */}
      <View style={styles.filterContainer}>
        <BottomSheetSelect
          label="Lọc theo phòng"
          data={labOptions}
          value={selectedLabId}
          onSelect={setSelectedLabId}
        />
      </View>

      {/* --- LIST PHÒNG (GIỮ NGUYÊN LOGIC CŨ) --- */}
      {isLoading && page === 1 ? (
        <ActivityIndicator
          size="large"
          color="#EA580C"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={labs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.simpleCard}
              onPress={() => handleOpenModal(item)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                  <MapPin size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simpleLabName} numberOfLines={1}>
                    {item.labName}
                  </Text>
                  <Text style={styles.simpleLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <Text style={styles.slotCountText}>
                    Sức chứa: {item.maximumLimit}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>Kiểm tra</Text>
                  <ChevronRight size={14} color="#EA580C" />
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {selectedLabId
                  ? "Không tìm thấy phòng này."
                  : "Không có lịch trình."}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#EA580C"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : null
          }
        />
      )}

      {/* --- MODAL XỬ LÝ (GIỮ NGUYÊN LOGIC CŨ) --- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.actionModalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
              <View style={styles.actionModalContent}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Kiểm tra phòng</Text>
                    <Text style={styles.modalSubHeader}>
                      {currentLab?.labName}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {/* Slot Selector */}
                  <Text style={styles.sectionLabel}>1. Chọn Ca Hoạt Động:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.slotSelectorContainer}
                  >
                    {currentLab?.uiSlots?.map((slot) => {
                      const isSelected = slot.id === selectedSlotId;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[
                            styles.slotChip,
                            isSelected && styles.slotChipActive,
                          ]}
                          onPress={() => setSelectedSlotId(slot.id)}
                        >
                          <Text
                            style={[
                              styles.slotChipTime,
                              isSelected && styles.textWhite,
                            ]}
                          >
                            {slot.label}
                          </Text>
                          <Text
                            style={[
                              styles.slotChipRange,
                              isSelected && styles.textWhite,
                            ]}
                          >
                            {formatTimeDisplay(slot.startTime)} -{" "}
                            {formatTimeDisplay(slot.endTime)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.sectionLabel}>2. Hành động:</Text>
                    <View style={styles.actionToggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          actionType === "CheckIn" && styles.actionBtnIn,
                        ]}
                        onPress={() => setActionType("CheckIn")}
                      >
                        <LogIn
                          size={20}
                          color={actionType === "CheckIn" ? "white" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            actionType === "CheckIn" && styles.textWhite,
                          ]}
                        >
                          Check In
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          actionType === "CheckOut" && styles.actionBtnOut,
                        ]}
                        onPress={() => setActionType("CheckOut")}
                      >
                        <LogOut
                          size={20}
                          color={
                            actionType === "CheckOut" ? "white" : "#64748B"
                          }
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            actionType === "CheckOut" && styles.textWhite,
                          ]}
                        >
                          Check Out
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Thiết bị */}
                  <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <ClipboardList size={16} color="#EA580C" />
                    <Text style={styles.sectionTitle}>Danh sách thiết bị</Text>
                  </View>
                  <View style={styles.equipmentList}>
                    {currentLab?.equipments?.length ? (
                      currentLab.equipments.map((eq) => (
                        <View key={eq.id} style={styles.eqItem}>
                          <Text style={styles.eqName}>
                            {eq.equipmentName || eq.name}
                          </Text>
                          <Text style={styles.eqQty}>
                            SL: {eq.quantity || 1}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text
                        style={{
                          fontStyle: "italic",
                          color: "#94A3B8",
                          textAlign: "center",
                          padding: 10,
                        }}
                      >
                        Chưa có thông tin thiết bị
                      </Text>
                    )}
                  </View>

                  {/* Tình trạng */}
                  <View style={styles.checkStatusContainer}>
                    <View style={styles.switchRow}>
                      <Text
                        style={[
                          styles.modalStatusText,
                          !isPassed && styles.statusTextBad,
                        ]}
                      >
                        {isPassed ? "Tình trạng ổn định" : "Có hư hỏng / Sự cố"}
                      </Text>
                      <Switch
                        trackColor={{ false: "#EF4444", true: "#22C55E" }}
                        thumbColor={"#FFFFFF"}
                        onValueChange={setIsPassed}
                        value={isPassed}
                      />
                    </View>
                  </View>

                  {/* Ghi chú */}
                  <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <AlertTriangle size={16} color="#EA580C" />
                    <Text style={styles.sectionTitle}>Ghi chú</Text>
                  </View>
                  <TextInput
                    style={styles.inputArea}
                    placeholder="Nhập ghi chú..."
                    multiline
                    numberOfLines={3}
                    value={note}
                    onChangeText={setNote}
                  />

                  {/* Submit */}
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      isSubmitting && styles.confirmButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Xác nhận</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  headerContainer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
  dateText: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  subText: { fontSize: 14, color: "#64748B", marginTop: 4 },

  // Styles cho Filter Dropdown
  filterContainer: { paddingHorizontal: 20, marginBottom: 16, zIndex: 10 },
  dropdownWrapper: {},
  dropdownLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 6,
  },
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
  },
  dropdownValue: { fontSize: 14, color: "#1E293B", fontWeight: "500" },

  // Dropdown Modal
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: "60%",
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

  // List Styles
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  simpleCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  simpleLabName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  simpleLocation: { fontSize: 13, color: "#64748B" },
  slotCountText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  cardRight: {},
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  actionBadgeText: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "600",
    marginRight: 2,
  },

  // Modal Action Styles
  actionModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  actionModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "90%",
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalSubHeader: { fontSize: 14, color: "#64748B", marginTop: 2 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  slotSelectorContainer: { flexDirection: "row", marginBottom: 4 },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 100,
  },
  slotChipActive: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  slotChipTime: { fontSize: 13, fontWeight: "700", color: "#334155" },
  slotChipRange: { fontSize: 11, color: "#64748B", marginTop: 2 },
  textWhite: { color: "white" },
  actionToggleContainer: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  actionBtnIn: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  actionBtnOut: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  equipmentList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  eqItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  eqName: { fontSize: 13, color: "#334155" },
  eqQty: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  inputArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#0F172A",
  },
  confirmButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 24,
  },
  confirmButtonDisabled: { backgroundColor: "#94A3B8" },
  confirmButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  checkStatusContainer: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalStatusText: { fontSize: 15, fontWeight: "700", color: "#16A34A" },
  statusTextBad: { color: "#DC2626" },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94A3B8" },
});
