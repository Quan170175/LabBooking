import SlotTimeInfo from "@/components/home/SlotTimeInfo";
import apiClient from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ====================================================================
// --- HELPER (COPY TỪ BOOKSLOTS) ---
// ====================================================================

const weekdays_short = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameDate = (d1: string, d2: string) => {
  if (!d1 || !d2) return false;
  return d1.split("T")[0] === d2.split("T")[0];
};

// --- LOGIC TEXT TOOLTIP (COPY TỪ BOOKSLOTS) ---
const getTooltipContent = (type: string, item: any) => {
  // 1. Quá hạn (Ở màn hình xem lịch thì ít dùng logic này, nhưng cứ giữ cho giống)
  if (type === "RESTRICTED_EMPTY") return "Đã quá thời gian";
  if (type === "RESTRICTED_BOOKED") {
    let content = item?.title || "Đã được đặt";
    if (item?.bookerName) content += `\n👤 ${item.bookerName}`;
    content += "\n(Đã kết thúc)";
    return content;
  }

  // 2. Các trường hợp bình thường
  if (!item) return "Người khác đã đặt";

  if (type === "MAINTENANCE" || item.reason === "Maintenance") {
    return item.description
      ? `Lý do: ${item.description}`
      : item.title || "Phòng đang bảo trì";
  }

  if (item.title) {
    let content = item.title;
    if (item.bookerName) content += `\n👤 ${item.bookerName}`;
    return content;
  }

  return "Người khác đã đặt";
};

// --- API ---
const api_getUnavailableSlots = async (
  roomId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const response = await apiClient.get("/api/BookingSlot", {
      params: { LabRoomId: roomId, StartDate: startDate, EndDate: endDate },
    });
    return response.data?.data || response.data || [];
  } catch (e: any) {
    console.error("Lỗi tải lịch:", e);
    return [];
  }
};

// ====================================================================
// --- COMPONENT ---
// ====================================================================

interface LabRoom {
  id: string;
  labName: string;
}
interface Slot {
  id: string;
  slotIndex: number;
  label: string;
  startTime: string;
  endTime: string;
}

export default function AvailabilityScreen() {
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);

  const [selectedLab, setSelectedLab] = useState<LabRoom | null>(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [showLabModal, setShowLabModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{
    date: string;
    slotId: string;
  } | null>(null);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // 1. Init
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLabs, resSlots] = await Promise.all([
          apiClient.get("/api/LabRooms", {
            params: { PageNumber: 1, PageSize: 10 },
          }),
          apiClient.get("/api/Slot"),
        ]);
        const labsData = resLabs.data?.items || [];
        setLabs(labsData);
        if (labsData.length > 0) setSelectedLab(labsData[0]);

        const slotsData = resSlots.data?.items || resSlots.data || [];
        if (Array.isArray(slotsData)) {
          slotsData.sort((a: Slot, b: Slot) => a.slotIndex - b.slotIndex);
          setSlots(slotsData);
        }
      } finally {
        setLoadingInit(false);
      }
    };
    fetchData();
  }, []);

  // 2. Schedule
  useEffect(() => {
    if (!selectedLab) return;
    const fetchSchedule = async () => {
      setLoadingSchedule(true);
      setActiveTooltip(null);
      try {
        const startDate = formatDateLocal(currentMonday);
        const endDate = formatDateLocal(
          new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
        );
        const data = await api_getUnavailableSlots(
          selectedLab.id,
          startDate,
          endDate
        );
        setSchedule(data);
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchSchedule();
  }, [selectedLab, currentMonday]);

  // Handlers
  const handlePrevWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() - 7);
    setCurrentMonday(d);
  };
  const handleNextWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 7);
    setCurrentMonday(d);
  };

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentMonday);
        d.setDate(currentMonday.getDate() + i);
        return d;
      }),
    [currentMonday]
  );

  const startDateStr = `${weekDates[0].getDate()}/${
    weekDates[0].getMonth() + 1
  }`;
  const endDateStr = `${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`;

  const handleSlotPress = (
    dateString: string,
    slotId: string,
    booking: any
  ) => {
    // Nếu bấm lại vào ô đang hiện tooltip -> ẩn
    if (
      activeTooltip?.date === dateString &&
      activeTooltip?.slotId === slotId
    ) {
      setActiveTooltip(null);
      return;
    }
    // Nếu có booking -> hiện tooltip
    if (booking) {
      setActiveTooltip({ date: dateString, slotId });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch Phòng Lab</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowLabModal(true)}
        >
          <View>
            <Text style={styles.dropdownLabel}>Phòng:</Text>
            <Text style={styles.dropdownValue}>
              {selectedLab?.labName || "Chọn..."}
            </Text>
          </View>
          <Ionicons name="caret-down-circle" size={24} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {/* Nav */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text
          style={styles.dateRangeText}
        >{`${startDateStr} - ${endDateStr}`}</Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {loadingInit ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.weekdaysHeader}>
              {weekDates.map((date, idx) => (
                <View key={idx} style={styles.dayHeader}>
                  <Text style={styles.dayNameText}>{weekdays_short[idx]}</Text>
                  <Text style={styles.dateNumText}>{date.getDate()}</Text>
                </View>
              ))}
            </View>

            {loadingSchedule && (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color="#EA580C" />
              </View>
            )}

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setActiveTooltip(null)}
              style={[styles.slotsGrid, loadingSchedule && styles.hidden]}
            >
              {weekDates.map((date, dayIndex) => (
                <View key={dayIndex} style={styles.dayColumn}>
                  {slots.map((slot) => {
                    const dateString = formatDateLocal(date);
                    const booking = schedule.find(
                      (s) =>
                        isSameDate(s.date, dateString) && s.slotId === slot.id
                    );

                    // --- LOGIC STYLE & TYPE (COPY TỪ BOOKSLOTS) ---
                    let slotStyle: any = styles.availableSlot;
                    let textStyle: any = [styles.slotLabel];
                    let label = slot.label;
                    let tooltipType = "";

                    const priority = booking?.priority ?? 2;
                    const isMaintenance =
                      priority === 0 || booking?.reason === "Maintenance";
                    const isMyBooking = booking?.isMyBooking === true;

                    if (isMaintenance) {
                      slotStyle = styles.maintenanceSlot;
                      textStyle.push(styles.maintenanceSlotText);
                      label = "Bảo trì";
                      tooltipType = "MAINTENANCE";
                    } else if (isMyBooking) {
                      slotStyle = styles.myBookingSlot;
                      textStyle.push(styles.myBookingText);
                      // label = "Của bạn";
                      tooltipType = "MY_BOOKING";
                    } else if (booking) {
                      slotStyle = styles.unavailableSlot;
                      textStyle.push(styles.unavailableSlotText);
                      // label = "Đã đặt";
                      tooltipType = "BOOKED";
                    }

                    const showTooltip =
                      activeTooltip?.date === dateString &&
                      activeTooltip?.slotId === slot.id;

                    return (
                      <View
                        key={slot.id}
                        style={{ zIndex: showTooltip ? 100 : 1 }}
                      >
                        {/* --- PHẦN POPUP (TOOLTIP) GIỐNG HỆT --- */}
                        {showTooltip && (
                          <View style={styles.tooltipContainer}>
                            <View style={styles.tooltipBubble}>
                              {/* Badge Label (ví dụ: CLASS, MAINTENANCE) */}
                              {booking?.typeLabel && (
                                <View
                                  style={{
                                    backgroundColor: isMaintenance
                                      ? "#EF4444"
                                      : "#3B82F6",
                                    alignSelf: "center",
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "white",
                                      fontSize: 9,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {booking.typeLabel.toUpperCase()}
                                  </Text>
                                </View>
                              )}

                              {/* Main Text */}
                              <Text style={styles.tooltipText}>
                                {getTooltipContent(tooltipType, booking)}
                              </Text>

                              {/* Time Subtext */}
                              <Text style={styles.tooltipSubText}>
                                {slot.startTime} - {slot.endTime}
                              </Text>
                            </View>
                            <View style={styles.tooltipArrow} />
                          </View>
                        )}
                        {/* ------------------------------------- */}

                        <TouchableOpacity
                          onPress={() =>
                            handleSlotPress(dateString, slot.id, booking)
                          }
                          activeOpacity={0.7}
                          style={[styles.slotButton, slotStyle]}
                        >
                          <Text style={textStyle} numberOfLines={1}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))}
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.availableSlot]} />
              <Text style={styles.legendText}>Trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.myBookingSlot]} />
              <Text style={styles.legendText}>Của bạn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.unavailableSlot]} />
              <Text style={styles.legendText}>Đã đặt</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.maintenanceSlot]} />
              <Text style={styles.legendText}>Bảo trì</Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <SlotTimeInfo />
          </View>
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={showLabModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLabModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn Phòng Lab</Text>
            <FlatList
              data={labs}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedLab?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLab(item);
                    setShowLabModal(false);
                  }}
                >
                  <Text
                    style={
                      selectedLab?.id === item.id
                        ? styles.modalTextSelected
                        : styles.modalText
                    }
                  >
                    {item.labName}
                  </Text>
                  {selectedLab?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color="#EA580C" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ====================================================================
// --- STYLES (COPY 100% TỪ BOOKSLOTS - KO CHẾ) ---
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED", paddingTop: 10 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },
  scrollContent: { paddingBottom: 50, paddingHorizontal: 16 },

  header: { paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    elevation: 2,
  },
  dropdownLabel: { fontSize: 12, color: "#64748B" },
  dropdownValue: { fontSize: 16, fontWeight: "700", color: "#C2410C" },

  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  navButton: { padding: 8 },
  dateRangeText: { fontSize: 14, fontWeight: "600", color: "#C2410C" },

  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    position: "relative",
    zIndex: 1,
  },
  weekdaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayHeader: { flex: 1, alignItems: "center", gap: 4 },
  dayNameText: { fontSize: 12, fontWeight: "500", color: "#64748B" },
  dateNumText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },

  slotsGrid: { flexDirection: "row", gap: 8 },
  dayColumn: { flex: 1, gap: 8 },
  hidden: { opacity: 0.3 },
  slotsLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 16,
  },

  slotButton: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },

  // --- COLORS ---
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  unavailableSlot: { backgroundColor: "#FEFCE8", borderColor: "#FACC15" },
  unavailableSlotText: { color: "#A16207" },
  maintenanceSlot: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1,
    opacity: 1,
  },
  maintenanceSlotText: { color: "#DC2626", fontWeight: "700", fontSize: 10 },
  myBookingSlot: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  myBookingText: { color: "#166534", fontWeight: "600" },

  legend: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 16,
    rowGap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 13, color: "#475569" },

  // --- TOOLTIP STYLES ---
  tooltipContainer: {
    position: "absolute",
    bottom: "110%",
    left: -50,
    right: -50,
    alignItems: "center",
    zIndex: 999,
  },
  tooltipBubble: {
    backgroundColor: "#1E293B",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  tooltipSubText: { color: "#94A3B8", fontSize: 9 },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#1E293B",
    marginTop: -1,
  },

  // Modal
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
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#1E293B",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemSelected: { backgroundColor: "#FFEDD5" },
  modalText: { fontSize: 15, color: "#334155" },
  modalTextSelected: { fontSize: 15, color: "#C2410C", fontWeight: "700" },
});
