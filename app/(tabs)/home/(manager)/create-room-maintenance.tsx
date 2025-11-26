import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  FileText,
  Wrench,
  User,
  Building2,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// 🟢 1. IMPORT API CLIENT
import apiClient from "../../../../utils/api";

// --- TYPES ---
// Cấu trúc response của API /api/Managers/profile
interface ManagedLab {
  id: string;
  labName: string;
  location: string;
}

interface ManagerProfileResponse {
  id: string;
  userName: string;
  email: string;
  managedLabs: ManagedLab[];
}

export default function CreateMaintenanceScreen() {
  const router = useRouter();

  // --- STATE ---
  // Lưu thông tin lấy từ API Profile
  const [labInfo, setLabInfo] = useState<{
    id: string;
    labName: string;
    location: string;
    managerName: string;
  } | null>(null);

  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Time State
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000)); // Mặc định +1 tiếng
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  // --- 🟢 2. CALL API LẤY THÔNG TIN PHÒNG & MANAGER ---
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingRoom(true);
      try {
        console.log("Fetching Manager Profile...");
        const response = await apiClient.get<ManagerProfileResponse>(
          "/api/Managers/profile"
        );
        const data = response.data;

        // Kiểm tra xem Manager có quản lý phòng nào không
        if (data.managedLabs && data.managedLabs.length > 0) {
          // Lấy phòng đầu tiên (theo logic 1 manager - 1 phòng)
          const myLab = data.managedLabs[0];

          setLabInfo({
            id: myLab.id,
            labName: myLab.labName,
            location: myLab.location,
            managerName: data.userName,
          });
        } else {
          Alert.alert(
            "Thông báo",
            "Tài khoản của bạn chưa được gán quản lý phòng Lab nào."
          );
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin phòng:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin phòng lab.");
      } finally {
        setIsLoadingRoom(false);
      }
    };

    fetchProfile();
  }, []);

  // --- HANDLERS ---
  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Nếu ngày bắt đầu lớn hơn ngày kết thúc, tự đẩy ngày kết thúc lên
      if (selectedDate > endDate) {
        setEndDate(new Date(selectedDate.getTime() + 3600 * 1000));
      }
    }
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const showMode = (currentMode: "date" | "time", type: "start" | "end") => {
    setMode(currentMode);
    if (type === "start") setShowStartPicker(true);
    else setShowEndPicker(true);
  };

  const formatDateTime = (date: Date) => {
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} - ${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // --- 🟢 3. CALL API TẠO BẢO TRÌ (POST) ---
  const handleSubmit = async () => {
    if (!labInfo?.id || !description.trim()) return;

    setIsSubmitting(true);

    try {
      // Payload theo đúng cấu trúc JSON bạn cung cấp
      const payload = {
        labRoomId: labInfo.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        description: description,
      };

      console.log("Submitting Payload:", payload);

      // Gọi API POST
      await apiClient.post("/api/RoomMaintainSchedules", payload);

      Alert.alert("Thành công", "Đã lên lịch bảo trì phòng thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Create Maintain Error:", error);
      const msg =
        error.response?.data?.message ||
        "Không thể tạo lịch bảo trì. Vui lòng thử lại.";
      Alert.alert("Thất bại", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra điều kiện để enable nút submit
  const isValid = labInfo?.id && description.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảo trì Phòng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. THÔNG TIN PHÒNG & QUẢN LÝ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          </View>

          {isLoadingRoom ? (
            <ActivityIndicator
              size="small"
              color="#EA580C"
              style={{ padding: 20 }}
            />
          ) : (
            <View style={styles.roomInfoContainer}>
              {/* Tên Phòng */}
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Building2 size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Phòng Lab</Text>
                  <Text style={styles.infoValue}>
                    {labInfo?.labName || "Chưa có tên"}
                  </Text>
                </View>
              </View>

              {/* Location (Thêm mới theo yêu cầu) */}
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <View style={styles.iconBox}>
                  <MapPin size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Địa điểm</Text>
                  <Text style={styles.infoValue}>
                    {labInfo?.location || "Chưa cập nhật vị trí"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Tên Quản lý */}
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
                  <User size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Quản lý phụ trách</Text>
                  <Text style={styles.infoValue}>
                    {labInfo?.managerName || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 2. THỜI GIAN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Thời gian bảo trì</Text>
          </View>

          {/* Bắt đầu */}
          <View style={styles.dateTimeLabelRow}>
            <Text style={styles.subLabel}>Bắt đầu:</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Text style={styles.dateTimeValue}>
              {formatDateTime(startDate)}
            </Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => showMode("date", "start")}
              >
                <Text style={styles.pickerBtnText}>Ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => showMode("time", "start")}
              >
                <Text style={styles.pickerBtnText}>Giờ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kết thúc */}
          <View style={[styles.dateTimeLabelRow, { marginTop: 12 }]}>
            <Text style={styles.subLabel}>Kết thúc:</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Text style={styles.dateTimeValue}>{formatDateTime(endDate)}</Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => showMode("date", "end")}
              >
                <Text style={styles.pickerBtnText}>Ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => showMode("time", "end")}
              >
                <Text style={styles.pickerBtnText}>Giờ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode={mode}
              is24Hour={true}
              display="default"
              onChange={onChangeStart}
              minimumDate={new Date()}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode={mode}
              is24Hour={true}
              display="default"
              onChange={onChangeEnd}
              minimumDate={startDate}
            />
          )}
        </View>

        {/* 3. MÔ TẢ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Nội dung</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Nhập lý do bảo trì..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* NÚT BẤM */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Wrench size={20} color="white" />
              <Text style={styles.submitButtonText}>Xác nhận Bảo trì</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
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

  // --- STYLES CHO THÔNG TIN PHÒNG ---
  roomInfoContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
    marginLeft: 52,
  },
  // --------------------------------------

  // Date Time Styles
  dateTimeLabelRow: { marginBottom: 4 },
  subLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateTimeValue: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  pickerButtons: { flexDirection: "row", gap: 8 },
  pickerBtn: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EA580C",
  },
  pickerBtnText: { color: "#EA580C", fontWeight: "600", fontSize: 12 },

  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    height: 100,
    backgroundColor: "#F8FAFC",
  },

  // Button Styles
  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
