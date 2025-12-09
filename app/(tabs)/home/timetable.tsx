import apiClient from "@/utils/api";
import { useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// --- INTERFACES ---
interface SlotTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Booking {
  id: string;
  title: string;
  status: string | number;
  labRoom?: { labName: string; location?: string };
  slots?: { slotId: string; date: string; status: number }[];
}

// --- HELPER ---
const weekdays_short = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const getMonday = (d: Date) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (time: string) => {
  if (!time) return "";
  return time.split(":").slice(0, 2).join(":");
};

export default function PersonalScheduleScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplate[]>([]);
  const [myScheduleMap, setMyScheduleMap] = useState<Map<string, any>>(
    new Map()
  );

  // Date & Modal State
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null); // State cho Modal nhỏ

  // --- 1. LOAD DATA ---
  const fetchData = useCallback(async () => {
    try {
      const [resSlots, resHistory] = await Promise.all([
        apiClient.get("/api/Slot"),
        apiClient.get("/api/Bookings/timetable"),
      ]);

      // A. Template Slots
      const templates: SlotTemplate[] =
        resSlots.data?.data || resSlots.data || [];
      templates.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setSlotTemplates(templates);

      // B. Booking History
      const responseData = resHistory.data;
      const bookings: Booking[] = responseData?.data || responseData || [];

      const scheduleMap = new Map<string, any>();

      bookings.forEach((booking) => {
        const isApproved =
          booking.status === 1 || booking.status === "Approved";
        if (!isApproved) return;

        if (booking.slots) {
          booking.slots.forEach((slot) => {
            if (slot.status === 0) {
              // Active
              const dateStr = slot.date.split("T")[0];
              const key = `${dateStr}::${slot.slotId}`;

              // Lưu info để hiển thị trong Modal
              scheduleMap.set(key, {
                bookingTitle: booking.title,
                labName: booking.labRoom?.labName || "Phòng Lab",
                location: booking.labRoom?.location || "Chưa cập nhật",
                bookingId: booking.id,
              });
            }
          });
        }
      });

      setMyScheduleMap(scheduleMap);
    } catch (error) {
      console.error("Lỗi tải lịch:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // --- 2. DATE LOGIC ---
  React.useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
  }, [currentMonday]);

  const handlePrevWeek = () =>
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  const handleNextWeek = () =>
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });

  const handleSlotPress = (
    bookingInfo: any,
    date: string,
    slotLabel: string
  ) => {
    // Mở Modal nhỏ với thông tin chi tiết
    setSelectedBooking({ ...bookingInfo, date, slotLabel });
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  const dateRange = `${weekDates[0]?.getDate()}/${
    weekDates[0]?.getMonth() + 1
  } - ${weekDates[6]?.getDate()}/${
    weekDates[6]?.getMonth() + 1
  }/${weekDates[6]?.getFullYear()}`;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF7ED" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EA580C"]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Thời khóa biểu cá nhân</Text>
          <Text style={styles.subtitle}>
            Xem tình trạng slot đã được lưu trong hệ thống
          </Text>
        </View>

        {/* NAVIGATION */}
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
            <ChevronLeft size={20} color="#EA580C" />
          </TouchableOpacity>
          <Text style={styles.dateRangeText}>{dateRange}</Text>
          <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
            <ChevronRight size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>

        {/* GRID */}
        <View style={styles.calendarContainer}>
          {/* Header Days */}
          <View style={styles.weekdaysHeader}>
            {weekDates.map((d, i) => (
              <View key={i} style={styles.dayHeader}>
                <Text style={styles.dayNameText}>{weekdays_short[i]}</Text>
                <Text
                  style={[
                    styles.dateNumText,
                    formatDateLocal(d) === formatDateLocal(new Date()) && {
                      color: "#EA580C",
                    },
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            ))}
          </View>

          {/* Slots Rows */}
          <View style={styles.slotsGrid}>
            {weekDates.map((date, i) => (
              <View key={i} style={styles.dayColumn}>
                {slotTemplates.map((slot, index) => {
                  const dateStr = formatDateLocal(date);
                  const key = `${dateStr}::${slot.id}`;

                  const myBooking = myScheduleMap.get(key);
                  const hasBooking = !!myBooking;

                  // Tạo nhãn "Slot 1", "Slot 2"... cho đẹp đội hình
                  const displayLabel = `Slot ${index + 1}`;

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotButton,
                        // Nếu có lịch -> Màu Cam, Không -> Màu Trắng
                        hasBooking
                          ? styles.unavailableSlot
                          : styles.availableSlot,
                      ]}
                      // Bấm vào hiện popup
                      onPress={() =>
                        hasBooking &&
                        handleSlotPress(myBooking, dateStr, displayLabel)
                      }
                      activeOpacity={hasBooking ? 0.7 : 1}
                    >
                      <Text
                        style={[
                          styles.slotLabel,
                          // Chữ đổi màu theo trạng thái
                          hasBooking && styles.unavailableSlotText,
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* LEGEND */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.availableSlot]} />
            <Text style={styles.legendText}>Còn trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.unavailableSlot]} />
            <Text style={styles.legendText}>Đã đặt (Của tôi)</Text>
          </View>
        </View>

        {/* INFO SECTION (Render động từ API Slot Template) */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeaderRow}>
            <Clock size={16} color="#EA580C" />
            <Text style={styles.infoTitle}>Khung giờ hoạt động</Text>
          </View>

          <View style={styles.infoGrid}>
            {slotTemplates.map((slot, index) => (
              <View
                key={slot.id}
                style={[
                  styles.infoRow,
                  index === slotTemplates.length - 1 && styles.lastInfoRow,
                ]}
              >
                <Text style={styles.infoLabel}>Slot {index + 1}:</Text>
                <Text style={styles.infoValue}>
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* POPUP MODAL (Cái "nhỏ nhỏ" bạn yêu cầu) */}
      <Modal
        visible={!!selectedBooking}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBooking(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBooking(null)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thông tin đặt phòng</Text>
                <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {selectedBooking && (
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Ngày:</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.date}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Khung giờ:</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.slotLabel}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Phòng:</Text>
                    <Text
                      style={[
                        styles.modalValue,
                        { color: "#EA580C", fontWeight: "700" },
                      ]}
                    >
                      {selectedBooking.labName}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Sự kiện:</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.bookingTitle}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Vị trí:</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.location}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
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

  header: { marginBottom: 16, marginTop: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748B" },

  // NAV
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
  dateRangeText: { fontSize: 14, fontWeight: "600", color: "#C2410C" },

  // GRID CONTAINER
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
  dayHeader: { flex: 1, alignItems: "center", gap: 4 },
  dayNameText: { fontSize: 11, fontWeight: "500", color: "#64748B" },
  dateNumText: { fontSize: 13, fontWeight: "600", color: "#1E293B" },

  slotsGrid: { flexDirection: "row", gap: 6 },
  dayColumn: { flex: 1, gap: 6 },

  // BUTTON STYLES (Đẹp như bản cứng)
  slotButton: {
    width: "100%",
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Style Trống
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  slotLabel: { fontSize: 11, fontWeight: "500", color: "#0F172A" },

  // Style Đã đặt (Màu cam)
  unavailableSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  unavailableSlotText: { color: "white", fontWeight: "700" }, // Chữ trắng trên nền cam cho nổi

  // LEGEND
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 13, color: "#475569" },

  // INFO SECTION (Tái tạo SlotTimeInfo nhưng dùng data động)
  infoContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  infoGrid: { gap: 4 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastInfoRow: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, fontWeight: "600", color: "#EA580C" },
  infoValue: { fontSize: 13, color: "#334155", fontWeight: "500" },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalBody: { gap: 12 },
  modalRow: { flexDirection: "row", alignItems: "flex-start" },
  modalLabel: { width: 80, fontSize: 14, color: "#64748B" },
  modalValue: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
});
