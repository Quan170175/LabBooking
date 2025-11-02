import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
// --- THAY ĐỔI: Thêm icon RefreshCcw (Reset) ---
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react-native";
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

// Kiểu dữ liệu cho slot
type BookingSlot = { date: string; slotId: string; [key: string]: any };

export default function ChangeSlotsScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  const [originalBooking, setOriginalBooking] = useState<any>(null);

  const [originalSlots, setOriginalSlots] = useState<BookingSlot[]>([]);
  const [slotsToKeep, setSlotsToKeep] = useState<BookingSlot[]>([]);
  const [newSlots, setNewSlots] = useState<BookingSlot[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(
    new Set()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSameSlot = (s1: BookingSlot, s2: BookingSlot) =>
    s1.date === s2.date && s1.slotId === s2.slotId;
  const slotToKey = (s: BookingSlot) => `${s.date}::${s.slotId}`;

  // Tải chi tiết booking và TẤT CẢ các booking khác
  useEffect(() => {
    if (!bookingId) {
      router.back();
      return;
    }
    const loadData = async () => {
      setIsLoading(true);
      try {
        const bookingsString = await AsyncStorage.getItem("bookings");
        const allBookings = bookingsString ? JSON.parse(bookingsString) : [];

        const targetBooking = allBookings.find(
          (b: any) => String(b.id) === bookingId
        );

        if (!targetBooking) {
          Alert.alert("Lỗi", "Không tìm thấy booking.", [
            { text: "OK", onPress: () => router.back() },
          ]);
          return;
        }

        const original = (targetBooking.slots || []) as BookingSlot[];
        setOriginalBooking(targetBooking);
        setOriginalSlots(original);
        setSlotsToKeep(original);

        const newUnavailableSlots = new Set<string>();
        allBookings.forEach((b: any) => {
          if (String(b.id) === bookingId) return;
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
    loadData();
  }, [bookingId, router]);

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

  // --- THAY ĐỔI: Thêm hàm Reset ---
  const handleResetSlots = () => {
    // Chỉ reset nếu có thay đổi
    if (slotsToKeep.length !== originalSlots.length || newSlots.length > 0) {
      Alert.alert(
        "Đặt lại lựa chọn?",
        "Bạn có chắc muốn hoàn tác mọi thay đổi và quay về lịch ban đầu?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đặt lại",
            style: "destructive",
            onPress: () => {
              setSlotsToKeep(originalSlots);
              setNewSlots([]);
            },
          },
        ]
      );
    }
  };
  // --------------------------------

  // Logic chọn/tắt slot
  const slotsNeeded = originalSlots.length - slotsToKeep.length;
  const slotsSelected = newSlots.length;

  const toggleSlot = (date: Date, slotId: string) => {
    // ... (logic toggleSlot giữ nguyên) ...
    const currentSlot: BookingSlot = {
      date: date.toISOString().split("T")[0],
      slotId,
    };
    const currentKey = slotToKey(currentSlot);

    const isSlotToKeep = slotsToKeep.some((s) => isSameSlot(s, currentSlot));
    const isNewSlot = newSlots.some((s) => isSameSlot(s, currentSlot));
    const isUnavailable = unavailableSlots.has(currentKey);

    if (isSlotToKeep) {
      setSlotsToKeep(slotsToKeep.filter((s) => !isSameSlot(s, currentSlot)));
    } else if (isNewSlot) {
      setNewSlots(newSlots.filter((s) => !isSameSlot(s, currentSlot)));
    } else if (isUnavailable) {
      return;
    } else {
      if (slotsSelected < slotsNeeded) {
        setNewSlots([...newSlots, currentSlot]);
      } else {
        Alert.alert(
          "Đã chọn đủ slot",
          `Bạn chỉ có thể chọn ${slotsNeeded} slot mới. Hãy "tắt" bớt một slot cũ (màu xanh) để chọn thêm.`
        );
      }
    }
  };

  // Logic Submit
  const handleSubmitChange = async () => {
    // ... (logic handleSubmitChange giữ nguyên) ...
    if (slotsNeeded === 0) {
      Alert.alert("Chưa thay đổi", "Bạn phải tắt ít nhất 1 slot cũ để đổi.");
      return;
    }
    if (slotsSelected !== slotsNeeded) {
      Alert.alert(
        "Chưa chọn đủ",
        `Bạn đã bỏ ${slotsNeeded} slot, vui lòng chọn lại đúng ${slotsSelected} slot mới.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingsString = await AsyncStorage.getItem("bookings");
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];

      const updatedBookings = bookings.map((b: any) => {
        if (String(b.id) === bookingId) {
          return {
            ...b,
            status: "pending_change",
            slots: [...slotsToKeep, ...newSlots],
            changeInfo: {
              slotsRemoved: originalSlots.filter(
                (os) => !slotsToKeep.some((sk) => isSameSlot(os, sk))
              ),
              slotsAdded: newSlots,
            },
          };
        }
        return b;
      });

      await AsyncStorage.setItem("bookings", JSON.stringify(updatedBookings));

      Alert.alert(
        "Gửi yêu cầu thành công",
        "Yêu cầu thay đổi lịch của bạn đã được gửi đến quản lý để duyệt.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/home" as any) }]
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
        <Text style={{ fontWeight: "bold" }}>Bỏ: {slotsNeeded}</Text> slot.{" "}
        <Text style={{ fontWeight: "bold" }}>Chọn mới: {slotsSelected}</Text>{" "}
        slot.
      </>
    );
  }, [slotsNeeded, slotsSelected]);

  if (isLoading || weekDates.length === 0 || !originalBooking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  // (Phần JSX render)
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
        title={`Thay đổi lịch: ${originalBooking.roomName}`}
        subtitle="Tắt slot (màu xanh) để chọn lại slot mới (màu cam)"
      />
      {/* --- THAY ĐỔI: Thêm nút Reset vào calendarNav --- */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>

        <Text style={styles.dateRangeText}>{dateRange}</Text>

        <View style={styles.navButtonCluster}>
          {/* Nút Reset */}
          <TouchableOpacity onPress={handleResetSlots} style={styles.navButton}>
            <RefreshCcw size={18} color="#EA580C" />
          </TouchableOpacity>

          {/* Nút Next */}
          <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
            <ChevronRight size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>
      {/* ------------------------------------------- */}

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
                const currentSlot: BookingSlot = {
                  date: date.toISOString().split("T")[0],
                  slotId: slot.id,
                };
                const currentKey = slotToKey(currentSlot);

                const isSlotToKeep = slotsToKeep.some((s) =>
                  isSameSlot(s, currentSlot)
                );
                const isNewSlot = newSlots.some((s) =>
                  isSameSlot(s, currentSlot)
                );
                const isUnavailable = unavailableSlots.has(currentKey);

                let slotStyle = styles.availableSlot;
                if (isSlotToKeep) slotStyle = styles.slotToKeep;
                else if (isNewSlot) slotStyle = styles.selectedSlot;
                else if (isUnavailable) slotStyle = styles.unavailableSlot;

                let textStyle: StyleProp<TextStyle> = [styles.slotLabel];
                if (isSlotToKeep) textStyle.push(styles.slotToKeepText);
                else if (isNewSlot) textStyle.push(styles.selectedSlotText);
                else if (isUnavailable)
                  textStyle.push(styles.unavailableSlotText);

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => toggleSlot(date, slot.id)}
                    disabled={isUnavailable}
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
          <View style={[styles.legendBox, styles.slotToKeep]} />
          <Text style={styles.legendText}>Slot của bạn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSlot]} />
          <Text style={styles.legendText}>Slot mới</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSlot]} />
          <Text style={styles.legendText}>Đã được đặt</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectionText}>{selectionInfo}</Text>
        <BookingButton
          label="Gửi yêu cầu thay đổi"
          onPress={handleSubmitChange}
          disabled={
            slotsNeeded === 0 || slotsSelected !== slotsNeeded || isSubmitting
          }
          isLoading={isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

// --- THAY ĐỔI: Cập nhật styles cho calendarNav ---
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
  navButtonCluster: {
    flexDirection: "row", // Nhóm 2 nút Reset và Next
  },
  dateRangeText: {
    flex: 1, // Đẩy 2 cụm nút ra xa
    textAlign: "center", // Căn giữa chữ
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
  },
  // -------------------------------------------
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
  slotToKeep: { backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" },

  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  selectedSlotText: { color: "#fff" },
  unavailableSlotText: { color: "#94A3B8" },
  slotToKeepText: { color: "#1D4ED8", fontWeight: "600" },

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
