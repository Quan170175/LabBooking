import apiClient from "@/utils/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCcw,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

// 👇 IMPORT COMPONENTS CỦA BẠN
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

// --- INTERFACES ---
interface SimpleSlot {
  slotId: string;
  date: string;
}

interface RescheduleContext {
  bookingId: string;
  bookingTitle: string;
  labId: string;
  labName: string;
  slotDebtCount: number;
  lostSlots: SimpleSlot[];
  safeSlots: SimpleSlot[];
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

export default function RescheduleSlotsScreen() {
  const router = useRouter();
  const { consentId, notificationId } = useLocalSearchParams();

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [isBusyLoading, setIsBusyLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [context, setContext] = useState<RescheduleContext | null>(null);
  const [allSlotsTemplate, setAllSlotsTemplate] = useState<any[]>([]);

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [systemBusySlots, setSystemBusySlots] = useState<any[]>([]);

  const [newSelectedSlots, setNewSelectedSlots] = useState<any[]>([]);

  // --- 1. FETCH INITIAL DATA ---
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        // a. Template
        const resTemplate = await apiClient.get("/api/Slot");
        const templateData = resTemplate.data?.data || resTemplate.data;
        setAllSlotsTemplate(templateData);

        // b. Context
        const resContext = await apiClient.get(
          `/api/BookingConsent/${consentId}/reschedule-context`
        );
        const payload = resContext.data;
        if (payload?.data) setContext(payload.data);
        else setContext(payload);
      } catch (e) {
        Alert.alert("Lỗi", "Không thể tải thông tin đổi lịch.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    if (consentId) initData();
  }, [consentId]);

  // --- 2. LOAD BUSY SLOTS ---
  useEffect(() => {
    const loadBusySlots = async () => {
      if (!context?.labId) return;
      try {
        setIsBusyLoading(true);
        const startStr = formatDateLocal(currentMonday);
        const endObj = new Date(currentMonday);
        endObj.setDate(endObj.getDate() + 6);
        const endStr = formatDateLocal(endObj);

        const resBusy = await apiClient.get("/api/BookingSlot", {
          params: {
            LabRoomId: context.labId,
            StartDate: startStr,
            EndDate: endStr,
          },
        });
        const busyData = resBusy.data?.data || resBusy.data;
        setSystemBusySlots(busyData || []);
      } catch (e) {
        console.error("Load busy slots failed", e);
      } finally {
        setIsBusyLoading(false);
      }
    };
    loadBusySlots();
  }, [currentMonday, context]);

  // --- 3. DATE UTILS ---
  useEffect(() => {
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

  // --- 4. HANDLERS ---
  const handleToggleSlot = (
    dateStr: string,
    slotId: string,
    isDisabled: boolean
  ) => {
    if (isDisabled) return;

    // Check nếu đã đủ số lượng tối đa thì không cho chọn thêm (chỉ cho bỏ chọn)
    if (context && newSelectedSlots.length >= context.slotDebtCount) {
      const isRemoving = newSelectedSlots.some(
        (s) => s.date === dateStr && s.slotId === slotId
      );
      if (!isRemoving) {
        Alert.alert(
          "Đã đủ số lượng",
          `Bạn chỉ được chọn tối đa ${context.slotDebtCount} slot.`
        );
        return;
      }
    }

    const exists = newSelectedSlots.find(
      (s) => s.date === dateStr && s.slotId === slotId
    );
    if (exists) {
      setNewSelectedSlots((prev) => prev.filter((s) => s !== exists));
    } else {
      setNewSelectedSlots((prev) => [...prev, { date: dateStr, slotId }]);
    }
  };

  const handleReset = () => {
    setNewSelectedSlots([]);
  };

  // --- LOGIC HỦY BỎ (CANCEL) ---
  const handleCancel = () => {
    Alert.alert(
      "Hủy bỏ slot cũ",
      "Bạn xác nhận sẽ mất các slot bị đè và KHÔNG chọn lịch bù?",
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: "Đồng ý Hủy",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiClient.post("/api/BookingConsent/resolve", {
                consentId: consentId,
                action: "Cancel",
              });

              if (notificationId) {
                try {
                  await apiClient.put(
                    `/api/Notifications/${notificationId}/read`
                  );
                } catch (err) {}
              }

              Alert.alert("Đã hủy", "Bạn đã hủy bỏ các slot bị trùng.");
              router.replace("/(tabs)/notifications");
            } catch (e) {
              Alert.alert("Lỗi", "Không thể thực hiện tác vụ.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // --- LOGIC XÁC NHẬN ĐỔI (RESCHEDULE) ---
  const handleConfirm = async () => {
    if (!context) return;

    // Validate: Chỉ cần > 0 là được
    if (newSelectedSlots.length === 0) {
      Alert.alert("Chưa chọn lịch", "Vui lòng chọn ít nhất 1 slot để bù.");
      return;
    }

    const isFull = newSelectedSlots.length === context.slotDebtCount;
    const message = isFull
      ? "Bạn chắc chắn muốn chọn các slot này?"
      : `Bạn chỉ chọn ${newSelectedSlots.length}/${context.slotDebtCount} slot. Các slot còn thiếu sẽ bị hủy. Bạn có chắc chắn không?`;

    Alert.alert("Xác nhận đổi", message, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            setIsSubmitting(true);
            await apiClient.post("/api/BookingConsent/resolve", {
              consentId: consentId,
              action: "Reschedule",
              newSlots: newSelectedSlots,
            });

            // if (notificationId) {
            //     try { await apiClient.put(`/api/Notifications/${notificationId}/read`); } catch (err) {}
            // }

            Alert.alert(
              "Thành công",
              "Đã gửi yêu cầu lịch mới. Chú ý kiểm tra thông báo sau này."
            );
            router.replace("/(tabs)/notifications");
          } catch (e) {
            Alert.alert("Lỗi", "Không thể cập nhật lịch.");
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  if (isLoading || !context)
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
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. HEADER */}
      <BookingPageHeader
        icon={headerIcon}
        title="Chọn lịch bù"
        subtitle={`Phòng: ${context.labName || "Unknown"}`}
      />

      {/* 2. INFO BAR */}
      <View style={styles.infoBar}>
        <Info size={16} color="#C2410C" />
        <Text style={styles.infoText}>
          Bạn bị mất{" "}
          <Text style={{ fontWeight: "bold" }}>{context.slotDebtCount}</Text>{" "}
          slot. Vui lòng chọn lịch bù (tối đa {context.slotDebtCount}).
        </Text>
      </View>

      {/* 3. CALENDAR NAV */}
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

      {/* 4. GRID */}
      <View style={styles.calendarContainer}>
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

        {isBusyLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#EA580C" />
          </View>
        )}

        <View style={[styles.slotsGrid, isBusyLoading && { opacity: 0.5 }]}>
          {weekDates.map((date, i) => (
            <View key={i} style={styles.dayColumn}>
              {allSlotsTemplate.map((slot) => {
                const dateStr = formatDateLocal(date);

                // --- LOGIC MÀU SẮC ---
                const isSafe = context.safeSlots?.some(
                  (s) => s.date === dateStr && s.slotId === slot.id
                );
                const isLost = context.lostSlots?.some(
                  (s) => s.date === dateStr && s.slotId === slot.id
                );

                const isInSystemBusy = systemBusySlots.some(
                  (s: any) =>
                    s.date.split("T")[0] === dateStr && s.slotId === slot.id
                );
                const isBusyByOthers = isInSystemBusy && !isSafe && !isLost;

                const isSelected = newSelectedSlots.some(
                  (s) => s.date === dateStr && s.slotId === slot.id
                );

                // --- LOGIC DISABLE THỜI GIAN ---
                // Lấy ngày hiện tại (local time) dạng chuỗi YYYY-MM-DD để so sánh
                const todayStr = formatDateLocal(new Date());

                // isPast: Nếu ngày của slot < ngày hôm nay -> Quá khứ
                // Nếu ngày của slot === ngày hôm nay -> Cũng coi là Past (theo yêu cầu của bạn)
                // => dateStr <= todayStr
                // (Vì dateStr và todayStr đều format YYYY-MM-DD nên so sánh chuỗi là an toàn)
                const isPast = dateStr <= todayStr;

                const isDisabled = isSafe || isLost || isBusyByOthers || isPast;

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotButton,
                      isSafe && styles.safeSlot,
                      isLost && styles.lostSlot,
                      isBusyByOthers && styles.busySlot,
                      isSelected && styles.selectedSlot,
                      isPast && styles.pastSlot,
                    ]}
                    onPress={() =>
                      handleToggleSlot(dateStr, slot.id, isDisabled)
                    }
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.slotLabel,
                        isSafe && styles.safeSlotText,
                        isLost && styles.lostSlotText,
                        isBusyByOthers && styles.busySlotText,
                        isSelected && styles.selectedSlotText,
                      ]}
                      numberOfLines={1}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* 5. LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.safeSlot]} />
          <Text style={styles.legendText}>Giữ lại</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.lostSlot]} />
          <Text style={styles.legendText}>Bị mất</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSlot]} />
          <Text style={styles.legendText}>Chọn mới</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.busySlot]} />
          <Text style={styles.legendText}>Đã kín</Text>
        </View>
      </View>

      {/* 6. FOOTER - 2 NÚT BẤM */}
      <View style={styles.footerContainer}>
        {/* Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.selectionText}>Đã chọn: </Text>
          <Text
            style={[
              newSelectedSlots.length === context.slotDebtCount
                ? { color: "#16A34A" }
                : { color: "#EA580C" },
              { fontWeight: "bold", fontSize: 16 },
            ]}
          >
            {newSelectedSlots.length}
          </Text>
          <Text style={styles.selectionText}> / {context.slotDebtCount}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.footerButtons}>
          <View style={{ flex: 1 }}>
            <BookingButton
              label="Hủy bỏ"
              variant="secondary"
              onPress={handleCancel}
              isLoading={isSubmitting}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <BookingButton
              label="Xác nhận"
              variant="primary"
              onPress={handleConfirm}
              disabled={newSelectedSlots.length === 0}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 120 }, // Padding bottom lớn hơn để tránh footer
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
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
    borderColor: "#F1F5F9",
  },
  slotLabel: { fontSize: 11, fontWeight: "500", color: "#0F172A" },

  // --- VARIANTS ---
  safeSlot: { backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" },
  safeSlotText: { color: "#1E40AF" },

  lostSlot: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    opacity: 0.6,
  },
  lostSlotText: { color: "#991B1B", textDecorationLine: "line-through" },

  busySlot: { backgroundColor: "#FEFCE8", borderColor: "#FACC15" },
  busySlotText: { color: "#A16207" },

  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  selectedSlotText: { color: "#fff", fontWeight: "600" },

  pastSlot: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.3,
  },

  // --- LEGEND ---
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: "#64748B" },

  // --- FOOTER MỚI ---
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
