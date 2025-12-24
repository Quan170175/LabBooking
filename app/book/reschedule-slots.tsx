import apiClient from "@/utils/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCcw,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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

interface SlotTemplate {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

// --- HELPER UTILS ---
const WEEKDAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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

// 👇 1. TOOLTIP CONTENT HELPER (Mới thêm)
const getTooltipContent = (status: string, item: any) => {
  // Safe & Lost (Đặc thù trang này)
  if (status === "safe") return "Lịch cũ của bạn\n(Được giữ lại)";
  if (status === "lost") return "Lịch bị trùng\n(Đã bị hủy)";
  if (status === "past") return "Đã quá thời gian";

  // Maintenance & Busy (Logic chung)
  if (status === "maintenance") {
    return item?.description
      ? `Lý do: ${item.description}`
      : item?.title || "Phòng đang bảo trì";
  }

  if (status === "busy") {
    if (item?.title) {
      let content = item.title;
      if (item.bookerName) content += `\n👤 ${item.bookerName}`;
      return content;
    }
    return "Người khác đã đặt";
  }

  return "";
};

// --- CUSTOM HOOK ---
const useRescheduleViewModel = () => {
  const router = useRouter();
  const { consentId, notificationId } = useLocalSearchParams();

  // State Data
  const [context, setContext] = useState<RescheduleContext | null>(null);
  const [allSlotsTemplate, setAllSlotsTemplate] = useState<SlotTemplate[]>([]);
  const [systemBusySlots, setSystemBusySlots] = useState<any[]>([]);

  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [isBusyLoading, setIsBusyLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Selection
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [newSelectedSlots, setNewSelectedSlots] = useState<SimpleSlot[]>([]);

  // 1. Init Data
  useEffect(() => {
    if (!consentId) return;
    const initData = async () => {
      try {
        setIsLoading(true);
        const [resTemplate, resContext] = await Promise.all([
          apiClient.get("/api/Slot"),
          apiClient.get(`/api/BookingConsent/${consentId}/reschedule-context`),
        ]);

        setAllSlotsTemplate(resTemplate.data?.data || resTemplate.data);
        const contextData = resContext.data?.data || resContext.data;
        setContext(contextData);
      } catch (e) {
        Alert.alert("Lỗi", "Không thể tải thông tin đổi lịch.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [consentId]);

  // 2. Load Busy Slots
  useEffect(() => {
    if (!context?.labId) return;
    const loadBusySlots = async () => {
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
        setSystemBusySlots(resBusy.data?.data || resBusy.data || []);
      } catch (e) {
        console.error("Load busy slots failed", e);
      } finally {
        setIsBusyLoading(false);
      }
    };
    loadBusySlots();
  }, [currentMonday, context?.labId]);

  // 3. Computed
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      return d;
    });
  }, [currentMonday]);

  // 4. Handlers
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  const handleToggleSlot = (
    dateStr: string,
    slotId: string,
    isDisabled: boolean
  ) => {
    if (isDisabled) return;

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

    setNewSelectedSlots((prev) => {
      const exists = prev.find(
        (s) => s.date === dateStr && s.slotId === slotId
      );
      if (exists) return prev.filter((s) => s !== exists);
      return [...prev, { date: dateStr, slotId }];
    });
  };

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
                consentId,
                action: "Cancel",
              });
              if (notificationId)
                await apiClient
                  .put(`/api/Notifications/${notificationId}/read`)
                  .catch(() => {});
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

  const handleConfirm = () => {
    if (!context) return;
    if (newSelectedSlots.length === 0) {
      Alert.alert("Chưa chọn lịch", "Vui lòng chọn ít nhất 1 slot để bù.");
      return;
    }
    const isFull = newSelectedSlots.length === context.slotDebtCount;
    const message = isFull
      ? "Bạn chắc chắn muốn chọn các slot này?"
      : `Bạn chỉ chọn ${newSelectedSlots.length}/${context.slotDebtCount} slot. Các slot còn thiếu sẽ bị hủy.`;

    Alert.alert("Xác nhận đổi", message, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            setIsSubmitting(true);

            const finalSlots = [
              ...(context.safeSlots || []),
              ...newSelectedSlots,
            ];

            await apiClient.post("/api/BookingConsent/resolve", {
              consentId,
              action: "Reschedule",
              newSlots: finalSlots,
            });
            if (notificationId)
              await apiClient
                .put(`/api/Notifications/${notificationId}/read`)
                .catch(() => {});
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

  return {
    context,
    allSlotsTemplate,
    systemBusySlots,
    isLoading,
    isBusyLoading,
    isSubmitting,
    weekDates,
    newSelectedSlots,
    handlePrevWeek,
    handleNextWeek,
    handleToggleSlot,
    handleCancel,
    handleConfirm,
    setNewSelectedSlots,
  };
};

// --- COMPONENT CHÍNH ---
export default function RescheduleSlotsScreen() {
  const {
    context,
    allSlotsTemplate,
    systemBusySlots,
    isLoading,
    isBusyLoading,
    isSubmitting,
    weekDates,
    newSelectedSlots,
    handlePrevWeek,
    handleNextWeek,
    handleToggleSlot,
    handleCancel,
    handleConfirm,
    setNewSelectedSlots,
  } = useRescheduleViewModel();

  // 👇 2. STATE TOOLTIP (Mới thêm)
  const [activeTooltip, setActiveTooltip] = useState<{
    date: string;
    slotId: string;
  } | null>(null);

  // Reset tooltip khi đổi tuần
  useEffect(() => {
    setActiveTooltip(null);
  }, [weekDates]);

  if (isLoading || !context) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  // --- LOGIC QUAN TRỌNG: CHECK STATUS ---
  // (Sửa return thêm busyMatch để dùng cho Tooltip)
  const getSlotStatus = (dateStr: string, slotTemplate: SlotTemplate) => {
    const { id: slotId, label, startTime } = slotTemplate;

    // 1. Safe (Của tôi)
    const isSafe = context.safeSlots?.some(
      (s) => s.date === dateStr && s.slotId === slotId
    );
    if (isSafe)
      return { status: "safe", disabled: true, text: label, data: null };

    // 2. Lost (Của tôi - bị mất)
    const isLost = context.lostSlots?.some(
      (s) => s.date === dateStr && s.slotId === slotId
    );
    if (isLost)
      return { status: "lost", disabled: true, text: label, data: null };

    // 3. Maintenance
    const busyMatch = systemBusySlots.find(
      (s: any) => s.date.split("T")[0] === dateStr && s.slotId === slotId
    );
    if (busyMatch) {
      const isMaintenance =
        busyMatch.priority === 0 ||
        busyMatch.reason === "Maintenance" ||
        busyMatch.type === "Maintenance" ||
        busyMatch.isMaintenance === true;

      if (isMaintenance)
        return {
          status: "maintenance",
          disabled: true,
          text: "Bảo trì",
          data: busyMatch,
        };
    }

    // 4. Past
    const now = new Date();
    const todayStr = formatDateLocal(now);

    if (dateStr < todayStr) {
      return { status: "past", disabled: true, text: label, data: null };
    } else if (dateStr === todayStr) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);

      if (now > slotTime) {
        return { status: "past", disabled: true, text: label, data: null };
      }
    }

    // 5. Busy (Người khác đặt)
    if (busyMatch) {
      return { status: "busy", disabled: true, text: label, data: busyMatch };
    }

    // 6. Selected
    const isSelected = newSelectedSlots.some(
      (s) => s.date === dateStr && s.slotId === slotId
    );
    if (isSelected)
      return { status: "selected", disabled: false, text: label, data: null };

    // 7. Free
    return { status: "free", disabled: false, text: label, data: null };
  };

  // 👇 Handler xử lý click (Phân luồng: Tooltip hay Select)
  const handleSlotPress = (
    dateStr: string,
    slotId: string,
    status: string,
    disabled: boolean
  ) => {
    // Nếu đang mở đúng tooltip đó thì đóng
    if (activeTooltip?.date === dateStr && activeTooltip?.slotId === slotId) {
      setActiveTooltip(null);
      return;
    }

    // Nếu slot không chọn được (Busy, Maintenance, Safe, Lost...) -> HIỆN TOOLTIP
    if (disabled) {
      setActiveTooltip({ date: dateStr, slotId });
      return;
    }

    // Nếu slot chọn được -> Chọn và đóng tooltip (nếu có)
    setActiveTooltip(null);
    handleToggleSlot(dateStr, slotId, disabled);
  };

  // --- RENDER ---
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
        title="Chọn lịch bù"
        subtitle={`Phòng: ${context.labName || "Unknown"}`}
      />

      {/* Info Warning */}
      <View style={styles.infoBar}>
        <Info size={16} color="#C2410C" />
        <Text style={styles.infoText}>
          Cần bù{" "}
          <Text style={{ fontWeight: "bold" }}>{context.slotDebtCount}</Text>{" "}
          slot.
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
          <ChevronLeft size={20} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity
            onPress={() => setNewSelectedSlots([])}
            style={styles.navButton}
          >
            <RefreshCcw size={18} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
            <ChevronRight size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Grid */}
      <View style={styles.calendarContainer}>
        {/* Header Ngày */}
        <View style={styles.weekdaysHeader}>
          {weekDates.map((d, i) => {
            const isToday = formatDateLocal(d) === formatDateLocal(new Date());
            return (
              <View key={i} style={styles.dayHeader}>
                <Text style={styles.dayNameText}>{WEEKDAYS_SHORT[i]}</Text>
                <Text style={[styles.dateNumText, isToday && styles.todayText]}>
                  {d.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        {isBusyLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#EA580C" />
          </View>
        )}

        {/* Slots Logic */}
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.slotsGrid, isBusyLoading && { opacity: 0.5 }]}
          onPress={() => setActiveTooltip(null)} // Click ra ngoài thì tắt tooltip
        >
          {weekDates.map((date, i) => (
            <View key={i} style={styles.dayColumn}>
              {allSlotsTemplate.map((slot) => {
                const dateStr = formatDateLocal(date);
                const { status, disabled, text, data } = getSlotStatus(
                  dateStr,
                  slot
                );

                // Check hiển thị Tooltip
                const isTooltipVisible =
                  activeTooltip?.date === dateStr &&
                  activeTooltip?.slotId === slot.id;

                return (
                  // 👇 Bọc View để xử lý zIndex cho Tooltip
                  <View
                    key={slot.id}
                    style={{ zIndex: isTooltipVisible ? 100 : 1 }}
                  >
                    {/* --- PHẦN TOOLTIP --- */}
                    {isTooltipVisible && (
                      <View style={styles.tooltipContainer}>
                        <View style={styles.tooltipBubble}>
                          {/* Badge Status */}
                          {data?.typeLabel && (
                            <View
                              style={{
                                backgroundColor:
                                  status === "maintenance"
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
                                {data.typeLabel.toUpperCase()}
                              </Text>
                            </View>
                          )}

                          <Text style={styles.tooltipText}>
                            {getTooltipContent(status, data)}
                          </Text>
                          <Text style={styles.tooltipSubText}>
                            {slot.startTime} - {slot.endTime}
                          </Text>
                        </View>
                        <View style={styles.tooltipArrow} />
                      </View>
                    )}

                    {/* --- BUTTON SLOT --- */}
                    <TouchableOpacity
                      style={[
                        styles.slotButton,
                        status === "safe" && styles.safeSlot,
                        status === "lost" && styles.lostSlot,
                        status === "maintenance" && styles.maintenanceSlot,
                        status === "busy" && styles.busySlot,
                        status === "past" && styles.pastSlot,
                        status === "selected" && styles.selectedSlot,
                      ]}
                      activeOpacity={0.7}
                      // 👇 Bỏ disabled={disabled} cũ đi, tự xử lý ở onPress
                      onPress={() =>
                        handleSlotPress(dateStr, slot.id, status, disabled)
                      }
                    >
                      <Text
                        style={[
                          styles.slotLabel,
                          status === "safe" && styles.safeSlotText,
                          status === "lost" && styles.lostSlotText,
                          status === "maintenance" &&
                            styles.maintenanceSlotText,
                          status === "busy" && styles.busySlotText,
                          status === "past" && styles.pastText,
                          status === "selected" && styles.selectedSlotText,
                        ]}
                        numberOfLines={1}
                      >
                        {text}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </TouchableOpacity>
      </View>

      {/* Legend / Tooltip */}
      <View style={styles.legend}>
        <LegendItem colorStyle={styles.legendEmpty} label="Trống" />
        <LegendItem colorStyle={styles.selectedSlot} label="Đang chọn" />
        <LegendItem colorStyle={styles.safeSlot} label="Của bạn" />
        <LegendItem colorStyle={styles.busySlot} label="Đã kín" />
        <LegendItem colorStyle={styles.maintenanceSlot} label="Bảo trì" />
        <LegendItem colorStyle={styles.lostSlot} label="Bị mất" />
        <LegendItem colorStyle={styles.pastSlot} label="Quá hạn" />
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.footerInfo}>
          <Text style={styles.selectionText}>Đã chọn: </Text>
          <Text
            style={[
              styles.countText,
              newSelectedSlots.length === context.slotDebtCount
                ? styles.countFull
                : styles.countWarning,
            ]}
          >
            {newSelectedSlots.length}
          </Text>
          <Text style={styles.selectionText}> / {context.slotDebtCount}</Text>
        </View>

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

const LegendItem = ({
  colorStyle,
  label,
}: {
  colorStyle: any;
  label: string;
}) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendBox, colorStyle]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 120 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },

  // 👇 TOOLTIP STYLES (Mới thêm)
  tooltipContainer: {
    position: "absolute",
    bottom: "110%", // Đẩy lên trên slot
    left: -50, // Căn giữa tương đối (cần chỉnh nếu UI lệch)
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
    color: "#FECACA", // Màu đỏ nhạt/hồng nhạt cho dễ đọc
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#1E293B",
    marginTop: -1,
  },

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

  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    minHeight: 200,
    zIndex: 1, // Để tooltip hiển thị lên trên
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  todayText: { color: "#EA580C" },
  slotsGrid: { flexDirection: "row", gap: 8 },
  dayColumn: { flex: 1, gap: 8 },

  // SLOT STYLES
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

  // STATUS COLORS
  legendEmpty: { backgroundColor: "#fff", borderColor: "#E2E8F0" },

  safeSlot: { backgroundColor: "#DCFCE7", borderColor: "#16A34A" },
  safeSlotText: { color: "#15803D", fontWeight: "700" },

  busySlot: {
    backgroundColor: "#FEF9C3",
    borderColor: "#FACC15",
    opacity: 0.9,
  },
  busySlotText: { color: "#854D0E" },

  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  selectedSlotText: { color: "#fff", fontWeight: "700" },

  lostSlot: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    opacity: 0.7,
  },
  lostSlotText: { color: "#B91C1C", textDecorationLine: "line-through" },

  maintenanceSlot: { backgroundColor: "#FEF2F2", borderColor: "#EF4444" },
  maintenanceSlotText: { color: "#DC2626", fontWeight: "700", fontSize: 10 },

  pastSlot: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.4,
  },
  pastText: { color: "#94A3B8" },

  // LEGEND & FOOTER
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

  footerContainer: { marginTop: 24 },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 12,
  },
  selectionText: { fontSize: 14, color: "#64748B" },
  countText: { fontWeight: "bold", fontSize: 16 },
  countFull: { color: "#16A34A" },
  countWarning: { color: "#EA580C" },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
