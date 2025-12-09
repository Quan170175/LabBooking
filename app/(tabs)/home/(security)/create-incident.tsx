// CreateIncidentScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  AlertTriangle,
  FileText,
  Check,
  Flame,
  Zap,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  HelpCircle,
  Monitor,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";
import SuccessIncidentModal from "../../../../components/common/SuccessModal";

// --- TYPES ---
interface Equipment {
  id: string;
  equipmentName: string;
  status?: string;
}

interface Room {
  id: string;
  labName: string;
  equipments?: Equipment[];
}

interface PagedResponse<T> {
  items: T[];
  totalPages: number;
  totalItemsCount: number;
  itemsFrom: number;
  itemsTo: number;
}

// --- CONFIG ---
const INCIDENT_TYPES = [
  { id: "Fire", label: "Cháy nổ", icon: <Flame size={18} color="#DC2626" /> },
  {
    id: "PowerOutage",
    label: "Cúp điện",
    icon: <Zap size={18} color="#D97706" />,
  },
  {
    id: "EquipmentFailure",
    label: "Hỏng thiết bị",
    icon: <AlertTriangle size={18} color="#EA580C" />,
  },
  {
    id: "SecurityIssue",
    label: "An ninh",
    icon: <ShieldAlert size={18} color="#7C3AED" />,
  },
  {
    id: "Opened",
    label: "Cửa mở",
    icon: <CheckCircle2 size={18} color="#16A34A" />,
  },
  {
    id: "Closed",
    label: "Cửa đóng",
    icon: <XCircle size={18} color="#475569" />,
  },
  {
    id: "Other",
    label: "Khác",
    icon: <HelpCircle size={18} color="#64748B" />,
  },
];

// Giá trị hiển thị tiếng Việt
const IMPORTANCE_LEVELS = ["Thấp", "Vừa", "Cao"];

// HÀM MỚI: CHUYỂN ĐỔI TIẾNG VIỆT SANG GIÁ TRỊ API MONG MUỐN
const mapImportanceToApi = (level: string): string => {
  switch (level) {
    case "Cao":
      return "High";
    case "Vừa":
      return "Medium";
    case "Thấp":
      return "Low";
    default:
      // Giá trị mặc định an toàn nếu có lỗi
      return "Low";
  }
};

// --- MAIN COMPONENT ---
export default function CreateIncidentScreen() {
  const router = useRouter();

  // --- STATE ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Other");
  const [importance, setImportance] = useState<string>("Thấp"); // Giá trị hiển thị tiếng Việt
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // STATE CHO THIẾT BỊ
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

  // --- EFFECT 1: LẤY DANH SÁCH PHÒNG ---
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const response = await apiClient.get<PagedResponse<Room>>(
          "/api/LabRooms",
          {
            params: { PageNumber: 1, PageSize: 10 },
          }
        );

        const resData = response.data;
        if (resData && Array.isArray(resData.items)) {
          setRooms(resData.items);
        } else if (Array.isArray(resData)) {
          setRooms(resData as any);
        } else {
          setRooms([]);
        }
      } catch (error: any) {
        console.error("❌ Lỗi lấy danh sách phòng:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách phòng.");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // --- EFFECT 2: LẤY THIẾT BỊ TỪ LOCAL ---
  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (room && room.equipments) {
        setEquipments(room.equipments);
      } else {
        setEquipments([]);
      }
      // Reset danh sách chọn khi đổi phòng
      setSelectedEquipmentIds([]);
    } else {
      setEquipments([]);
      setSelectedEquipmentIds([]);
    }
  }, [selectedRoomId, rooms]);

  // HÀM TOGGLE: Thêm/Bớt thiết bị khỏi mảng
  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // --- VALIDATION ---
  const isValid =
    selectedRoomId !== null &&
    description.trim().length > 0 &&
    (selectedType !== "EquipmentFailure" || selectedEquipmentIds.length > 0);

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    const apiImportanceLevel = mapImportanceToApi(importance);

    try {
      let payload: any = {
        labRoomId: selectedRoomId,
        type: selectedType,
        importanceLevel: apiImportanceLevel,
        description: description,
      };

      if (
        selectedType === "EquipmentFailure" &&
        selectedEquipmentIds.length > 0
      ) {
        // 🔥 GỬI MỘT REQUEST DUY NHẤT VỚI DANH SÁCH ID
        payload.equipmentIds = selectedEquipmentIds; // Thêm mảng IDs vào payload
        console.log("Submitting multiple equipment failure incident:", payload);
      } else {
        // Gửi 1 request duy nhất (cho các loại sự cố khác)
        // Trong trường hợp này, API có thể yêu cầu equipmentId là null hoặc không có.
        // Giả sử API tự xử lý nếu không có equipmentIds.
        console.log("Submitting single incident:", payload);
      }

      // 2. Gọi API tạo Incident
      await apiClient.post("/api/Incidents", payload);

      setIsSuccessModalVisible(true);
    } catch (error: any) {
      console.error("❌ Lỗi gửi API:", error);

      // LOGIC BẮT LỖI TỪ BE (ĐÃ CẬP NHẬT)
      let errorMsg = "Có lỗi xảy ra khi gửi báo cáo.";
      const responseData = error.response?.data;
      const status = error.response?.status;

      console.log(`[HTTP Status]: ${status}`);
      console.log("[Response Data]:", responseData);

      if (responseData) {
        // 1. Trường hợp lỗi Validation (errors object)
        if (responseData.errors) {
          const errorObj = responseData.errors;
          const errorList: string[] = [];

          // Duyệt qua từng key lỗi (ví dụ: 'Description', 'LabRoomId'...)
          Object.keys(errorObj).forEach((key) => {
            const messages = errorObj[key];
            if (Array.isArray(messages)) {
              messages.forEach((msg) => errorList.push(`• ${msg}`));
            }
          });

          if (errorList.length > 0) {
            // Hiển thị tối đa 5 lỗi
            errorMsg = errorList.slice(0, 5).join("\n");
            if (errorList.length > 5) {
              errorMsg += "\n(Và nhiều lỗi khác...)";
            }
          }
        }
        // 2. Trường hợp có message cụ thể
        else if (responseData.message) {
          errorMsg = responseData.message;
        }
        // 3. Trường hợp trả về string trực tiếp
        else if (typeof responseData === "string") {
          errorMsg = responseData;
        }
      } else if (error.message) {
        // Lỗi network hoặc client side
        errorMsg = error.message;
      }

      Alert.alert("Thất bại", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 HÀM MỚI: Xử lý khi bấm nút "Xem lịch sử"
  const handleViewHistory = () => {
    setIsSuccessModalVisible(false);
    // Giả sử đường dẫn đến trang lịch sử là "/incident-history"
    router.replace("/(tabs)/home/(security)/incident-history");
  };

  // 🟢 HÀM CŨ ĐÃ SỬA: Chỉ đóng modal, reset form và trở về trang trước
  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    // Xóa form và trở về trang trước
    setSelectedRoomId(null);
    setSelectedType("Other");
    setImportance("Thấp");
    setDescription("");
    setSelectedEquipmentIds([]);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo báo cáo sự cố</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. CHỌN PHÒNG */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Vị trí / Phòng</Text>
            </View>

            {isLoadingRooms ? (
              <ActivityIndicator
                size="small"
                color="#EA580C"
                style={{ padding: 10 }}
              />
            ) : rooms.length === 0 ? (
              <Text style={styles.hintText}>Không tìm thấy phòng nào.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.chip,
                      selectedRoomId === room.id && styles.chipActive,
                    ]}
                    onPress={() => setSelectedRoomId(room.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedRoomId === room.id && styles.chipTextActive,
                      ]}
                    >
                      {room.labName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* 2. LOẠI SỰ CỐ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Loại sự cố</Text>
            </View>
            <View style={styles.grid}>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    setSelectedType(type.id);
                    if (type.id !== "EquipmentFailure")
                      setSelectedEquipmentIds([]);
                  }}
                >
                  {type.icon}
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === type.id && styles.typeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. CHỌN THIẾT BỊ (MULTI-SELECT) */}
          {selectedType === "EquipmentFailure" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Monitor size={18} color="#EA580C" />
                <Text style={styles.sectionTitle}>
                  Chọn thiết bị lỗi ({selectedEquipmentIds.length})
                </Text>
              </View>

              {!selectedRoomId ? (
                <Text style={styles.hintText}>Vui lòng chọn phòng trước.</Text>
              ) : equipments.length === 0 ? (
                <Text style={styles.hintText}>
                  Không có thiết bị nào trong phòng này.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {equipments.map((eq) => {
                    const isSelected = selectedEquipmentIds.includes(eq.id);
                    return (
                      <TouchableOpacity
                        key={eq.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => toggleEquipment(eq.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {eq.equipmentName}
                        </Text>
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            color="#EA580C"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* 4. MỨC ĐỘ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldAlert size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Mức độ nghiêm trọng</Text>
            </View>
            <View style={styles.levelContainer}>
              {IMPORTANCE_LEVELS.map((level) => {
                let color = "#475569";
                if (level === "Cao") color = "#DC2626";
                if (level === "Vừa") color = "#D97706";
                const isActive = importance === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      isActive && {
                        borderColor: color,
                        backgroundColor: isActive ? `${color}15` : "white",
                      },
                    ]}
                    onPress={() => setImportance(level)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isActive && { borderColor: color },
                      ]}
                    >
                      {isActive && (
                        <View
                          style={[styles.radioDot, { backgroundColor: color }]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.levelText,
                        isActive && { color: color, fontWeight: "700" },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. MÔ TẢ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Vui lòng mô tả chi tiết sự cố..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            disabled={isSubmitting || !isValid}
            style={[
              styles.submitButton,
              (!isValid || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Check size={20} color={isValid ? "white" : "#94A3B8"} />
                <Text
                  style={[
                    styles.submitButtonText,
                    !isValid && { color: "#94A3B8" },
                  ]}
                >
                  Gửi báo cáo
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* 🟢 MODAL COMPONENT RIÊNG */}
        <SuccessIncidentModal
          visible={isSuccessModalVisible}
          onClose={handleSuccessModalClose}
          onViewHistory={handleViewHistory}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7ED" },
  container: { flex: 1 },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#FFF7ED", borderColor: "#EA580C" },
  chipText: { fontSize: 14, color: "#64748B" },
  chipTextActive: { color: "#EA580C", fontWeight: "600" },

  hintText: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    gap: 6,
  },
  typeCardActive: { borderColor: "#EA580C", backgroundColor: "#FFF7ED" },
  typeText: { fontSize: 12, color: "#64748B", textAlign: "center" },
  typeTextActive: { color: "#EA580C", fontWeight: "600" },

  levelContainer: { flexDirection: "row", gap: 12 },
  levelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  levelText: { fontSize: 14, color: "#64748B" },

  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    height: 120,
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
  },

  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#E2E8F0",
    shadowColor: "transparent",
    elevation: 0,
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
