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
  Monitor,
  Calendar,
  FileText,
  Wrench,
  MapPin,
  Building2,
  User,
  AlertCircle,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// --- MOCK DATA (Giả lập trả về từ API) ---
const MOCK_MY_DEVICES = [
  { id: "eq1", name: "Máy chiếu Sony 4K" },
  { id: "eq2", name: "PC Giảng viên (Dell)" },
  { id: "eq3", name: "Hệ thống âm thanh" },
  { id: "eq4", name: "Máy in 3D Creality" },
  { id: "eq5", name: "Oscilloscope (Dao động ký)" },
];

export default function CreateEquipmentMaintenanceScreen() {
  const router = useRouter();

  // --- STATE ---
  // 1. Thông tin phòng (Tự động lấy)
  const [roomInfo, setRoomInfo] = useState<{
    id: string;
    labName: string;
    managerName: string;
  } | null>(null);

  // 2. Danh sách thiết bị của phòng đó
  const [equipments, setEquipments] = useState<any[]>([]);

  // 3. Thiết bị được chọn để bảo trì
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Time State
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  // --- EFFECT: LẤY DATA KHI MỞ MÀN HÌNH ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Giả lập gọi API lấy thông tin phòng và thiết bị của Manager
      setTimeout(() => {
        // 1. Set thông tin phòng
        setRoomInfo({
          id: "lab-a301-unique-id",
          labName: "Phòng Lab AI & IoT (A301)",
          managerName: "Nguyễn Văn Quản Lý",
        });

        // 2. Set danh sách thiết bị thuộc phòng này
        setEquipments(MOCK_MY_DEVICES);

        setIsLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

  // --- HANDLERS DATE/TIME ---
  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > endDate)
        setEndDate(new Date(selectedDate.getTime() + 3600 * 1000));
    }
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
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

  // --- SUBMIT ---
  const handleSubmit = () => {
    if (!roomInfo?.id || !selectedEqId || !description.trim()) return;

    setIsSubmitting(true);

    // API Payload giả lập
    const payload = {
      LabRoomId: roomInfo.id, // ID phòng tự động
      EquipmentId: selectedEqId, // ID thiết bị chọn
      StartTime: startDate.toISOString(),
      EndTime: endDate.toISOString(),
      Status: 1, // 1 = Maintain
      Description: description,
    };

    console.log("Submitting:", payload);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Thành công", "Đã lên lịch bảo trì thiết bị.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảo trì thiết bị</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content} // Đã có paddingBottom: 100
        showsVerticalScrollIndicator={false}
      >
        {/* 1. THÔNG TIN PHÒNG (Cố định) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          </View>

          {isLoading ? (
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
                  <MapPin size={20} color="#EA580C" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Phòng Lab</Text>
                  <Text style={styles.infoValue}>{roomInfo?.labName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Tên Quản lý */}
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
                  <User size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Quản lý phụ trách</Text>
                  <Text style={styles.infoValue}>{roomInfo?.managerName}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 2. CHỌN THIẾT BỊ (Của phòng đó) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Monitor size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Chọn Thiết bị cần sửa</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="small"
              color="#EA580C"
              style={{ padding: 10 }}
            />
          ) : equipments.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertCircle size={20} color="#64748B" />
              <Text style={styles.emptyText}>
                Phòng này chưa có thiết bị nào.
              </Text>
            </View>
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
                    selectedEqId === eq.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedEqId(eq.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedEqId === eq.id && styles.chipTextActive,
                    ]}
                  >
                    {eq.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 3. THỜI GIAN */}
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

        {/* 4. MÔ TẢ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Nội dung</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Mô tả lỗi của thiết bị..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* NÚT SUBMIT (Disable nếu chưa chọn thiết bị) */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedEqId || !description || isLoading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedEqId || isLoading}
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

  // 🟢 ĐÃ TĂNG PADDING BOTTOM
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

  // --- STYLES THÔNG TIN PHÒNG ---
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
  // ------------------------------

  // Chips (Thiết bị)
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

  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    gap: 8,
  },
  emptyText: { fontSize: 13, color: "#94A3B8", textAlign: "center" },

  // Date Time
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

  // Input
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    height: 100,
    backgroundColor: "#F8FAFC",
  },

  // Button
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
  submitButtonDisabled: { backgroundColor: "#CBD5E1", shadowOpacity: 0 },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
