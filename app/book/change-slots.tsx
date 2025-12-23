import apiClient from "@/utils/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

// --- HELPER FUNCTIONS ---
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

const isTimeRestricted = (date: Date, timeString: string) => {
  if (!timeString) return false;
  const [hours, minutes] = timeString.split(":").map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hours, minutes, 0, 0);
  const now = new Date();
  // Khóa slot nếu thời gian bắt đầu < (Hiện tại + 1 tiếng) - Đồng bộ logic
  const restrictedThreshold = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  return slotTime < restrictedThreshold;
};

// --- TOOLTIP CONTENT HELPER ---
const getTooltipContent = (type: string, item: any) => {
  // 1. Quá hạn và TRỐNG
  if (type === "RESTRICTED_EMPTY") return "Đã quá thời gian đặt";

  // 2. Quá hạn nhưng CÓ NGƯỜI ĐẶT (Hiện thông tin + Note)
  if (type === "RESTRICTED_BOOKED") {
    let content = item?.title || "Đã được đặt";
    if (item?.bookerName) {
      content += `\n👤 ${item.bookerName}`;
    }
    content += "\n(Đã kết thúc)";
    return content;
  }

  // 3. Các trường hợp khác
  if (!item) return "Người khác đã đặt";

  if (type === "MAINTENANCE" || item.reason === "Maintenance") {
    return item.description
      ? `Lý do: ${item.description}`
      : item.title || "Phòng đang bảo trì";
  }

  if (item.title) {
    let content = item.title;
    if (item.bookerName) {
      content += `\n👤 ${item.bookerName}`;
    }
    return content;
  }

  return "Người khác đã đặt";
};

export default function ChangeSlotsScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [isBusyLoading, setIsBusyLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [allSlotsTemplate, setAllSlotsTemplate] = useState<any[]>([]);

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [systemBusySlots, setSystemBusySlots] = useState<any[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<any[]>([]);

  // State cho Tooltip: { date, slotId }
  const [activeTooltip, setActiveTooltip] = useState<{
    date: string;
    slotId: string;
  } | null>(null);

  // --- API CALLS ---
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Lấy danh sách khung giờ (Slot Template)
      const resSlot = await apiClient.get("/api/Slot");
      setAllSlotsTemplate(resSlot.data);

      // 2. Lấy chi tiết Booking hiện tại
      const resBooking = await apiClient.get(`/api/Bookings/${bookingId}`);
      const myBooking = resBooking.data;
      setBookingDetail(myBooking);

      if (myBooking.slots) {
        const initialSlots = myBooking.slots.map((s: any) => ({
          date: s.date.split("T")[0],
          slotId: s.slotId,
        }));
        setSelectedSlots(initialSlots);
        setOriginalSnapshot(initialSlots);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể tải dữ liệu booking.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) fetchData();
  }, [bookingId, fetchData]);

  // Load danh sách Busy (Người khác đặt) khi đổi tuần
  useEffect(() => {
    const loadBusySlots = async () => {
      if (!bookingDetail) return;
      try {
        setIsBusyLoading(true);
        const startStr = formatDateLocal(currentMonday);
        const endObj = new Date(currentMonday);
        endObj.setDate(endObj.getDate() + 6);
        const endStr = formatDateLocal(endObj);

        const resBusy = await apiClient.get("/api/BookingSlot", {
          params: {
            LabRoomId: bookingDetail.labRoomId,
            StartDate: startStr,
            EndDate: endStr,
          },
        });
        setSystemBusySlots(resBusy.data);
      } catch (e) {
        console.error("Load busy slots failed", e);
      } finally {
        setIsBusyLoading(false);
      }
    };
    loadBusySlots();
  }, [currentMonday, bookingDetail]);

  // Tính toán ngày trong tuần
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
    setActiveTooltip(null); // Reset tooltip khi đổi tuần
  }, [currentMonday]);

  // --- NAVIGATION HANDLERS ---
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

  const handleReset = () => {
    Alert.alert("Làm mới", "Quay về trạng thái ban đầu?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          setSelectedSlots([...originalSnapshot]);
          setCurrentMonday(getMonday(new Date()));
          setActiveTooltip(null);
        },
      },
    ]);
  };

  // --- LOGIC XỬ LÝ CLICK ---
  const handleSlotPress = (
    dateStr: string,
    slotId: string,
    isDisabled: boolean
  ) => {
    // 1. Nếu bấm lại vào slot đang hiện tooltip -> Tắt tooltip
    if (activeTooltip?.date === dateStr && activeTooltip?.slotId === slotId) {
      setActiveTooltip(null);
      return;
    }

    // 2. NHÓM KHÔNG THỂ CHỌN -> HIỆN TOOLTIP
    if (isDisabled) {
      setActiveTooltip({ date: dateStr, slotId });
      return;
    }

    // 3. NHÓM THAO TÁC ĐƯỢC -> TOGGLE
    setActiveTooltip(null);
    toggleSelection(dateStr, slotId);
  };

  const toggleSelection = (dateStr: string, slotId: string) => {
    const exists = selectedSlots.find(
      (s) => s.date === dateStr && s.slotId === slotId
    );
    if (exists) {
      // Bỏ chọn
      setSelectedSlots((prev) =>
        prev.filter((s) => !(s.date === dateStr && s.slotId === slotId))
      );
    } else {
      // Chọn mới
      setSelectedSlots((prev) => [...prev, { date: dateStr, slotId }]);
    }
  };

  // --- SUBMIT ---
  const handleNext = () => {
    if (selectedSlots.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 slot.");
      return;
    }
    router.push({
      pathname: "/book/change-detail",
      params: {
        bookingId: bookingId,
        currentSlots: JSON.stringify(selectedSlots),
      },
    } as any);
  };

  // Tính toán số lượng thay đổi
  const diffInfo = useMemo(() => {
    const removedCount = originalSnapshot.filter(
      (orig) =>
        !selectedSlots.some(
          (curr) => curr.date === orig.date && curr.slotId === orig.slotId
        )
    ).length;

    const addedCount = selectedSlots.filter(
      (curr) =>
        !originalSnapshot.some(
          (orig) => orig.date === curr.date && orig.slotId === curr.slotId
        )
    ).length;

    return { removedCount, addedCount };
  }, [selectedSlots, originalSnapshot]);

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );

  const dateRange = `${weekDates[0]?.getDate()}/${
    weekDates[0]?.getMonth() + 1
  } - ${weekDates[6]?.getDate()}/${weekDates[6]?.getMonth() + 1}`;

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingPageHeader
        icon={headerIcon}
        title="Điều chỉnh lịch"
        subtitle={`Phòng: ${
          bookingDetail?.labRoomResponse?.labName || "Unknown"
        }`}
      />

      <View style={styles.infoBar}>
        <RefreshCcw size={16} color="#9A3412" />
        <Text style={styles.infoText}>Thay đổi lịch trình của bạn.</Text>
      </View>

      {/* --- THANH ĐIỀU HƯỚNG TUẦN --- */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity onPress={handleReset} style={styles.navButton}>
            <RefreshCcw size={18} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
            <ChevronRight size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- LƯỚI LỊCH --- */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekdaysHeader}>
          {weekDates.map((d, i) => (
            <View key={i} style={styles.dayHeader}>
              <Text style={styles.dayNameText}>{weekdays_short[i]}</Text>
              <Text style={styles.dateNumText}>{d.getDate()}</Text>
            </View>
          ))}
        </View>

        {isBusyLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#EA580C" />
          </View>
        )}

        <TouchableOpacity
          activeOpacity={1}
          style={[styles.slotsGrid, isBusyLoading && { opacity: 0.5 }]}
          onPress={() => setActiveTooltip(null)}
        >
          {weekDates.map((date, i) => (
            <View key={i} style={styles.dayColumn}>
              {allSlotsTemplate.map((slot) => {
                const dateStr = formatDateLocal(date);

                // --- 1. DATA CALCULATION ---
                const isRestricted = isTimeRestricted(date, slot.startTime);
                const unavailableItem = systemBusySlots.find(
                  (s: any) =>
                    s.date.split("T")[0] === dateStr && s.slotId === slot.id
                );

                // Các flag trạng thái
                const isMaintenance =
                  unavailableItem?.priority === 0 ||
                  unavailableItem?.reason === "Maintenance";
                const isMyOriginal = originalSnapshot.some(
                  (s) => s.date === dateStr && s.slotId === slot.id
                );
                const isBusyByOthers =
                  !!unavailableItem && !isMaintenance && !isMyOriginal;
                const isSelected = selectedSlots.some(
                  (s) => s.date === dateStr && s.slotId === slot.id
                );

                // --- 2. PRIORITY STYLING LOGIC (STACK) ---
                let slotStyle: any = styles.slotButton;
                let textStyle: any = styles.slotLabel;
                let isDisabled = false;
                let tooltipType = "";

                // PRIORITY 1: QUÁ HẠN (Cao nhất)
                if (isRestricted) {
                  slotStyle = [styles.slotButton, styles.pastSlot];
                  textStyle = [styles.slotLabel, { opacity: 0.5 }];
                  isDisabled = true;
                  // Nếu quá hạn mà có data -> RESTRICTED_BOOKED, ngược lại EMPTY
                  if (unavailableItem) {
                    tooltipType = "RESTRICTED_BOOKED";
                  } else {
                    tooltipType = "RESTRICTED_EMPTY";
                  }
                }
                // PRIORITY 2: BẢO TRÌ
                else if (isMaintenance) {
                  slotStyle = [styles.slotButton, styles.maintenanceSlot];
                  textStyle = [styles.slotLabel, styles.maintenanceSlotText];
                  isDisabled = true;
                  tooltipType = "MAINTENANCE";
                }
                // PRIORITY 3: NGƯỜI KHÁC ĐẶT
                else if (isBusyByOthers) {
                  slotStyle = [styles.slotButton, styles.busySlot];
                  textStyle = [styles.slotLabel, styles.busySlotText];
                  isDisabled = true;
                  tooltipType = "BOOKED";
                }
                // PRIORITY 4: TƯƠNG TÁC (Selectable)
                else {
                  if (isMyOriginal && !isSelected) {
                    // Đã bỏ chọn lịch cũ (Hủy)
                    slotStyle = [styles.slotButton, styles.lostSlot];
                    textStyle = [styles.slotLabel, styles.lostSlotText];
                  } else if (!isMyOriginal && isSelected) {
                    // Chọn mới
                    slotStyle = [styles.slotButton, styles.selectedSlot];
                    textStyle = [styles.slotLabel, styles.selectedSlotText];
                  } else if (isMyOriginal && isSelected) {
                    // Giữ nguyên
                    slotStyle = [styles.slotButton, styles.safeSlot];
                    textStyle = [styles.slotLabel, styles.safeSlotText];
                  }
                  // Else: Trống (Mặc định)
                }

                // Check hiển thị Tooltip
                const showTooltip =
                  activeTooltip?.date === dateStr &&
                  activeTooltip?.slotId === slot.id;

                return (
                  <View key={slot.id} style={{ zIndex: showTooltip ? 100 : 1 }}>
                    {/* --- TOOLTIP --- */}
                    {showTooltip && (
                      <View style={styles.tooltipContainer}>
                        <View style={styles.tooltipBubble}>
                          {/* Label (Badge) - Căn giữa */}
                          {unavailableItem?.typeLabel && (
                            <View
                              style={{
                                backgroundColor: isMaintenance
                                  ? "#EF4444"
                                  : "#3B82F6",
                                alignSelf: "center", // <--- CĂN GIỮA
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
                                {unavailableItem.typeLabel.toUpperCase()}
                              </Text>
                            </View>
                          )}

                          {/* Nội dung */}
                          <Text
                            style={[
                              styles.tooltipText,
                              { color: "#FECACA", textAlign: "center" },
                            ]}
                          >
                            {getTooltipContent(tooltipType, unavailableItem)}
                          </Text>

                          {/* Giờ */}
                          <Text style={styles.tooltipSubText}>
                            {slot.startTime} - {slot.endTime}
                          </Text>
                        </View>
                        <View style={styles.tooltipArrow} />
                      </View>
                    )}

                    <TouchableOpacity
                      style={slotStyle}
                      onPress={() =>
                        handleSlotPress(dateStr, slot.id, isDisabled)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={textStyle} numberOfLines={1}>
                        {isMaintenance ? "Bảo trì" : slot.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </TouchableOpacity>
      </View>

      {/* --- CHÚ THÍCH --- */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.safeSlot]} />
          <Text style={styles.legendText}>Lịch cũ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSlot]} />
          <Text style={styles.legendText}>Mới thêm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.lostSlot]} />
          <Text style={styles.legendText}>Mới hủy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.busySlot]} />
          <Text style={styles.legendText}>Người khác</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.maintenanceSlot]} />
          <Text style={styles.legendText}>Bảo trì</Text>
        </View>
      </View>

      {/* --- FOOTER --- */}
      <View style={styles.footerContainer}>
        <View style={styles.footerInfo}>
          <Text style={styles.selectionText}>
            Hủy:{" "}
            <Text style={{ fontWeight: "700", color: "#B91C1C" }}>
              {diffInfo.removedCount}
            </Text>{" "}
            • Thêm:{" "}
            <Text style={{ fontWeight: "700", color: "#EA580C" }}>
              {diffInfo.addedCount}
            </Text>{" "}
            • Tổng:{" "}
            <Text style={{ fontWeight: "700", color: "#15803D" }}>
              {selectedSlots.length}
            </Text>
          </Text>
        </View>

        <View style={styles.footerButtons}>
          <View style={{ flex: 1 }}>
            <BookingButton label="Xác nhận đổi" onPress={handleNext} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 120 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },

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
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  tooltipSubText: {
    color: "#CBD5E1",
    fontSize: 9,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#1E293B",
    marginTop: -1,
  },

  // --- INFO BAR ---
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEDD5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: { fontSize: 13, color: "#9A3412", flex: 1 },

  // --- CALENDAR NAV ---
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  navButton: { padding: 8 },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
    flex: 1,
    textAlign: "center",
  },

  // --- CALENDAR GRID ---
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    minHeight: 200,
    zIndex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  weekdaysHeader: { flexDirection: "row", marginBottom: 12 },
  dayHeader: { flex: 1, alignItems: "center", gap: 4 },
  dayNameText: { fontSize: 12, color: "#64748B" },
  dateNumText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },

  slotsGrid: { flexDirection: "row", gap: 8 },
  dayColumn: { flex: 1, gap: 8 },

  // --- SLOT STYLES ---
  slotButton: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#E2E8F0",
  },
  slotLabel: { fontSize: 11, fontWeight: "500", color: "#334155" },

  // 1. CỦA TÔI (Safe): Màu xanh lá
  safeSlot: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  safeSlotText: { color: "#15803D", fontWeight: "700" },

  // 2. NGƯỜI KHÁC (Busy): Màu vàng
  busySlot: {
    backgroundColor: "#FEF9C3",
    borderColor: "#FACC15",
    opacity: 0.9,
  },
  busySlotText: { color: "#854D0E" },

  // 3. ĐANG CHỌN (Selected): Màu cam
  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  selectedSlotText: { color: "#fff", fontWeight: "700" },

  // 4. BỊ MẤT (Lost): Màu đỏ nhạt + gạch ngang
  lostSlot: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    opacity: 0.7,
  },
  lostSlotText: { color: "#B91C1C", textDecorationLine: "line-through" },

  // 5. BẢO TRÌ
  maintenanceSlot: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1,
    opacity: 1,
  },
  maintenanceSlotText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 10,
  },

  // 6. QUÁ KHỨ
  pastSlot: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.4,
  },

  // --- LEGEND ---
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: "#64748B" },

  // --- FOOTER ---
  footerContainer: {
    marginTop: 24,
  },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 12,
  },
  selectionText: { fontSize: 14, color: "#64748B" },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
