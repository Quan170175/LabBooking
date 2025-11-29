import React, { useState } from "react";
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
} from "lucide-react-native";

// --- MOCK DATA ---
const MOCK_ROOMS = [
  { id: "lab1", name: "Lab A101" },
  { id: "lab2", name: "Lab B202" },
  { id: "lab3", name: "Lab C303" },
  { id: "hall", name: "Hội trường A" },
];

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

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Other");
  const [importance, setImportance] = useState<string>("Low");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- VALIDATION ---
  const isValid = selectedRoomId !== null && description.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const payload = {
      LabRoomId: selectedRoomId,
      ReportedById: "current-user-id",
      Type: selectedType,
      Description: description,
      IsResolved: false,
      CreatedAt: new Date().toISOString(),
      ImportanceLevel: importance,
    };

    console.log("Submitting Incident:", payload);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Báo cáo thành công",
        "Sự cố đã được ghi nhận vào hệ thống.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* HEADER ĐÃ SỬA: Cùng màu nền, bỏ border */}
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
          {/* SECTION: VỊ TRÍ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#EA580C" />
              <Text style={styles.sectionTitle}>Vị trí / Phòng</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.roomScroll}
            >
              {MOCK_ROOMS.map((room) => (
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
                    {room.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SECTION: LOẠI SỰ CỐ */}
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

          {/* SECTION: MỨC ĐỘ */}
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

          {/* SECTION: MÔ TẢ */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🔥 MÀU NỀN MỚI
  safeArea: { flex: 1, backgroundColor: "#FFF7ED" },
  container: { flex: 1 },

  // 🔥 HEADER MỚI
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF7ED", // Cùng màu nền
    // Bỏ border
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  backButton: { padding: 4 },

  content: { padding: 16, paddingBottom: 100 },

  // SECTION (Card màu trắng nổi trên nền kem)
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

  // Styles con giữ nguyên
  roomScroll: { flexDirection: "row" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FFF7ED", borderColor: "#EA580C" },
  chipText: { fontSize: 14, color: "#64748B" },
  chipTextActive: { color: "#EA580C", fontWeight: "600" },

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
