// CreateMaintenanceScreen.tsx (Đã được chỉnh sửa)

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import apiClient from "../../../../utils/api";
// 🔥 IMPORT MODAL CHUNG MỚI
import SuccessMaintenanceModal from "../../../../components/manager/maintenance/SuccessMaintenanceModal";

// 🔥 Component Chung
import RoomInfoSection from "../../../../components/manager/maintenance/RoomInfoSection";
import MaintenanceTimeSection from "../../../../components/manager/maintenance/MaintenanceTimeSection";
import MaintenanceDescriptionSection from "../../../../components/manager/maintenance/MaintenanceDescriptionSection";
import MaintenanceSubmitButton from "../../../../components/manager/maintenance/MaintenanceSubmitButton";

interface ManagerProfileResponse {
  id: string;
  userName: string;
  managedLabs: { id: string; labName: string; location: string }[];
}

export default function CreateMaintenanceScreen() {
  const router = useRouter();

  // State
  const [labInfo, setLabInfo] = useState<{
    id: string;
    labName: string;
    location: string;
    managerName: string;
  } | null>(null);

  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));

  // Modal State
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [msgModalVisible, setMsgModalVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingRoom(true);
      try {
        const response = await apiClient.get<ManagerProfileResponse>(
          "/api/Managers/lab-details"
        );
        const data = response.data;
        if (data.managedLabs && data.managedLabs.length > 0) {
          const myLab = data.managedLabs[0];
          setLabInfo({
            id: myLab.id,
            labName: myLab.labName,
            location: myLab.location,
            managerName: data.userName,
          });
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setIsLoadingRoom(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSelectMessage = (content: string) => {
    setDescription(content);
    setMsgModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!labInfo?.id || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        labRoomId: labInfo.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        description: description,
      };
      await apiClient.post("/api/RoomMaintainSchedules", payload);
      setSuccessModalVisible(true);
      setDescription("");
    } catch (error: any) {
      Alert.alert("Thất bại", error.response?.data?.message || "Lỗi hệ thống.");
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
  };

  const isValid = labInfo?.id && description.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo trì Phòng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RoomInfoSection
          isLoading={isLoadingRoom}
          labName={labInfo?.labName}
          location={labInfo?.location}
          managerName={labInfo?.managerName}
        />

        <MaintenanceTimeSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <MaintenanceDescriptionSection
          description={description}
          onChangeText={setDescription}
        />

        <MaintenanceSubmitButton
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          isSubmitting={isSubmitting}
        />
      </ScrollView>

      {/* --- MODALS --- */}

      {/* 2. 🔥 Modal Thành công MỚI */}
      <SuccessMaintenanceModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        onViewHistory={goToHistory}
        // Thông báo cố định cho Bảo trì Phòng
        message={`Lịch bảo trì phòng ${
          labInfo?.labName || ""
        } đã được tạo thành công.`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🔥 Giữ lại toàn bộ styles (trừ Modal styles đã bị xóa/chuyển qua file mới)
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

  // 🔥 Xóa toàn bộ Modal Styles cũ vì đã chuyển qua SuccessMaintenanceModal.tsx
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
