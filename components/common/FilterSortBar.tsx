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
} from "react-native";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Check,
  X,
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
  // Date
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;

  // Sort
  sortDirection: "Ascending" | "Descending";
  onSortChange: (val: "Ascending" | "Descending") => void;

  // Status
  filterStatus: string;
  onStatusChange: (val: string) => void;
  statusOptions: FilterOption[];
  isStatusDisabled?: boolean;
};

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "Descending" },
  { label: "Cũ nhất", value: "Ascending" },
];

const FilterSortBar = ({
  selectedDate,
  onDateChange,
  sortDirection,
  onSortChange,
  filterStatus,
  onStatusChange,
  statusOptions,
  isStatusDisabled = false,
}: FilterProps) => {
  const [activeModal, setActiveModal] = useState<"NONE" | "STATUS" | "SORT">(
    "NONE"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(selectedDate || new Date());

  // --- HELPER FUNCTIONS ---
  const formatDate = (date: Date | null) => {
    if (!date) return "Chọn ngày";
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getSortLabel = () =>
    SORT_OPTIONS.find((o) => o.value === sortDirection)?.label || "Sắp xếp";

  const getStatusLabel = () => {
    if (!filterStatus) return "Tất cả"; // Mặc định là Tất cả (bao gồm Accepted/Rejected)
    const found = statusOptions.find((o) => o.value === filterStatus);
    return found ? found.label : "Trạng thái";
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (date) onDateChange(date);
    } else if (date) {
      setTempDate(date);
    }
  };

  // --- LOGIC LỌC DỮ LIỆU DROPDOWN ---
  // Hàm này đảm bảo khi mở Modal chọn Status, "Pending" sẽ bị loại bỏ hoàn toàn
  const getDropdownData = () => {
    if (activeModal === "SORT") return SORT_OPTIONS;

    if (activeModal === "STATUS") {
      // Chỉ giữ lại: Tất cả (value=""), Accepted, Rejected.
      // Loại bỏ status "Pending" hoặc "Chờ duyệt" khỏi danh sách hiển thị
      return statusOptions.filter((opt) => opt.value !== "Pending");
    }

    return [];
  };

  // --- RENDER BUTTON ---
  const renderDropdownButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onPress: () => void,
    disabled: boolean = false,
    onClear?: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.btnBase,
        isActive ? styles.btnActive : styles.btnInactive,
        disabled && styles.btnDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.btnContentWrapper}>
        {icon}
        <Text
          style={[
            styles.btnText,
            isActive ? styles.textActive : styles.textInactive,
            disabled && styles.textDisabled,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      {isActive && onClear ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={14} color="#EF4444" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      ) : (
        !disabled && (
          <ChevronDown
            size={12}
            color={isActive ? "#EA580C" : "#94A3B8"}
            style={{ marginLeft: 4 }}
          />
        )
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* 1. Date */}
        {renderDropdownButton(
          formatDate(selectedDate),
          <CalendarIcon
            size={14}
            color={selectedDate ? "#EA580C" : "#64748B"}
            style={{ marginRight: 6 }}
          />,
          !!selectedDate,
          () => {
            setTempDate(selectedDate || new Date());
            setShowDatePicker(true);
          },
          false,
          selectedDate ? () => onDateChange(null) : undefined
        )}

        {/* 2. Sort */}
        {renderDropdownButton(
          getSortLabel(),
          <ArrowUpDown
            size={14}
            color={sortDirection === "Descending" ? "#64748B" : "#EA580C"}
            style={{ marginRight: 6 }}
          />,
          sortDirection === "Ascending",
          () => setActiveModal("SORT")
        )}

        {/* 3. Status */}
        {renderDropdownButton(
          getStatusLabel(),
          <Filter
            size={14}
            color={!isStatusDisabled && filterStatus ? "#EA580C" : "#64748B"}
            style={{ marginRight: 6 }}
          />,
          !isStatusDisabled && !!filterStatus,
          () => setActiveModal("STATUS"),
          isStatusDisabled
        )}
      </View>

      {/* --- MODALS --- */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
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
                <TouchableOpacity
                  onPress={() => {
                    onDateChange(tempDate);
                    setShowDatePicker(false);
                  }}
                >
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
              />
            </View>
          </View>
        </Modal>
      )}

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
                {activeModal === "SORT"
                  ? "Sắp xếp theo thời gian"
                  : "Chọn trạng thái"}
              </Text>

              {/* SỬ DỤNG HÀM getDropdownData ĐỂ LỌC DỮ LIỆU */}
              <FlatList
                data={getDropdownData()}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  let isSelected = false;
                  if (activeModal === "STATUS")
                    isSelected = filterStatus === item.value;
                  else if (activeModal === "SORT")
                    isSelected = sortDirection === item.value;

                  return (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        if (activeModal === "STATUS")
                          onStatusChange(item.value);
                        else if (activeModal === "SORT")
                          onSortChange(item.value as any);
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

export default FilterSortBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  topRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8 },

  btnBase: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  btnInactive: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
  btnActive: { backgroundColor: "#FFFFFF", borderColor: "#EA580C" },
  btnDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },

  btnContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  btnText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  textInactive: { color: "#334155" },
  textActive: { color: "#EA580C" },
  textDisabled: { color: "#94A3B8" },

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
    width: "75%",
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
