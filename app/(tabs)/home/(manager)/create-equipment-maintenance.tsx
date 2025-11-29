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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Monitor,
  AlertCircle,
  CheckCircle2,
  History,
  Layers,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";
import SecurityMessagesModal from "../../../../components/security/SecurityMessagesModal";

// 🔥 IMPORT COMPONENT CHUNG
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
  status: string; // "Maintain" | "Available" | "Broken" | "Other"
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
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

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

  // --- GET DATA ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingRoom(true);
    setIsLoadingCategories(true);
    try {
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
    setSelectedEquipmentIds([]);
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
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (
      !roomInfo?.id ||
      selectedEquipmentIds.length === 0 ||
      !description.trim()
    )
      return;

    setIsSubmitting(true);
    try {
      const requests = selectedEquipmentIds.map((eqId) => {
        const payload = {
          equipmentId: eqId,
          labRoomId: roomInfo.id,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          description: description.trim(),
        };
        return apiClient.post("/api/EquipmentMaintainSchedules", payload);
      });

      await Promise.all(requests);

      // Cập nhật UI ngay lập tức
      setSpecificEquipments((prevList) =>
        prevList.filter((eq) => !selectedEquipmentIds.includes(eq.id))
      );

      if (selectedCategoryId) {
        setCategories((prevCats) =>
          prevCats.map((cat) =>
            cat.id === selectedCategoryId
              ? {
                  ...cat,
                  equipmentCount: Math.max(
                    0,
                    cat.equipmentCount - selectedEquipmentIds.length
                  ),
                }
              : cat
          )
        );
      }

      setSuccessModalVisible(true);
      setDescription("");
      setSelectedEquipmentIds([]);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi hệ thống.";
      Alert.alert("Thất bại", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToHistory = () => {
    setSuccessModalVisible(false);
    router.push("/(manager)/maintenancehistory" as any);
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

        {/* 2. CATEGORY SELECT (Riêng biệt) */}
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
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategoryId === cat.id && styles.chipActive,
                  ]}
                  onPress={() => handleSelectCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategoryId === cat.id && styles.chipTextActive,
                    ]}
                  >
                    {cat.name} ({cat.equipmentCount})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 3. SPECIFIC EQUIPMENT SELECT (Riêng biệt) */}
        {selectedCategoryId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Monitor size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>
                Chọn thiết bị ({selectedEquipmentIds.length} đã chọn)
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
                  const isSelected = selectedEquipmentIds.includes(eq.id);

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
                        <View>
                          <Text
                            style={[
                              styles.gridItemText,
                              isSelected && styles.gridItemTextActive,
                            ]}
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
          onOpenTemplate={() => setMsgModalVisible(true)}
        />

        {/* 6. SUBMIT BUTTON */}
        <MaintenanceSubmitButton
          onPress={handleSubmit}
          disabled={isSubmitting || selectedEquipmentIds.length === 0}
          isSubmitting={isSubmitting}
          label={`Xác nhận (${selectedEquipmentIds.length})`}
        />
      </ScrollView>

      {/* MODALS (Giữ nguyên) */}
      <SecurityMessagesModal
        visible={msgModalVisible}
        onClose={() => setMsgModalVisible(false)}
        onSelectMessage={(content) => {
          setDescription(content);
          setMsgModalVisible(false);
        }}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <CheckCircle2 size={48} color="#16A34A" />
            </View>
            <Text style={styles.modalTitle}>Thành công!</Text>
            <Text style={styles.modalMessage}>
              Đã tạo lịch bảo trì cho {selectedEquipmentIds.length} thiết bị.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={goToHistory}
              >
                <History size={18} color="white" />
                <Text style={styles.modalBtnPrimaryText}>Xem Lịch sử</Text>
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
  content: { padding: 16, paddingBottom: 100 },

  // Style riêng
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
  gridItemText: { fontSize: 14, color: "#334155", fontWeight: "500" },
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16A34A",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  modalBtnPrimary: {
    flex: 1.5,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "600", color: "white" },
});
