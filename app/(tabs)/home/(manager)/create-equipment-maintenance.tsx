import React, { useState, useMemo } from "react";
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
  Clock,
  FileText,
  Wrench,
  MapPin, // Icon cho Phòng
  AlertCircle,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// --- 1. MOCK DATA ---
const MOCK_ROOMS = [
  { id: "lab1", name: "Lab A101" },
  { id: "lab2", name: "Lab B202" },
  { id: "lab3", name: "Lab C303" },
];

const MOCK_EQUIPMENTS = [
  { id: "eq1", name: "Máy chiếu Sony", roomId: "lab1" },
  { id: "eq2", name: "PC Giảng viên", roomId: "lab1" },
  { id: "eq3", name: "Loa treo tường", roomId: "lab1" },
  { id: "eq4", name: "Điều hòa 01", roomId: "lab2" },
  { id: "eq5", name: "Điều hòa 02", roomId: "lab2" },
  { id: "eq6", name: "Máy in 3D", roomId: "lab3" },
  { id: "eq7", name: "Robot Arm", roomId: "lab3" },
];

export default function CreateEquipmentMaintenanceScreen() {
  const router = useRouter();

  // --- STATE ---
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Time State
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  // --- LOGIC LỌC THIẾT BỊ THEO PHÒNG ---
  const availableEquipments = useMemo(() => {
    if (!selectedRoomId) return [];
    return MOCK_EQUIPMENTS.filter((eq) => eq.roomId === selectedRoomId);
  }, [selectedRoomId]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedEqId(null); // Reset thiết bị khi đổi phòng
  };

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
    if (!selectedRoomId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn phòng trước.");
      return;
    }
    if (!selectedEqId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn thiết bị cần bảo trì.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung bảo trì.");
      return;
    }

    setIsSubmitting(true);

    // API Payload giả lập
    const payload = {
      EquipmentId: selectedEqId,
      LabRoomId: selectedRoomId, // Gửi thêm ID phòng nếu BE cần
      StartTime: startDate.toISOString(),
      EndTime: endDate.toISOString(),
      Status: 1,
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BƯỚC 1: CHỌN PHÒNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Bước 1: Chọn Phòng</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {MOCK_ROOMS.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.chip,
                  selectedRoomId === room.id && styles.chipActive,
                ]}
                onPress={() => handleSelectRoom(room.id)}
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

        {/* 2. BƯỚC 2: CHỌN THIẾT BỊ (Chỉ hiện khi đã chọn phòng) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Monitor size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Bước 2: Chọn Thiết bị</Text>
          </View>

          {!selectedRoomId ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Vui lòng chọn phòng ở trên để xem danh sách thiết bị.
              </Text>
            </View>
          ) : availableEquipments.length === 0 ? (
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
              {availableEquipments.map((eq) => (
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

          {/* DateTime Pickers */}
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
            placeholder="Nhập tình trạng hư hỏng..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* NÚT SUBMIT (Nằm trong ScrollView) */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedEqId || !description) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedEqId}
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
  content: { padding: 16, paddingBottom: 50 },

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

  // Chips (Dùng chung cho Room & Equipment)
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

  // Empty State cho thiết bị
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
