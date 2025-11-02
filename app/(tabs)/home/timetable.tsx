import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";

// --- Dữ liệu giả lập (Lấy từ các file trước) ---
// (Bạn nên đưa SLOTS vào file constants chung)
const SLOTS = [
  { id: "slot1", label: "Slot 1" },
  { id: "slot2", label: "Slot 2" },
  { id: "slot3", label: "Slot 3" },
  { id: "slot4", label: "Slot 4" },
];
const weekdays_short = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const getMonday = (d: Date) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};
// --------------------

export default function TimetableScreen() {
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // State để lưu *tất cả* booking
  const [allBookings, setAllBookings] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // 1. Tải TẤT CẢ booking một lần
  useEffect(() => {
    const loadAllBookings = async () => {
      setIsLoading(true);
      try {
        const storedBookings = await AsyncStorage.getItem("bookings");
        const bookings = storedBookings ? JSON.parse(storedBookings) : [];
        setAllBookings(Array.isArray(bookings) ? bookings : []);
      } catch (e) {
        console.error("Lỗi khi đọc bookings:", e);
        Alert.alert("Lỗi", "Không thể tải dữ liệu lịch đặt.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAllBookings();
  }, []);

  // --- THAY ĐỔI: Gộp tất cả slot đã đặt vào MỘT Set ---
  const allUnavailableSlots = useMemo(() => {
    const newUnavailableSlots = new Set<string>();

    // Lặp qua tất cả booking của tất cả các phòng
    allBookings.forEach((b: any) => {
      (b.slots || []).forEach((s: any) => {
        // Chỉ lưu date::slotId, không quan tâm phòng nào
        newUnavailableSlots.add(`${s.date}::${s.slotId}`);
      });
    });

    return newUnavailableSlots;
  }, [allBookings]); // Tính toán lại khi booking thay đổi

  // 3. Cập nhật ngày trong tuần khi đổi tuần
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(currentMonday);
      newDate.setDate(currentMonday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
  }, [currentMonday]);

  // 4. Hàm điều hướng tuần
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  if (isLoading || weekDates.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  const startDate = weekDates[0];
  const endDate = weekDates[6];
  const dateRange = `${startDate.getDate()}/${
    startDate.getMonth() + 1
  } - ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Thời khóa biểu" }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thời khóa biểu chung</Text>
        <Text style={styles.subtitle}>
          Xem tình trạng slot đã được đặt (tại bất kỳ phòng nào)
        </Text>
      </View>

      {/* --- LỊCH (CALENDAR) --- */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
          <ChevronRight size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {/* --- THAY ĐỔI: Chỉ render MỘT lịch duy nhất --- */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekdaysHeader}>
          {weekDates.map((date, dayIndex) => (
            <View key={date.toISOString()} style={styles.dayHeader}>
              <Text style={styles.dayNameText}>{weekdays_short[dayIndex]}</Text>
              <Text style={styles.dateNumText}>{date.getDate()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.slotsGrid}>
          {weekDates.map((date) => (
            <View key={date.toISOString()} style={styles.dayColumn}>
              {SLOTS.map((slot) => {
                const dateString = date.toISOString().split("T")[0];
                // Kiểm tra trong Set tổng
                const isBooked = allUnavailableSlots.has(
                  `${dateString}::${slot.id}`
                );

                const slotStyle = isBooked
                  ? styles.unavailableSlot
                  : styles.availableSlot;

                let textStyle: StyleProp<TextStyle> = [styles.slotLabel];
                if (isBooked) {
                  textStyle.push(styles.unavailableSlotText);
                }

                return (
                  <View key={slot.id} style={[styles.slotButton, slotStyle]}>
                    <Text style={textStyle}>{slot.label}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      {/* ------------------------------------------- */}

      {/* --- CHÚ THÍCH (LEGEND) --- */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSlot]} />
          <Text style={styles.legendText}>Còn trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSlot]} />
          <Text style={styles.legendText}>Đã đặt (ít nhất 1 phòng)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },
  header: {
    marginBottom: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  navButton: {
    padding: 8,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  weekdaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  dateNumText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  slotsGrid: { flexDirection: "row", gap: 8 },
  dayColumn: { flex: 1, gap: 8 },
  slotButton: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  unavailableSlot: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  unavailableSlotText: { color: "#94A3B8" },
  legend: {
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  legendItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  legendText: { fontSize: 13, color: "#475569" },
});
