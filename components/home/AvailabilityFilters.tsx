import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Calendar, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SLOTS } from "../../utils/bookingUtils";

type Props = {
  selectedDate: Date;
  selectedSlot: string;
  setSelectedDate: (date: Date) => void;
  setSelectedSlot: (slot: string) => void;
};

export default function AvailabilityFilters({
  selectedDate,
  selectedSlot,
  setSelectedDate,
  setSelectedSlot,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

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

  // Sử dụng label + time từ SLOTS mới
  const selectedSlotLabel =
    SLOTS.find((s) => s.id === selectedSlot)?.label || SLOTS[0].label;

  return (
    <>
      <View style={styles.filterContainer}>
        {/* Date Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Chọn ngày</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={16} color="#EA580C" />
            <Text style={styles.dropdownText}>
              {selectedDate.toLocaleDateString("vi-VN")}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Slot Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Chọn slot</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSlotPicker(true)}
          >
            <Text style={[styles.dropdownText, { flex: 1 }]}>
              {selectedSlotLabel}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Date Picker Modals --- */}
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

      {/* --- Slot Picker Modal --- */}
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
          <View style={styles.modalContent}>
            {Platform.OS === "ios" && (
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn slot</Text>
                <TouchableOpacity onPress={() => setShowSlotPicker(false)}>
                  <Text style={styles.modalButtonText}>Xong</Text>
                </TouchableOpacity>
              </View>
            )}
            <Picker
              selectedValue={selectedSlot}
              onValueChange={(itemValue) => setSelectedSlot(itemValue)}
              style={styles.modalPicker}
              itemStyle={styles.modalPickerItem}
            >
              {/* Hiển thị label và time từ SLOTS mới */}
              {SLOTS.map((s) => (
                <Picker.Item
                  key={s.id}
                  label={`${s.label} (${s.time})`}
                  value={s.id}
                />
              ))}
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FFE8DA",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
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
  modalPicker: {
    width: "100%",
    height: 220,
    backgroundColor: "white",
    paddingBottom: 32,
  },
  modalPickerItem: {
    fontSize: 20,
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
});
