import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, ChevronDown, Clock } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🟢 CẬP NHẬT INTERFACE THEO API MỚI
interface Slot {
  id: string;
  label: string; // Dùng label thay vì slotName
  startTime?: string;
  endTime?: string;
  slotIndex?: number;
}

type Props = {
  selectedDate: Date;
  selectedSlot: string;
  setSelectedDate: (date: Date) => void;
  setSelectedSlot: (slotId: string) => void;
  slots: Slot[];
};

export default function AvailabilityFilters({
  selectedDate,
  selectedSlot,
  setSelectedDate,
  setSelectedSlot,
  slots = [], // Mặc định là mảng rỗng để tránh crash
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  // --- LOGIC XỬ LÝ DATE ---
  const onChangeDate = (
    event: DateTimePickerEvent,
    newDate: Date | undefined
  ) => {
    const currentDate = newDate || selectedDate;
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" || Platform.OS === "ios") {
      if (newDate) {
        setSelectedDate(currentDate);
      }
    }
  };

  // --- LOGIC HIỂN THỊ TÊN SLOT ---
  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return "";
    return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
  };

  const getSlotLabel = (slot: Slot) => {
    const start = formatTime(slot.startTime);
    const end = formatTime(slot.endTime);
    // 🟢 Dùng slot.label ở đây
    if (start && end) {
      return `${slot.label} (${start} - ${end})`;
    }
    return slot.label;
  };

  // 🟢 LOGIC AN TOÀN (Safe Checks)
  const safeSlots = slots || [];
  const currentSlot = safeSlots.find((s) => s.id === selectedSlot);

  const displaySlotLabel = currentSlot
    ? getSlotLabel(currentSlot)
    : safeSlots.length > 0
    ? "Chọn slot"
    : "Đang tải slot...";

  return (
    <>
      <View style={styles.filterContainer}>
        {/* === 1. DATE PICKER DROPDOWN === */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Chọn ngày</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={16} color="#EA580C" />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {selectedDate.toLocaleDateString("vi-VN")}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* === 2. SLOT PICKER DROPDOWN === */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Chọn slot</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSlotPicker(true)}
          >
            <Clock size={16} color="#EA580C" />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {displaySlotLabel}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MODAL DATE PICKER --- */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      {Platform.OS === "ios" && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setShowDatePicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn ngày</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonText}>Xong</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerIOSWrapper}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onChangeDate}
                  style={styles.datePickerIOS}
                  locale="vi-VN"
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* --- MODAL SLOT LIST (POPUP) --- */}
      <Modal
        visible={showSlotPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSlotPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowSlotPicker(false)}
        >
          <View style={[styles.modalContent, { maxHeight: "50%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khung giờ</Text>
              <TouchableOpacity onPress={() => setShowSlotPicker(false)}>
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {safeSlots.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    marginTop: 20,
                  }}
                >
                  Đang tải danh sách slot...
                </Text>
              ) : (
                safeSlots.map((slot) => {
                  const isSelected = slot.id === selectedSlot;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotItem,
                        isSelected && styles.slotItemActive,
                      ]}
                      onPress={() => {
                        setSelectedSlot(slot.id);
                        setShowSlotPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.slotItemText,
                          isSelected && styles.slotItemTextActive,
                        ]}
                      >
                        {getSlotLabel(slot)}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#EA580C" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalButtonText: {
    color: "#EA580C",
    fontSize: 16,
    fontWeight: "700",
  },
  datePickerIOSWrapper: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "white",
    paddingBottom: 32,
  },
  datePickerIOS: {
    height: 220,
    backgroundColor: "white",
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  slotItemActive: {
    backgroundColor: "#FFFAF5",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  slotItemText: {
    fontSize: 15,
    color: "#334155",
  },
  slotItemTextActive: {
    color: "#EA580C",
    fontWeight: "700",
  },
});
