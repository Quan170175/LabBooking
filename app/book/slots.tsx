import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  // --- THAY ĐỔI: Thêm StyleProp và TextStyle ---
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";

// ... (Dữ liệu giả lập và hàm hỗ trợ giữ nguyên) ...
const ROOMS: any = {
  lab1: { id: "lab1", name: "Phòng Lab A101", desc: "30 máy tính, 3 máy chủ" },
  lab2: {
    id: "lab2",
    name: "Phòng Lab B202",
    desc: "20 máy tính, thiết bị mạng",
  },
};
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

export default function BookSlots() {
  const router = useRouter();
  const { type = "project", roomId } = useLocalSearchParams();
  const isRecurring = type === "teaching_recurring";
  const isFlexibleTeaching = type === "teaching_flexible";
  const isProject = type === "project";
  const isPriority = type === "priority";

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [baseSlots, setBaseSlots] = useState<
    { dayIndex: number; slotId: string }[]
  >([]);
  const [numWeeks, setNumWeeks] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; slotId: string; isConflict: boolean }[]
  >([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  const room =
    roomId && typeof roomId === "string" && ROOMS[roomId]
      ? ROOMS[roomId]
      : null;

  // ... (Tất cả logic và hàm giữ nguyên) ...
  const maxSlotsTotal = useMemo(() => {
    if (isFlexibleTeaching) return 20;
    if (isProject) return 5;
    if (isRecurring) return 20;
    if (isPriority) return 4;
    return 5;
  }, [isFlexibleTeaching, isProject, isRecurring, isPriority]);

  const maxWeeksAllowed = useMemo(() => {
    if (!isRecurring || baseSlots.length === 0) return 0;
    return Math.floor(maxSlotsTotal / baseSlots.length);
  }, [baseSlots, isRecurring, maxSlotsTotal]);

  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(currentMonday);
      newDate.setDate(currentMonday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
    if (isRecurring) {
      setBaseSlots([]);
      setNumWeeks(1);
      setSelectedSlots([]);
    }
  }, [currentMonday, isRecurring]);

  useEffect(() => {
    if (!room) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin phòng.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setIsLoading(false);
      return;
    }
    const loadBookedSlots = async () => {
      setIsLoading(true);
      try {
        const storedBookings = await AsyncStorage.getItem("bookings");
        const bookings = storedBookings ? JSON.parse(storedBookings) : [];
        const newUnavailableSlots = new Set<string>();
        bookings.forEach((b: any) => {
          if (b.roomId !== roomId) return;
          (b.slots || []).forEach((s: any) => {
            newUnavailableSlots.add(`${s.date}::${s.slotId}`);
          });
        });
        setUnavailableSlots(newUnavailableSlots);
      } catch (e) {
        console.error("Lỗi khi đọc bookings:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookedSlots();
  }, [roomId, room, router]);

  useEffect(() => {
    if (!isRecurring) return;
    if (baseSlots.length === 0) {
      setSelectedSlots([]);
      return;
    }
    const newSelectedSlots: {
      date: string;
      slotId: string;
      isConflict: boolean;
    }[] = [];
    const firstMonday = currentMonday;
    for (let week = 0; week < numWeeks; week++) {
      for (const baseSlot of baseSlots) {
        const targetDate = new Date(firstMonday);
        targetDate.setDate(
          firstMonday.getDate() + week * 7 + baseSlot.dayIndex
        );
        const dateString = targetDate.toISOString().split("T")[0];
        const fullSlotKey = `${dateString}::${baseSlot.slotId}`;
        const isConflict = unavailableSlots.has(fullSlotKey);

        if (isConflict) {
          Alert.alert(
            "Lịch bị trùng",
            `Slot ${
              SLOTS.find((s) => s.id === baseSlot.slotId)?.label
            } vào ngày ${targetDate.toLocaleDateString("vi-VN")} (Tuần ${
              week + 1
            }) đã bị đặt.
            
Số tuần sẽ được reset về 1.`
          );
          setNumWeeks(1);
          return;
        }
        newSelectedSlots.push({
          date: dateString,
          slotId: baseSlot.slotId,
          isConflict: false,
        });
      }
    }
    setSelectedSlots(newSelectedSlots);
  }, [baseSlots, numWeeks, currentMonday, unavailableSlots, isRecurring]);

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

  const toggleMultiSlot = (date: Date, slotId: string) => {
    const dateString = date.toISOString().split("T")[0];
    const isBooked = unavailableSlots.has(`${dateString}::${slotId}`);

    if (isBooked && !isPriority) {
      Alert.alert(
        "Lịch đã bị đặt",
        "Slot này đã có người đặt, bạn không thể chọn."
      );
      return;
    }

    const exists = selectedSlots.find(
      (s) => s.date === dateString && s.slotId === slotId
    );
    if (exists) {
      setSelectedSlots(
        selectedSlots.filter(
          (s) => !(s.date === dateString && s.slotId === slotId)
        )
      );
    } else {
      if (selectedSlots.length >= maxSlotsTotal) {
        Alert.alert(
          "Đã đạt giới hạn",
          `Bạn chỉ có thể chọn tối đa ${maxSlotsTotal} slot.`
        );
        return;
      }
      setSelectedSlots([
        ...selectedSlots,
        { date: dateString, slotId, isConflict: isBooked },
      ]);
    }
  };

  const toggleRecurringSlot = (dayIndex: number, slotId: string) => {
    const newBaseSlots = [...baseSlots];
    const slotIndex = newBaseSlots.findIndex(
      (s) => s.dayIndex === dayIndex && s.slotId === slotId
    );
    if (slotIndex > -1) {
      newBaseSlots.splice(slotIndex, 1);
    } else {
      newBaseSlots.push({ dayIndex, slotId });
    }
    if (newBaseSlots.length > 0) {
      const newMaxWeeks = Math.floor(maxSlotsTotal / newBaseSlots.length);
      if (numWeeks > newMaxWeeks) {
        setNumWeeks(newMaxWeeks);
      }
    } else {
      setNumWeeks(1);
    }
    setBaseSlots(newBaseSlots);
  };

  const handleChangeNumWeeks = (newWeekValue: number) => {
    if (baseSlots.length === 0) return;
    const clampedWeeks = Math.max(1, Math.min(newWeekValue, maxWeeksAllowed));
    setNumWeeks(clampedWeeks);
  };

  const handleToggleSlot = (date: Date, slotId: string, dayIndex: number) => {
    if (isRecurring) {
      toggleRecurringSlot(dayIndex, slotId);
    } else {
      toggleMultiSlot(date, slotId);
    }
  };

  const goToDevices = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert("Chưa chọn slot", "Vui lòng chọn ít nhất một giờ học.");
      return;
    }
    try {
      const currentString = await AsyncStorage.getItem("currentBooking");
      const currentBooking = currentString ? JSON.parse(currentString) : {};
      const updated = { ...currentBooking, slots: selectedSlots };
      await AsyncStorage.setItem("currentBooking", JSON.stringify(updated));
      router.push("/book/devices" as any);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
    }
  };

  const selectionInfo = useMemo(() => {
    if (isRecurring) {
      if (baseSlots.length === 0) {
        return "Chưa chọn slot";
      }
      return (
        <>
          <Text style={{ fontWeight: "bold" }}>{baseSlots.length}</Text>{" "}
          slot/tuần.
          {"\n"}
          Tổng:{" "}
          <Text style={{ fontWeight: "bold" }}>
            {selectedSlots.length}
          </Text> / {maxSlotsTotal} slots
        </>
      );
    }
    return (
      <>
        Đã chọn:{" "}
        <Text style={{ fontWeight: "bold" }}>{selectedSlots.length}</Text> /{" "}
        {maxSlotsTotal} slot
      </>
    );
  }, [isRecurring, selectedSlots.length, baseSlots.length, maxSlotsTotal]);

  if (isLoading || weekDates.length === 0 || !room) {
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

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2V5"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 2V5"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 9.09H20.5"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={2} />
      <BookingPageHeader
        icon={headerIcon}
        title={room.name}
        subtitle={room.desc}
      />
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
          <ChevronRight size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

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
          {weekDates.map((date, dayIndex) => (
            <View key={date.toISOString()} style={styles.dayColumn}>
              {SLOTS.map((slot) => {
                const dateString = date.toISOString().split("T")[0];
                const isBooked = unavailableSlots.has(
                  `${dateString}::${slot.id}`
                );

                const isSelected = isRecurring
                  ? baseSlots.some(
                      (s) => s.dayIndex === dayIndex && s.slotId === slot.id
                    )
                  : selectedSlots.some(
                      (s) => s.date === dateString && s.slotId === slot.id
                    );

                let slotStyle = styles.availableSlot;
                if (isSelected) {
                  slotStyle = styles.selectedSlot;
                } else if (isBooked) {
                  slotStyle = isPriority
                    ? styles.conflictSlot
                    : styles.unavailableSlot;
                }

                // --- THAY ĐỔI: Sửa lỗi TypeScript ---
                // Khởi tạo textStyle VỚI KIỂU DỮ LIỆU TƯỜNG MINH
                let textStyle: StyleProp<TextStyle> = [styles.slotLabel];

                // Thêm các style
                if (isSelected) {
                  textStyle.push(styles.selectedSlotText);
                } else if (isBooked && !isPriority) {
                  textStyle.push(styles.unavailableSlotText);
                } else if (isBooked && isPriority) {
                  textStyle.push(styles.conflictSlotText);
                }
                // ------------------------------------

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => handleToggleSlot(date, slot.id, dayIndex)}
                    disabled={isBooked && !isPriority}
                    style={[styles.slotButton, slotStyle]}
                  >
                    <Text style={textStyle}>{slot.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSlot]} />
          <Text style={styles.legendText}>Có thể chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSlot]} />
          <Text style={styles.legendText}>Đang chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSlot]} />
          <Text style={styles.legendText}>Đã được đặt</Text>
        </View>
        {isPriority && (
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.conflictSlot]} />
            <Text style={styles.legendText}>Trùng lịch</Text>
          </View>
        )}
      </View>

      {isRecurring && (
        <View style={styles.weekSelectorContainer}>
          <Text style={styles.weekSelectorLabel}>Số tuần lặp lại:</Text>
          <View style={styles.weekSelectorControls}>
            <TouchableOpacity
              onPress={() => handleChangeNumWeeks(numWeeks - 1)}
              disabled={numWeeks <= 1 || baseSlots.length === 0}
              style={[
                styles.weekNavButton,
                (numWeeks <= 1 || baseSlots.length === 0) &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.weekNavText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.weekCountText}>
              <Text style={{ fontWeight: "bold" }}>{numWeeks}</Text>
              {maxWeeksAllowed > 0 ? ` / ${maxWeeksAllowed}` : ""} tuần
            </Text>
            <TouchableOpacity
              onPress={() => handleChangeNumWeeks(numWeeks + 1)}
              disabled={numWeeks >= maxWeeksAllowed || baseSlots.length === 0}
              style={[
                styles.weekNavButton,
                (numWeeks >= maxWeeksAllowed || baseSlots.length === 0) &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.weekNavText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.selectionText}>{selectionInfo}</Text>
        <BookingButton
          label="Tiếp theo"
          onPress={goToDevices}
          disabled={selectedSlots.length === 0}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (tất cả styles khác giữ nguyên) ...
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
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
  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  unavailableSlot: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  conflictSlot: { backgroundColor: "#FFFBEB", borderColor: "#FBBF24" },

  // Style chữ cơ sở
  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },

  // Các style ghi đè (chỉ chứa các thuộc tính thay đổi)
  selectedSlotText: { color: "#fff" },
  unavailableSlotText: { color: "#94A3B8" },
  conflictSlotText: { color: "#B45309", fontWeight: "600" },

  legend: {
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
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
  weekSelectorContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekSelectorLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
  weekSelectorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weekNavButton: {
    width: 32,
    height: 32,
    backgroundColor: "#FFEDD5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  weekNavText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#EA580C",
  },
  weekCountText: {
    fontSize: 15,
    color: "#0F172A",
  },
  disabledButton: {
    backgroundColor: "#F1F5F9",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: { fontSize: 14, color: "#64748B", flex: 1 },
});
