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

// --- Dữ liệu giả lập phòng (Lấy từ API thực tế) ---
const MOCK_ROOMS = [
  { id: "lab1", name: "Lab A101" },
  { id: "lab2", name: "Lab B202" },
  { id: "lab3", name: "Lab C303" },
  { id: "hall", name: "Hội trường A" },
];

// --- Định nghĩa Enum ---
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

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("Other");
  const [importance, setImportance] = useState<string>("Low");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRoomId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn phòng xảy ra sự cố.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mô tả sự cố.");
      return;
    }

    setIsSubmitting(true);

    // --- MAPPING DỮ LIỆU (Chuẩn bị gửi xuống Backend) ---
    const payload = {
      // Id: Backend tự sinh hoặc dùng thư viện uuid ở đây
      LabRoomId: selectedRoomId,
      ReportedById: "current-user-id", // Lấy từ Token đăng nhập
      SlotId: null, // Có thể logic lấy slot hiện tại
      Type: selectedType,
      Description: description,
      IsResolved: false,
      CreatedAt: new Date().toISOString(),
      ImportanceLevel: importance,
    };

    console.log("Submitting Incident:", payload);

    // Giả lập API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Báo cáo thành công",
        "Sự cố đã được ghi nhận vào hệ thống.",
        [
          { text: "OK", onPress: () => router.back() }, // Quay lại trang History
        ]
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Chọn Phòng */}
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

        {/* 2. Loại sự cố */}
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

        {/* 3. Mức độ nghiêm trọng */}
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
                    }, // 15 is alpha hex
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

        {/* 4. Mô tả */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Mô tả chi tiết vấn đề..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Check size={20} color="white" />
              <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 24,
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

  // Room Chips
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

  // Incident Types Grid
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

  // Importance Level
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

  // Description
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    height: 120,
    backgroundColor: "#F8FAFC",
  },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
