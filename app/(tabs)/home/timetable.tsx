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

// --- IMPORT COMPONENT MỚI ---
// (Hãy đảm bảo đường dẫn này đúng với nơi bạn tạo file SlotTimeInfo.tsx)
import SlotTimeInfo from "../../../components/home/SlotTimeInfo";

// --- CẤU HÌNH CỐ ĐỊNH ---
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

// -------------------------

export default function TimetableScreen() {
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load data
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

  // 2. Tính toán slot đã đặt (Gộp tất cả các phòng lại để xem tổng quan)
  const allUnavailableSlots = useMemo(() => {
    const newUnavailableSlots = new Set<string>();
    allBookings.forEach((b: any) => {
      // Nếu booking bị từ chối hoặc hủy thì không tính là unavailable
      if (b.status === "rejected" || b.status === "cancelled") return;

      (b.slots || []).forEach((s: any) => {
        newUnavailableSlots.add(`${s.date}::${s.slotId}`);
      });
    });
    return newUnavailableSlots;
  }, [allBookings]);

  // 3. Xử lý lịch tuần
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(currentMonday);
      newDate.setDate(currentMonday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
  }, [currentMonday]);

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
          Xem tình trạng slot của toàn bộ hệ thống
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
          <ChevronRight size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
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
                // Sửa lỗi timezone bằng hàm format date local (giống các file khác)
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const dateString = `${year}-${month}-${day}`;

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

      {/* --- PHẦN 1: CHÚ THÍCH MÀU SẮC --- */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSlot]} />
          <Text style={styles.legendText}>Còn trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSlot]} />
          <Text style={styles.legendText}>Đã được đặt</Text>
        </View>
      </View>

      {/* --- PHẦN 2: KHUNG GIỜ HOẠT ĐỘNG (COMPONENT TÁI SỬ DỤNG) --- */}
      <View style={styles.infoSection}>
        <SlotTimeInfo />
      </View>
    </ScrollView>
  );
}

// --- Styles (Đã xóa các style thừa) ---
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
    marginTop: 8,
  },
  title: {
    fontSize: 22,
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
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  navButton: { padding: 8 },
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
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  dateNumText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  slotsGrid: { flexDirection: "row", gap: 6 },
  dayColumn: { flex: 1, gap: 6 },
  slotButton: {
    width: "100%",
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  unavailableSlot: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  slotLabel: { fontSize: 11, fontWeight: "500", color: "#0F172A" },
  unavailableSlotText: { color: "#CBD5E1" },

  // --- STYLES CHO LEGEND ---
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: { fontSize: 13, color: "#475569" },

  // --- STYLES CHO CONTAINER CHỨA INFO ---
  infoSection: {
    marginTop: 12,
    // Không cần style nền/border ở đây nữa vì component con đã tự lo
  },
});
