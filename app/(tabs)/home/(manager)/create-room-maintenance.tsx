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
  // const [msgModalVisible, setMsgModalVisible] = useState(false); // (Nếu không dùng có thể bỏ)

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
        <Text style={styles.headerTitle}>Tạo lịch bảo trì</Text>
        <Text style={styles.headerSub}>
          Lên kế hoạch bảo trì cho phòng Lab của bạn
        </Text>
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
      <SuccessMaintenanceModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        onViewHistory={goToHistory}
        message={`Lịch bảo trì phòng ${
          labInfo?.labName || ""
        } đã được tạo thành công.`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },

  // Navigation Bar
  navBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginLeft: -4, // Căn lề trái sát hơn một chút
  },

  // Header Section (Giống Support Screen)
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFF7ED",
  },
  headerTitle: {
    fontSize: 24, // To hơn
    fontWeight: "800",
    color: "#0F172A",
    paddingTop: 20,
  },
  headerSub: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  content: { padding: 16, paddingBottom: 100 },
});
