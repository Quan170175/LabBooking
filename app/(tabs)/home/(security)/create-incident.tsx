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
import { useRouter, useLocalSearchParams } from "expo-router";
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
}

interface Room {
  id: string;
  labName: string;
  equipments?: Equipment[];
}

interface PagedResponse<T> {
  items: T[];
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

const IMPORTANCE_LEVELS = ["Thấp", "Vừa", "Cao"];

const mapImportanceToApi = (level: string): string => {
  switch (level) {
    case "Cao":
      return "High";
    case "Vừa":
      return "Medium";
    case "Thấp":
      return "Low";
    default:
      return "Low";
  }
};

// main component
export default function CreateIncidentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Other");
  const [importance, setImportance] = useState<string>("Thấp");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Equipment logic
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

  const [linkedCheckId, setLinkedCheckId] = useState<string | null>(null);

  // lấy danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const response = await apiClient.get<PagedResponse<Room>>(
          "/api/LabRooms",
          { params: { PageNumber: 1, PageSize: 10 } }
        );
        const resData = response.data;
        if (resData && Array.isArray(resData.items)) {
          setRooms(resData.items);
        } else if (Array.isArray(resData)) {
          setRooms(resData as any);
        }
      } catch (error) {
        console.error("Lỗi lấy phòng:", error);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // --- 2. XỬ LÝ DỮ LIỆU TỪ MÀN HÌNH CHECK GỬI SANG ---
  useEffect(() => {
    // Nếu có ID phòng được gửi sang, tự động chọn luôn
    if (params.preSelectedRoomId) {
      const roomId = Array.isArray(params.preSelectedRoomId)
        ? params.preSelectedRoomId[0]
        : params.preSelectedRoomId;
      setSelectedRoomId(roomId);
    }

    // Nếu có ID Check Room, lưu lại để lát gửi kèm
    if (params.linkedCheckId) {
      const checkId = Array.isArray(params.linkedCheckId)
        ? params.linkedCheckId[0]
        : params.linkedCheckId;
      setLinkedCheckId(checkId);
      console.log("🔗 Linked with Check ID:", checkId);
    }

    // Nếu đến từ màn hình check, mặc định chọn loại Hỏng thiết bị
    if (params.isFromCheckRoom === "true") {
      setSelectedType("EquipmentFailure");
      if (!description) {
        setDescription("Sự cố được phát hiện trong quá trình kiểm tra phòng.");
      }
    }
  }, [params]);

  // logic load thiết bị
  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      setEquipments(room?.equipments || []);
      setSelectedEquipmentIds([]);
    } else {
      setEquipments([]);
    }
  }, [selectedRoomId, rooms]);

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isValid = selectedRoomId !== null && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const safeCheckId = Array.isArray(linkedCheckId)
        ? linkedCheckId[0]
        : linkedCheckId;

      const payload: any = {
        labRoomId: selectedRoomId,
        type: selectedType,
        importanceLevel: mapImportanceToApi(importance),
        description: description,
        fromRoomCheckId: safeCheckId || null,
      };

      if (
        selectedType === "EquipmentFailure" &&
        selectedEquipmentIds.length > 0
      ) {
        payload.equipmentIds = selectedEquipmentIds;
      }

      console.log("📤 Submitting Incident Payload:", payload);

      await apiClient.post("/api/Incidents", payload);

      setIsSuccessModalVisible(true);
    } catch (error: any) {
      console.error("❌ Error Create Incident:", error);

      const serverError =
        error.response?.data?.errors?.FromRoomCheckId?.[0] ||
        error.response?.data?.message ||
        "Có lỗi xảy ra khi tạo sự cố.";

      Alert.alert("Thất bại", serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    router.replace("/(tabs)/home/(security)/incident-history");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {linkedCheckId && (
            <View style={styles.linkAlert}>
              <CheckCircle2 size={16} color="#15803d" />
              <Text style={styles.linkAlertText}>
                Đang tạo báo cáo cho phiên kiểm tra vừa thực hiện.
              </Text>
            </View>
          )}

          {/* Chọn Phòng */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Vị trí / Phòng</Text>
            </View>
            {isLoadingRooms ? (
              <ActivityIndicator size="small" color="#EA580C" />
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
                    {selectedRoomId === room.id && (
                      <Check
                        size={14}
                        color="#EA580C"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Loại sự cố */}
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
                  onPress={() => setSelectedType(type.id)}
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

          {/* Chọn thiết bị (Optional) */}
          {selectedType === "EquipmentFailure" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Monitor size={18} color="#EA580C" />
                <Text style={styles.sectionTitle}>
                  Chọn thiết bị lỗi (Nếu có)
                </Text>
              </View>
              {equipments.length === 0 ? (
                <Text style={styles.hintText}>Không có dữ liệu thiết bị.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {equipments.map((eq) => (
                    <TouchableOpacity
                      key={eq.id}
                      style={[
                        styles.chip,
                        selectedEquipmentIds.includes(eq.id) &&
                          styles.chipActive,
                      ]}
                      onPress={() => toggleEquipment(eq.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedEquipmentIds.includes(eq.id) &&
                            styles.chipTextActive,
                        ]}
                      >
                        {eq.equipmentName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Mức độ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldAlert size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Mức độ nghiêm trọng</Text>
            </View>
            <View style={styles.levelContainer}>
              {IMPORTANCE_LEVELS.map((level) => {
                let color =
                  level === "Cao"
                    ? "#DC2626"
                    : level === "Vừa"
                    ? "#D97706"
                    : "#475569";
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      importance === level && {
                        borderColor: color,
                        backgroundColor: `${color}15`,
                      },
                    ]}
                    onPress={() => setImportance(level)}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        importance === level && {
                          color: color,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Mô tả */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Mô tả thêm về sự cố..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
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
              <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <SuccessIncidentModal
          visible={isSuccessModalVisible}
          onClose={handleSuccessModalClose}
          onViewHistory={() => {
            setIsSuccessModalVisible(false);
            router.replace("/(tabs)/home/(security)/incident-history");
          }}
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
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  backButton: { padding: 4 },
  content: { padding: 16, paddingBottom: 100 },

  // Style cho alert link check
  linkAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  linkAlertText: { fontSize: 13, color: "#166534", fontWeight: "500", flex: 1 },

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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
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
    alignItems: "center",
    justifyContent: "center",
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
