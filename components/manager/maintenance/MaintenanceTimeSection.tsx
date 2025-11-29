import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Calendar, History } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface TimeSectionProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export default function MaintenanceTimeSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: TimeSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [currentField, setCurrentField] = useState<"start" | "end">("start");

  const formatDateTime = (date: Date) => {
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} - ${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const openPicker = (field: "start" | "end", mode: "date" | "time") => {
    setCurrentField(field);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);

    if (selectedDate) {
      if (currentField === "start") {
        onStartDateChange(selectedDate);
      } else {
        onEndDateChange(selectedDate);
      }
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Calendar size={18} color="#EA580C" />
        <Text style={styles.sectionTitle}>Thời gian bảo trì</Text>
      </View>

      {/* Start Time */}
      <View style={styles.dateTimeRow}>
        <Text style={styles.subLabel}>Bắt đầu:</Text>
        <View style={styles.rightContent}>
          <Text style={styles.dateTimeValue}>{formatDateTime(startDate)}</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openPicker("start", "date")}
          >
            <Calendar size={16} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openPicker("start", "time")}
          >
            <History size={16} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* End Time */}
      <View style={styles.dateTimeRow}>
        <Text style={styles.subLabel}>Kết thúc:</Text>
        <View style={styles.rightContent}>
          <Text style={styles.dateTimeValue}>{formatDateTime(endDate)}</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openPicker("end", "date")}
          >
            <Calendar size={16} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openPicker("end", "time")}
          >
            <History size={16} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={currentField === "start" ? startDate : endDate}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={currentField === "end" ? startDate : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  subLabel: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  rightContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateTimeValue: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  iconBtn: {
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
});
