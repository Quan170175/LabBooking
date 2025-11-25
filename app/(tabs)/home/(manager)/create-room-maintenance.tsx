import React, { useState } from "react";
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
  Clock,
  FileText,
  Wrench,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Mock Data
const MOCK_ROOMS = [
  { id: "lab1", name: "Lab A101" },
  { id: "lab2", name: "Lab B202" },
  { id: "lab3", name: "Lab C303" },
  { id: "hall", name: "Hội trường A" },
];

export default function CreateMaintenanceScreen() {
  const router = useRouter();

  // --- STATE ---
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Time State
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  // --- HANDLERS ---
  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
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

  const handleSubmit = () => {
    if (!selectedRoomId || !description.trim()) return;

    setIsSubmitting(true);

    // Fake API Call
    const payload = {
      LabRoomId: selectedRoomId,
      StartTime: startDate.toISOString(),
      EndTime: endDate.toISOString(),
      RoomMaintainStatus: 1,
      Description: description,
    };
    console.log("Submitting:", payload);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Thành công", "Đã lên lịch bảo trì phòng.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 1000);
  };

  // Kiểm tra điều kiện để enable nút submit
  const isValid = selectedRoomId && description.trim().length > 0;

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
        {/* 1. CHỌN PHÒNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Chọn phòng</Text>
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

        {/* 2. THỜI GIAN (GIAO DIỆN MỚI) */}
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

        {/* NÚT BẤM (Disable logic) */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isValid && styles.submitButtonDisabled, // Style xám khi chưa nhập đủ
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting} // Disable chức năng bấm
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

  // Room Chips
  horizontalScroll: { flexDirection: "row" },
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

  // Date Time Styles (Updated)
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
  }, // Màu xám
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
