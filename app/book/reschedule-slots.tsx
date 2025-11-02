import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Path, Svg } from "react-native-svg";
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

// --- Dữ liệu giả lập (Lấy từ slots.tsx) ---
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

export default function RescheduleSlotsScreen() {
  const router = useRouter();

  // Lấy params cho việc đổi lịch
  const {
    roomId,
    roomName,
    slotsToPick: slotsToPickParam,
    bookingId, // ID của booking gốc cần cập nhật
  } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    slotsToPick: string;
    bookingId: string;
  }>();

  // Số slot chính xác người dùng phải chọn
  const maxSlots = parseInt(slotsToPickParam || "1", 10);

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; slotId: string }[]
  >([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load các slot đã bị đặt
  useEffect(() => {
    if (!roomId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin phòng.", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
  }, [roomId, router]);

  // Set ngày trong tuần
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

  // Logic chọn slot
  const toggleSlot = (date: Date, slotId: string) => {
    const dateString = date.toISOString().split("T")[0];
    if (unavailableSlots.has(`${dateString}::${slotId}`)) return;

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
      if (selectedSlots.length >= maxSlots) {
        Alert.alert(
          "Đã đạt giới hạn",
          `Bạn chỉ được chọn lại đúng ${maxSlots} slot đã bị mất.`
        );
        return;
      }
      setSelectedSlots([...selectedSlots, { date: dateString, slotId }]);
    }
  };

  // Logic Submit
  const handleSubmitReschedule = async () => {
    if (selectedSlots.length !== maxSlots) {
      Alert.alert(
        "Chưa chọn đủ slot",
        `Vui lòng chọn chính xác ${maxSlots} slot để thay thế.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingsString = await AsyncStorage.getItem("bookings");
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];

      const rescheduleRequest = {
        id: `resch-${Date.now()}`,
        type: "reschedule_request",
        status: "pending",
        roomId,
        roomName,
        slots: selectedSlots,
        originalBookingId: bookingId,
        createdAt: new Date().toISOString(),
      };

      bookings.push(rescheduleRequest);
      await AsyncStorage.setItem("bookings", JSON.stringify(bookings));

      Alert.alert(
        "Gửi yêu cầu thành công",
        "Yêu cầu đổi lịch của bạn đã được gửi đến quản lý để duyệt.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/notifications" as any),
          },
        ]
      );
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu đổi lịch:", error);
      Alert.alert("Lỗi", "Không thể gửi yêu cầu. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  const selectionInfo = useMemo(() => {
    return (
      <>
        Đã chọn:{" "}
        <Text style={{ fontWeight: "bold" }}>{selectedSlots.length}</Text> /{" "}
        {maxSlots} slot
      </>
    );
  }, [selectedSlots.length, maxSlots]);

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

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
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
      <BookingPageHeader
        icon={headerIcon}
        title={`Đổi lịch (Chọn ${maxSlots} slot)`}
        subtitle={`Chọn slot mới cho ${roomName || "phòng lab"}`}
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
                const isSelected = selectedSlots.some(
                  (s) => s.date === dateString && s.slotId === slot.id
                );

                const slotStyle = isBooked
                  ? styles.unavailableSlot
                  : isSelected
                  ? styles.selectedSlot
                  : styles.availableSlot;

                let textStyle: StyleProp<TextStyle> = [styles.slotLabel];
                if (isSelected) {
                  textStyle.push(styles.selectedSlotText);
                } else if (isBooked) {
                  textStyle.push(styles.unavailableSlotText);
                }

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => toggleSlot(date, slot.id)}
                    disabled={isBooked}
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
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectionText}>{selectionInfo}</Text>
        <BookingButton
          label="Gửi yêu cầu đổi lịch"
          onPress={handleSubmitReschedule}
          disabled={selectedSlots.length !== maxSlots || isSubmitting}
          isLoading={isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  selectedSlotText: { color: "#fff" },
  unavailableSlotText: { color: "#94A3B8" },
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
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: { fontSize: 14, color: "#64748B", flex: 1 },
});
