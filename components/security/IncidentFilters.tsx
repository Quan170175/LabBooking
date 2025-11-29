import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Filter,
  ShieldAlert,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// --- TYPES (Export để dùng lại ở màn hình chính) ---
export type IncidentSeverity = "Low" | "Medium" | "High";
export type FilterSeverityType = IncidentSeverity | "All";
export type FilterStatusType = "Resolved" | "Pending" | "All";

// --- PROPS ---
interface IncidentFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;

  filterSeverity: FilterSeverityType;
  onSeverityChange: (val: FilterSeverityType) => void;

  filterStatus: FilterStatusType;
  onStatusChange: (val: FilterStatusType) => void;
}

export default function IncidentFilters({
  selectedDate,
  onDateChange,
  filterSeverity,
  onSeverityChange,
  filterStatus,
  onStatusChange,
}: IncidentFiltersProps) {
  // Local State: Chỉ dùng để quản lý việc ẩn/hiện Modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // --- HANDLERS ---
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) onDateChange(date);
  };

  // --- RENDER MODAL HELPER ---
  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: string }[],
    onSelect: (val: any) => void,
    currentValue: string
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.modalOption,
                currentValue === opt.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  currentValue === opt.value && styles.modalOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
              {currentValue === opt.value && (
                <CheckCircle size={16} color="#EA580C" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.filterBar}>
      {/* 1. Date Filter */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={16} color="#64748B" />
        <Text style={styles.filterText}>
          {selectedDate.toLocaleDateString("vi-VN")}
        </Text>
      </TouchableOpacity>

      {/* 2. Severity Filter */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterSeverity !== "All" && styles.filterButtonActive,
        ]}
        onPress={() => setShowSeverityModal(true)}
      >
        <ShieldAlert
          size={16}
          color={filterSeverity !== "All" ? "#EA580C" : "#64748B"}
        />
        <Text
          style={[
            styles.filterText,
            filterSeverity !== "All" && styles.filterTextActive,
          ]}
        >
          {filterSeverity === "All" ? "Mức độ" : filterSeverity}
        </Text>
        <ChevronDown
          size={14}
          color={filterSeverity !== "All" ? "#EA580C" : "#64748B"}
        />
      </TouchableOpacity>

      {/* 3. Status Filter */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus !== "All" && styles.filterButtonActive,
        ]}
        onPress={() => setShowStatusModal(true)}
      >
        <Filter
          size={16}
          color={filterStatus !== "All" ? "#EA580C" : "#64748B"}
        />
        <Text
          style={[
            styles.filterText,
            filterStatus !== "All" && styles.filterTextActive,
          ]}
        >
          {filterStatus === "All"
            ? "Trạng thái"
            : filterStatus === "Resolved"
            ? "Đã xử lý"
            : "Chưa xử lý"}
        </Text>
        <ChevronDown
          size={14}
          color={filterStatus !== "All" ? "#EA580C" : "#64748B"}
        />
      </TouchableOpacity>

      {/* --- MODALS --- */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {renderDropdownModal(
        showSeverityModal,
        () => setShowSeverityModal(false),
        "Chọn mức độ nghiêm trọng",
        [
          { label: "Tất cả", value: "All" },
          { label: "Rất nghiêm trọng (High)", value: "High" },
          { label: "Nghiêm trọng (Medium)", value: "Medium" },
          { label: "Cảnh báo (Low)", value: "Low" },
        ],
        onSeverityChange,
        filterSeverity
      )}

      {renderDropdownModal(
        showStatusModal,
        () => setShowStatusModal(false),
        "Chọn trạng thái xử lý",
        [
          { label: "Tất cả", value: "All" },
          { label: "Đã xử lý", value: "Resolved" },
          { label: "Chưa xử lý", value: "Pending" },
        ],
        onStatusChange,
        filterStatus
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Filter Bar Styles
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF7ED",
    gap: 8,
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#FFEDD5",
    borderColor: "#EA580C",
  },
  filterText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#EA580C",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0F172A",
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalOptionSelected: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#475569",
  },
  modalOptionTextSelected: {
    color: "#EA580C",
    fontWeight: "600",
  },
});
