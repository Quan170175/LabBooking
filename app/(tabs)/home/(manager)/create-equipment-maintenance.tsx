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
  Monitor,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";
import SuccessMaintenanceModal from "../../../../components/manager/maintenance/SuccessMaintenanceModal";
import RoomInfoSection from "../../../../components/manager/maintenance/RoomInfoSection";
import MaintenanceTimeSection from "../../../../components/manager/maintenance/MaintenanceTimeSection";
import MaintenanceDescriptionSection from "../../../../components/manager/maintenance/MaintenanceDescriptionSection";
import MaintenanceSubmitButton from "../../../../components/manager/maintenance/MaintenanceSubmitButton";

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
  const [submittedCount, setSubmittedCount] = useState(0);

  // --- GET DATA ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingRoom(true);
    setIsLoadingCategories(true);
    try {
      // 1. Get Room Info
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

      const catRes = await apiClient.get("/api/EquipmentCategories", {
        params: {
          PageNumber: 1,
          PageSize: 10,
        },
      });

      const catBody = catRes.data;
      // Logic tìm items: ưu tiên lớp ngoài -> lớp trong -> check mảng trực tiếp
      let categoriesList = catBody?.items || catBody?.data?.items;
      if (!categoriesList && Array.isArray(catBody)) {
        categoriesList = catBody;
      }

      setCategories(Array.isArray(categoriesList) ? categoriesList : []);
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
      // Thêm params PageSize để đảm bảo lấy hết thiết bị
      const res = await apiClient.get(url, {
        params: { PageNumber: 1, PageSize: 10 },
      });

      const resBody = res.data;
      let allEquipments: SpecificEquipment[] = [];

      // Logic tìm items
      if (resBody?.items && Array.isArray(resBody.items)) {
        allEquipments = resBody.items;
      } else if (resBody?.data?.items && Array.isArray(resBody.data.items)) {
        allEquipments = resBody.data.items;
      } else if (Array.isArray(resBody)) {
        allEquipments = resBody;
      }

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
        // Nếu đã có -> Xóa
        return prev.filter((item) => item.id !== id);
      } else {
        // Nếu chưa có -> Thêm vào kèm categoryId hiện tại
        return [...prev, { id, categoryId: selectedCategoryId }];
      }
    });
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!roomInfo?.id || selectedItems.length === 0 || !description.trim())
      return;

    setIsSubmitting(true);
    const countBeforeSubmit = selectedItems.length;

    try {
      // 1. Lấy danh sách ID để gửi API
      const equipmentIdsToSubmit = selectedItems.map((item) => item.id);

      const payload = {
        equipmentIds: equipmentIdsToSubmit,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        description: description.trim(),
      };

      // 2. Gọi API tạo lịch bảo trì
      await apiClient.post("/api/EquipmentMaintainSchedule", payload);

      // --- CẬP NHẬT GIAO DIỆN SAU KHI THÀNH CÔNG ---

      // 3. Loại bỏ các thiết bị vừa chọn khỏi danh sách đang hiển thị bên dưới
      setSpecificEquipments((prevList) =>
        prevList.filter((eq) => !equipmentIdsToSubmit.includes(eq.id))
      );

      // 4. Trừ số lượng trên thanh Category
      setCategories((prevCats) =>
        prevCats.map((cat) => {
          const countSelectedInThisCat = selectedItems.filter(
            (item) => item.categoryId === cat.id
          ).length;

          const newCount = Math.max(
            0,
            cat.equipmentCount - countSelectedInThisCat
          );

          return {
            ...cat,
            equipmentCount: newCount,
          };
        })
      );

      // 5. Reset lại các lựa chọn và hiện thông báo
      setSelectedItems([]);
      setSubmittedCount(countBeforeSubmit);
      setSuccessModalVisible(true);
      setDescription("");
    } catch (error: any) {
      console.error("❌ Lỗi gửi API:", error);

      // --- LOGIC BẮT LỖI TỐI ƯU ---
      let errorMsg = "Có lỗi xảy ra khi gửi lịch bảo trì.";
      const responseData = error.response?.data;
      const status = error.response?.status;

      console.log(`[HTTP Status]: ${status}`);
      console.log("[Response Data]:", responseData);

      if (responseData) {
        if (typeof responseData === "object" && responseData.message) {
          errorMsg = responseData.message;
        } else if (status === 400 && responseData.errors) {
          const errorData = responseData.errors;
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey]) {
            errorMsg = `${firstKey}: ${
              Array.isArray(errorData[firstKey])
                ? errorData[firstKey][0]
                : errorData[firstKey]
            }`;
          }
        } else if (typeof responseData === "string") {
          errorMsg = responseData;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      Alert.alert("Thất bại", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* 1. HEADER CỐ ĐỊNH (Nằm ngoài ScrollView) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bảo trì thiết bị</Text>
          <Text style={styles.headerSub}>Lên lịch bảo trì các thiết bị</Text>
        </View>
      </View>

      {/* 2. SCROLLVIEW CHỨA NỘI DUNG (Cuộn độc lập bên dưới) */}
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
              {categories.length > 0 ? (
                categories.map((cat) => {
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
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Không có loại thiết bị nào</Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* 3. SPECIFIC EQUIPMENT SELECT */}
        {selectedCategoryId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Monitor size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>
                Chọn thiết bị (Đã chọn: {selectedItems.length})
              </Text>
            </View>

            {isLoadingSpecific ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : specificEquipments.length === 0 ? (
              <View style={styles.emptyState}>
                <AlertCircle size={20} color="#64748B" />
                <Text style={styles.emptyText}>
                  Không có thiết bị khả dụng hoặc tất cả đã được bảo trì.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {specificEquipments.map((eq) => {
                  const isSelected = selectedItems.some((i) => i.id === eq.id);

                  let statusColor = "#64748B";
                  let statusText = eq.status || "Khác";
                  if (eq.status === "Sẵn sàng" || eq.status === "Available") {
                    statusColor = "#16A34A";
                    statusText = "Sẵn sàng";
                  }
                  if (eq.status === "Hỏng" || eq.status === "Broken") {
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

        {/* 4. TIME */}
        <MaintenanceTimeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* 5. DESCRIPTION */}
        <MaintenanceDescriptionSection
          description={description}
          onChangeText={setDescription}
        />

        {/* 6. SUBMIT BUTTON */}
        <MaintenanceSubmitButton
          onPress={handleSubmit}
          disabled={
            isSubmitting || selectedItems.length === 0 || !description.trim()
          }
          isSubmitting={isSubmitting}
          label={`Xác nhận (${selectedItems.length})`}
        />
      </ScrollView>

      {/* 🔥 MODAL THÀNH CÔNG */}
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
    justifyContent: "flex-start",
    padding: 16,
    backgroundColor: "#FFF7ED",
    zIndex: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 14, color: "#64748B", marginTop: 4 },
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
