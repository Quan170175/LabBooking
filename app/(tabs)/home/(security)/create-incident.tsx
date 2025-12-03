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
  Modal,
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

const IMPORTANCE_LEVELS = ["Low", "Medium", "High"];

export default function CreateIncidentScreen() {
  const router = useRouter();

  // --- STATE ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Other");
  const [importance, setImportance] = useState<string>("Low");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // STATE CHO THIẾT BỊ
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  // 🟢 THAY ĐỔI 1: State lưu mảng ID thay vì 1 chuỗi ID
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

  // --- EFFECT 1: LẤY DANH SÁCH PHÒNG ---
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        console.log("🚀 [REQUEST] Đang gọi API lấy phòng...");
        const response = await apiClient.get<PagedResponse<Room>>(
          "/api/LabRooms",
          {
            params: {
              PageNumber: 1,
              PageSize: 10,
            },
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
      // 🟢 Reset danh sách chọn khi đổi phòng
      setSelectedEquipmentIds([]);
    } else {
      setEquipments([]);
      setSelectedEquipmentIds([]);
    }
  }, [selectedRoomId, rooms]);

  // 🟢 HÀM TOGGLE: Thêm/Bớt thiết bị khỏi mảng
  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(id)) {
        // Nếu đã có -> Bỏ ra
        return prev.filter((item) => item !== id);
      } else {
        // Nếu chưa có -> Thêm vào
        return [...prev, id];
      }
    });
  };

  // --- VALIDATION ---
  const isValid =
    selectedRoomId !== null &&
    description.trim().length > 0 &&
    // Nếu là lỗi thiết bị thì mảng phải có ít nhất 1 phần tử
    (selectedType !== "EquipmentFailure" || selectedEquipmentIds.length > 0);

  // --- SUBMIT ---
  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      // 🟢 LOGIC GỬI MỚI: Xử lý việc API chỉ nhận 1 ID nhưng UI chọn nhiều
      if (
        selectedType === "EquipmentFailure" &&
        selectedEquipmentIds.length > 0
      ) {
        // Nếu chọn nhiều thiết bị -> Tạo nhiều request gửi song song
        const requests = selectedEquipmentIds.map((eqId) => {
          return apiClient.post("/api/Incidents", {
            labRoomId: selectedRoomId,
            type: selectedType,
            importanceLevel: importance,
            description: description,
            equipmentId: eqId, // Gửi đúng trường API yêu cầu
          });
        });

        console.log(`Đang gửi ${requests.length} báo cáo...`);
        await Promise.all(requests);
      } else {
        // Các loại lỗi khác (Cháy, Nổ...) -> Gửi 1 lần
        const payload = {
          labRoomId: selectedRoomId,
          type: selectedType,
          importanceLevel: importance,
          description: description,
          equipmentId: null,
        };

        console.log("Submitting single incident:", payload);
        await apiClient.post("/api/Incidents", payload);
      }

      // Hiện modal thành công
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      console.error("❌ Lỗi gửi API:", error);

      // --- 🟢 BẮT LỖI CHI TIẾT (THEO YÊU CẦU) ---
      let errorMsg = "Có lỗi xảy ra khi gửi báo cáo.";

      if (error.response && error.response.data) {
        // Ưu tiên 1: Lấy message trực tiếp từ backend trả về
        if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        // Ưu tiên 2: Nếu là lỗi Validation của .NET (nằm trong errors)
        else if (error.response.data.errors) {
          // Lấy lỗi đầu tiên trong object errors
          const errorData = error.response.data.errors;
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey]) {
            // Ví dụ: "equipmentId: The field equipmentId is invalid."
            errorMsg = `${firstKey}: ${
              Array.isArray(errorData[firstKey])
                ? errorData[firstKey][0]
                : errorData[firstKey]
            }`;
          }
        }
        // Ưu tiên 3: Nếu data trả về là string
        else if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      Alert.alert("Thất bại", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
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
                    // 🟢 Kiểm tra xem ID có trong mảng đã chọn không
                    const isSelected = selectedEquipmentIds.includes(eq.id);
                    return (
                      <TouchableOpacity
                        key={eq.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive, // Active nếu nằm trong mảng
                        ]}
                        // 🟢 Gọi hàm toggle thay vì set trực tiếp
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
                        {/* Thêm icon check nhỏ nếu được chọn */}
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
                if (level === "High") color = "#DC2626";
                if (level === "Medium") color = "#D97706";
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

        {/* MODAL THÀNH CÔNG */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSuccessModalVisible}
          onRequestClose={handleSuccessModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalIconWrapper}>
                <Check size={32} color="#16A34A" strokeWidth={3} />
              </View>
              <Text style={styles.modalTitle}>Thành công!</Text>
              <Text style={styles.modalMessage}>
                Báo cáo sự cố đã được gửi.
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity onPress={handleSuccessModalClose}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: "row", // Để icon check nằm ngang text
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: "100%",
    alignItems: "flex-end",
  },
  modalButtonText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
