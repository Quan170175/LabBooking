import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  FlatList,
  ScrollView,
} from "react-native";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ShieldAlert,
  Check,
  Building2,
} from "lucide-react-native";

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

// --- TYPES ---
export type FilterOption = {
  label: string;
  value: string;
};

type FilterProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;

  filterStatus: string;
  onStatusChange: (val: string) => void;

  filterSeverity: string;
  onSeverityChange: (val: string) => void;

  labOptions?: FilterOption[];
  selectedLabId?: string;
  onLabChange?: (val: string) => void;
};

// --- DATA ---
const STATUS_OPTIONS = [
  { label: "Tất cả", value: "All" },
  { label: "Chưa xử lý", value: "Pending" },
  { label: "Đã xử lý", value: "Resolved" },
];

const SEVERITY_OPTIONS = [
  { label: "Tất cả", value: "All" },
  { label: "Cao", value: "High" },
  { label: "Vừa", value: "Medium" },
  { label: "Thấp", value: "Low" },
];

const IncidentFilterBar = ({
  selectedDate,
  onDateChange,
  filterStatus,
  onStatusChange,
  filterSeverity,
  onSeverityChange,
  labOptions = [],
  selectedLabId = "All",
  onLabChange,
}: FilterProps) => {
  const [activeModal, setActiveModal] = useState<
    "NONE" | "STATUS" | "SEVERITY"
  >("NONE");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate);

  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (date) onDateChange(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const confirmIOSDate = () => {
    onDateChange(tempDate);
    setShowDatePicker(false);
  };

  // Helper: Render Top Row Buttons
  const renderDropdownButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onPress: () => void,
    showArrow: boolean = true
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.btnBase,
          isActive ? styles.btnActive : styles.btnInactive,
        ]}
        onPress={onPress}
      >
        <View style={styles.btnContentWrapper}>
          {icon}
          <Text
            style={[
              styles.btnText,
              isActive ? styles.textActive : styles.textInactive,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
        {showArrow && (
          <ChevronDown
            size={12}
            color={isActive ? "#EA580C" : "#94A3B8"}
            style={{ marginLeft: 2 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Helper Labels
  const getSeverityLabel = () => {
    if (filterSeverity === "All") return "Mức độ";
    const found = SEVERITY_OPTIONS.find((o) => o.value === filterSeverity);
    return found ? found.label : "Mức độ";
  };

  const getStatusLabel = () => {
    if (filterStatus === "All") return "T.Thái";
    const found = STATUS_OPTIONS.find((o) => o.value === filterStatus);
    return found ? found.label : "T.Thái";
  };

  return (
    <View style={styles.container}>
      {/* ---------------- HÀNG 1: 3 NÚT LỌC CHÍNH ---------------- */}
      <View style={styles.topRow}>
        {/* 1. DATE */}
        {renderDropdownButton(
          formatDate(selectedDate),
          <CalendarIcon size={14} color="#64748B" style={{ marginRight: 4 }} />,
          false,
          () => {
            setTempDate(selectedDate);
            setShowDatePicker(true);
          },
          false
        )}

        {/* 2. SEVERITY */}
        {renderDropdownButton(
          getSeverityLabel(),
          <ShieldAlert
            size={14}
            color={filterSeverity !== "All" ? "#EA580C" : "#64748B"}
            style={{ marginRight: 4 }}
          />,
          filterSeverity !== "All",
          () => setActiveModal("SEVERITY")
        )}

        {/* 3. STATUS */}
        {renderDropdownButton(
          getStatusLabel(),
          <Filter
            size={14}
            color={filterStatus !== "All" ? "#EA580C" : "#64748B"}
            style={{ marginRight: 4 }}
          />,
          filterStatus !== "All",
          () => setActiveModal("STATUS")
        )}
      </View>

      {/* ---------------- HÀNG 2: THANH TRƯỢT CHỌN PHÒNG LAB ---------------- */}
      {onLabChange && labOptions.length > 0 && (
        <View style={styles.labRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.labScrollContent}
          >
            {labOptions.map((item) => {
              const isSelected = selectedLabId === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.labChip,
                    isSelected ? styles.labChipActive : styles.labChipInactive,
                  ]}
                  onPress={() => onLabChange(item.value)}
                >
                  {/* Icon Building nhỏ bên cạnh nếu thích */}
                  {item.value !== "All" && isSelected && (
                    <Building2
                      size={12}
                      color="white"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.labChipText,
                      isSelected
                        ? styles.labChipTextActive
                        : styles.labChipTextInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* --- DATE PICKER LOGIC --- */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {Platform.OS === "ios" && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.iosDatePickerContainer}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: "#64748B", fontSize: 16 }}>Hủy</Text>
                </TouchableOpacity>
                <Text style={{ fontWeight: "700", fontSize: 16 }}>
                  Chọn ngày
                </Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text
                    style={{
                      color: "#EA580C",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Xong
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={{ height: 120, width: "100%" }}
                locale="vi-VN"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* --- MODAL CHO STATUS & SEVERITY (Không còn Lab ở đây) --- */}
      <Modal
        visible={activeModal !== "NONE"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal("NONE")}
      >
        <TouchableWithoutFeedback onPress={() => setActiveModal("NONE")}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownHeaderTitle}>
                {activeModal === "SEVERITY" ? "Chọn mức độ" : "Chọn trạng thái"}
              </Text>
              <FlatList
                data={
                  activeModal === "STATUS" ? STATUS_OPTIONS : SEVERITY_OPTIONS
                }
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  let isSelected = false;
                  if (activeModal === "STATUS")
                    isSelected = filterStatus === item.value;
                  else if (activeModal === "SEVERITY")
                    isSelected = filterSeverity === item.value;

                  return (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        if (activeModal === "STATUS")
                          onStatusChange(item.value);
                        else if (activeModal === "SEVERITY")
                          onSeverityChange(item.value);
                        setActiveModal("NONE");
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Check size={18} color="#EA580C" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default IncidentFilterBar;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    flexDirection: "column", // Xếp chồng lên nhau
    gap: 12, // Khoảng cách giữa hàng trên và hàng dưới
  },

  // --- HÀNG 1: TOP ROW ---
  topRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  btnBase: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
  },
  btnInactive: { backgroundColor: "white", borderColor: "#E2E8F0" },
  btnActive: { backgroundColor: "#FFF7ED", borderColor: "#EA580C" },
  btnContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  btnText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  textInactive: { color: "#334155" },
  textActive: { color: "#EA580C" },

  // --- HÀNG 2: LAB ROW (Scroll Horizontal) ---
  labRow: {
    // Không paddingHorizontal ở đây để scroll tràn ra mép
  },
  labScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  labChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20, // Bo tròn kiểu Pill/Chip
    borderWidth: 1,
  },
  labChipInactive: {
    backgroundColor: "white",
    borderColor: "#E2E8F0",
  },
  labChipActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  labChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  labChipTextInactive: {
    color: "#475569",
  },
  labChipTextActive: {
    color: "white",
    fontWeight: "700",
  },

  // --- COMMON MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    width: "70%", // Nhỏ gọn hơn cho Status/Severity
    elevation: 5,
  },
  dropdownHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textAlign: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: { fontSize: 14, color: "#334155" },
  dropdownItemTextActive: { color: "#EA580C", fontWeight: "700" },

  iosDatePickerContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    padding: 16,
    alignItems: "center",
    elevation: 5,
  },
  iosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
});
