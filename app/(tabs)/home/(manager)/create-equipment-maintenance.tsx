import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Monitor,
  AlertCircle,
  Layers,
  CheckCircle2,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";
import SecurityMessagesModal from "../../../../components/security/SecurityMessagesModal";
import SuccessMaintenanceModal from "../../../../components/manager/maintenance/SuccessMaintenanceModal";

// Import các Component con (giả sử bạn đã tách ra như cấu trúc trước)
import RoomInfoSection from "../../../../components/manager/maintenance/RoomInfoSection";
import MaintenanceTimeSection from "../../../../components/manager/maintenance/MaintenanceTimeSection";
import MaintenanceDescriptionSection from "../../../../components/manager/maintenance/MaintenanceDescriptionSection";
import MaintenanceSubmitButton from "../../../../components/manager/maintenance/MaintenanceSubmitButton";

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
  labRoomName: string;
}

interface ManagerLabDetailsResponse {
  userName: string;
  managedLabs: {
    id: string;
    labName: string;
    location: string;
  }[];
}

interface SelectedItem {
  id: string;
  categoryId: string;
}

export default function CreateEquipmentMaintenanceScreen() {
  const router = useRouter();

  // --- STATE ---
  const [roomInfo, setRoomInfo] = useState<{
    id: string;
    labName: string;
    location: string;
    managerName: string;
  } | null>(null);

  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [specificEquipments, setSpecificEquipments] = useState<
    SpecificEquipment[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingSpecific, setIsLoadingSpecific] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));

  // Modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [msgModalVisible, setMsgModalVisible] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  // --- GET DATA ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingRoom(true);
    setIsLoadingCategories(true);
    try {
      // 1. Lấy thông tin phòng
      const roomRes = await apiClient.get<ManagerLabDetailsResponse>(
        "/api/Managers/lab-details"
      );
      const roomData = roomRes.data;

      if (roomData && roomData.managedLabs && roomData.managedLabs.length > 0) {
        const myLab = roomData.managedLabs[0];
        setRoomInfo({
          id: myLab.id,
          labName: myLab.labName,
          location: myLab.location,
          managerName: roomData.userName,
        });
      }

      // 2. Lấy danh sách loại thiết bị
      const catRes = await apiClient.get("/api/EquipmentCategories");
      const categoriesList = Array.isArray(catRes.data) ? catRes.data : [];
      setCategories(categoriesList);
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tải thông tin ban đầu.");
    } finally {
      setIsLoadingRoom(false);
      setIsLoadingCategories(false);
    }
  };

  const handleSelectCategory = async (categoryId: string) => {
    if (selectedCategoryId === categoryId) return;

    setSelectedCategoryId(categoryId);
    setSpecificEquipments([]);
    setIsLoadingSpecific(true);

    try {
      const url = `/api/EquipmentCategories/${categoryId}/equipments`;
      const res = await apiClient.get(url);
      const allEquipments: SpecificEquipment[] = Array.isArray(res.data)
        ? res.data
        : [];

      // Lọc bỏ thiết bị đang bảo trì
      const availableEquipments = allEquipments.filter(
        (eq) => eq.status !== "Maintain" && eq.status !== "Đang bảo trì"
      );

      setSpecificEquipments(availableEquipments);
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tải danh sách thiết bị.");
    } finally {
      setIsLoadingSpecific(false);
    }
  };

  const toggleEquipmentSelection = (id: string) => {
    if (!selectedCategoryId) return;

    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      } else {
        return [...prev, { id, categoryId: selectedCategoryId }];
      }
    });
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    // Validate: Phải có phòng + có chọn thiết bị + có nhập mô tả
    if (!roomInfo?.id || selectedItems.length === 0 || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    const countBeforeSubmit = selectedItems.length;

    try {
      // 1. Chuẩn bị payload
      const equipmentIdsToSubmit = selectedItems.map((item) => item.id);
      const payload = {
        equipmentIds: equipmentIdsToSubmit,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        description: description.trim(),
      };

      // 2. Gọi API
      await apiClient.post("/api/EquipmentMaintainSchedule", payload);

      // --- XỬ LÝ SAU KHI THÀNH CÔNG ---

      // 3. Loại bỏ thiết bị vừa gửi khỏi danh sách đang hiện
      setSpecificEquipments((prevList) =>
        prevList.filter((eq) => !equipmentIdsToSubmit.includes(eq.id))
      );

      // 4. Cập nhật lại số lượng hiển thị trên Category chip
      setCategories((prevCats) =>
        prevCats.map((cat) => {
          const countSelectedInThisCat = selectedItems.filter(
            (item) => item.categoryId === cat.id
          ).length;
          const newCount = Math.max(
            0,
            cat.equipmentCount - countSelectedInThisCat
          );
          return { ...cat, equipmentCount: newCount };
        })
      );

      // 5. Reset và hiện Modal thành công
      setSelectedItems([]);
      setSubmittedCount(countBeforeSubmit);
      setSuccessModalVisible(true);
      setDescription("");
    } catch (error: any) {
      console.error("❌ Lỗi gửi API:", error);

      // --- XỬ LÝ LỖI CHI TIẾT TỪ BE ---
      let errorMsg = "Có lỗi xảy ra khi gửi lịch bảo trì.";
      const responseData = error.response?.data;

      if (responseData) {
        if (responseData.errors) {
          // Lỗi Validation nhiều dòng
          const errorObj = responseData.errors;
          const errorList: string[] = [];
          Object.keys(errorObj).forEach((key) => {
            const messages = errorObj[key];
            if (Array.isArray(messages)) {
              messages.forEach((msg) => errorList.push(`• ${msg}`));
            }
          });
          if (errorList.length > 0) errorMsg = errorList.join("\n");
        } else if (responseData.message) {
          // Lỗi có message cụ thể
          errorMsg = responseData.message;
        } else if (typeof responseData === "string") {
          // Lỗi string
          errorMsg = responseData;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      Alert.alert("Không thể tạo lịch", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NAVIGATION HANDLERS ---
  const goToHistory = () => {
    setSuccessModalVisible(false);
    router.push("/(tabs)/home/(manager)/maintenancehistory");
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    setSubmittedCount(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo trì thiết bị</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ROOM INFO */}
        <RoomInfoSection
          isLoading={isLoadingRoom}
          labName={roomInfo?.labName}
          location={roomInfo?.location}
          managerName={roomInfo?.managerName}
        />

        {/* 2. CATEGORY SELECT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Layers size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Loại thiết bị</Text>
          </View>
          {isLoadingCategories ? (
            <ActivityIndicator size="small" color="#EA580C" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {categories.map((cat) => {
                const selectedCountInCat = selectedItems.filter(
                  (i) => i.categoryId === cat.id
                ).length;
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                      selectedCountInCat > 0 && styles.chipHasSelection,
                    ]}
                    onPress={() => handleSelectCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                        selectedCountInCat > 0 && {
                          fontWeight: "700",
                          color: "#EA580C",
                        },
                      ]}
                    >
                      {cat.name}
                      {selectedCountInCat > 0
                        ? ` (${selectedCountInCat}/${cat.equipmentCount})`
                        : ` (${cat.equipmentCount})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 3. SPECIFIC EQUIPMENT SELECT */}
        {selectedCategoryId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Monitor size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>
                Chọn thiết bị (Tổng: {selectedItems.length})
              </Text>
            </View>

            {isLoadingSpecific ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : specificEquipments.length === 0 ? (
              <View style={styles.emptyState}>
                <AlertCircle size={20} color="#64748B" />
                <Text style={styles.emptyText}>
                  Không có thiết bị khả dụng.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {specificEquipments.map((eq) => {
                  const isSelected = selectedItems.some((i) => i.id === eq.id);
                  // Xử lý màu sắc trạng thái
                  let statusColor = "#64748B";
                  let statusText = eq.status || "Khác";
                  if (["Sẵn sàng", "Available"].includes(eq.status)) {
                    statusColor = "#16A34A";
                    statusText = "Sẵn sàng";
                  }
                  if (["Hỏng", "Broken"].includes(eq.status)) {
                    statusColor = "#DC2626";
                    statusText = "Hỏng";
                  }

                  return (
                    <TouchableOpacity
                      key={eq.id}
                      style={[
                        styles.gridItem,
                        isSelected && styles.gridItemActive,
                      ]}
                      onPress={() => toggleEquipmentSelection(eq.id)}
                    >
                      <View style={styles.gridItemContent}>
                        <View style={{ flex: 1, paddingRight: 4 }}>
                          <Text
                            style={[
                              styles.gridItemText,
                              isSelected && styles.gridItemTextActive,
                            ]}
                            numberOfLines={2}
                          >
                            {eq.equipmentName}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: statusColor,
                              marginTop: 4,
                            }}
                          >
                            ● {statusText}
                          </Text>
                        </View>
                        {isSelected && (
                          <CheckCircle2 size={16} color="#EA580C" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 4. TIME SECTION */}
        <MaintenanceTimeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* 5. DESCRIPTION SECTION */}
        <MaintenanceDescriptionSection
          description={description}
          onChangeText={setDescription}
          onOpenTemplate={() => setMsgModalVisible(true)}
        />

        {/* 6. SUBMIT BUTTON */}
        <MaintenanceSubmitButton
          onPress={handleSubmit}
          // 🔥 ĐIỀU KIỆN DISABLED MỚI: Check thêm description
          disabled={
            isSubmitting || selectedItems.length === 0 || !description.trim()
          }
          isSubmitting={isSubmitting}
          label={`Xác nhận (${selectedItems.length})`}
        />
      </ScrollView>

      {/* MODAL: CHỌN TIN NHẮN */}
      <SecurityMessagesModal
        visible={msgModalVisible}
        onClose={() => setMsgModalVisible(false)}
        onSelectMessage={(content) => {
          setDescription(content);
          setMsgModalVisible(false);
        }}
      />

      {/* MODAL: THÀNH CÔNG */}
      <SuccessMaintenanceModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        onViewHistory={goToHistory}
        message={`Đã tạo lịch bảo trì cho ${submittedCount} thiết bị.`}
      />
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
  content: { padding: 16, paddingBottom: 100 },

  section: {
    marginBottom: 20,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#334155" },
  horizontalScroll: { flexDirection: "row" },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FFF7ED", borderColor: "#EA580C" },
  chipHasSelection: { borderColor: "#FB923C", borderWidth: 1.5 },
  chipText: { fontSize: 14, color: "#334155", fontWeight: "600" },
  chipTextActive: { color: "#EA580C" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  gridItemActive: { backgroundColor: "#FFF7ED", borderColor: "#EA580C" },
  gridItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridItemText: { fontSize: 13, color: "#334155", fontWeight: "500" },
  gridItemTextActive: { color: "#EA580C", fontWeight: "700" },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 8,
  },
  emptyText: { fontSize: 13, color: "#94A3B8", textAlign: "center" },
});
