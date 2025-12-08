import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
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
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";
import SlotTimeInfo from "../../components/home/SlotTimeInfo";

import apiClient from "@/utils/api";

// ====================================================================
// --- API ---
// ====================================================================

// const apiClient = axios.create({
//   baseURL: "http://192.168.1.149:7089/api",
// });

const api_getSlotTemplates = async () => {
  const response = await apiClient.get("/api/Slot");
  console.log("✅ Loaded slot templates:", response.data);
  return response.data;
};

const api_getRoomDetails = async (roomId: string) => {
  const response = await apiClient.get(`/api/LabRooms/${roomId}`);
  console.log("✅ Loaded room details:", response.data);
  return response.data;
};

const api_getUnavailableSlots = async (
  roomId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const response = await apiClient.get("/api/BookingSlot", {
      params: { LabRoomId: roomId, StartDate: startDate, EndDate: endDate },
    });
    console.log("✅ Loaded unavailable slots:", response.data);
    return response.data;
  } catch (e: any) {
    console.error("Lỗi tải lịch:", e);
    return [];
  }
};

// ====================================================================
// --- HELPER ---
// ====================================================================

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

// So sánh 2 chuỗi ngày (YYYY-MM-DD) an toàn
const isSameDate = (d1: string, d2: string) => {
  if (!d1 || !d2) return false;
  return d1.split("T")[0] === d2.split("T")[0];
};

// Check 2 tiếng
const isTimeRestricted = (date: Date, timeString: string) => {
  if (!timeString) return false;
  const [hours, minutes] = timeString.split(":").map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hours, minutes, 0, 0);
  const now = new Date();
  // Slot phải lớn hơn (Hiện tại + 2 tiếng)
  const restrictedThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return slotTime < restrictedThreshold;
};

// ====================================================================
// --- COMPONENT ---
// ====================================================================

export default function BookSlots() {
  const router = useRouter();
  const { type = "project", roomId } = useLocalSearchParams();
  const isRecurring = type === "teaching_recurring";
  const isFlexibleTeaching = type === "teaching_flexible";
  const isProject = type === "project";
  const isPriority = type === "priority";

  const myPriority = isPriority ? 1 : 2;

  // --- STATE ---
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [anchorDate, setAnchorDate] = useState<Date | null>(null);

  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [baseSlots, setBaseSlots] = useState<
    { dayIndex: number; slotId: string }[]
  >([]);
  const [numWeeks, setNumWeeks] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; slotId: string; isConflict: boolean }[]
  >([]);

  const [unavailableSlots, setUnavailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isLoadingUnavailable, setIsLoadingUnavailable] = useState(true);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  const maxSlotsTotal = useMemo(() => {
    if (isFlexibleTeaching) return 20;
    if (isProject) return 10;
    if (isRecurring) return 20;
    if (isPriority) return 4;
    return 5;
  }, [isFlexibleTeaching, isProject, isRecurring, isPriority]);

  const maxWeeksAllowed = useMemo(() => {
    if (!isRecurring || baseSlots.length === 0) return 0;
    return Math.floor(maxSlotsTotal / baseSlots.length);
  }, [baseSlots, isRecurring, maxSlotsTotal]);

  // --- Init View ---
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(currentMonday);
      newDate.setDate(currentMonday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
  }, [currentMonday]);

  // --- Reset ---
  useEffect(() => {
    setBaseSlots([]);
    setNumWeeks(1);
    setSelectedSlots([]);
    setAnchorDate(null);
  }, [isRecurring]);

  // --- Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const slots = await api_getSlotTemplates();
        setAllSlots(slots);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const loadRoom = async () => {
      try {
        const room = await api_getRoomDetails(roomId as string);
        setRoomDetails(room);
      } finally {
        setIsLoadingRoom(false);
      }
    };
    loadRoom();
  }, [roomId]);

  // --- Load Unavailable (UI Only) ---
  useEffect(() => {
    if (!roomId || weekDates.length === 0) return;
    const loadBooked = async () => {
      setIsLoadingUnavailable(true);
      try {
        const start = formatDateLocal(weekDates[0]);
        const end = formatDateLocal(weekDates[6]);
        const data = await api_getUnavailableSlots(
          roomId as string,
          start,
          end
        );
        setUnavailableSlots(data);
      } finally {
        setIsLoadingUnavailable(false);
      }
    };
    loadBooked();
  }, [roomId, weekDates]);

  // --- Logic Display Selected Slots ---
  useEffect(() => {
    if (!isRecurring) return;
    if (baseSlots.length === 0) {
      setSelectedSlots([]);
      if (anchorDate !== null) setAnchorDate(null);
      return;
    }
    if (allSlots.length === 0) return;

    const startPoint = anchorDate || currentMonday;
    const newSelectedSlots: {
      date: string;
      slotId: string;
      isConflict: boolean;
    }[] = [];

    for (let week = 0; week < numWeeks; week++) {
      for (const baseSlot of baseSlots) {
        const targetDate = new Date(startPoint);
        targetDate.setDate(startPoint.getDate() + week * 7 + baseSlot.dayIndex);
        const dateString = formatDateLocal(targetDate);

        const blockedSlot = unavailableSlots.find(
          (s) => isSameDate(s.date, dateString) && s.slotId === baseSlot.slotId
        );
        const existingPriority = blockedSlot?.priority ?? 2;
        const isMaintenance = existingPriority === 0;
        const canOverride =
          blockedSlot &&
          !isMaintenance &&
          myPriority === 1 &&
          existingPriority === 2;

        newSelectedSlots.push({
          date: dateString,
          slotId: baseSlot.slotId,
          isConflict: !!blockedSlot && !canOverride,
        });
      }
    }
    setSelectedSlots(newSelectedSlots);
  }, [
    baseSlots,
    numWeeks,
    anchorDate,
    unavailableSlots,
    isRecurring,
    allSlots,
    weekDates,
    myPriority,
    currentMonday,
  ]);

  // --- HÀM QUÉT TRÙNG TƯƠNG LAI (QUAN TRỌNG) ---
  const checkFutureConflicts = async (
    dayIndex: number,
    slotId: string,
    startMon: Date,
    weeksToCheck: number
  ) => {
    // Lấy khoảng thời gian rộng hơn (WeeksToCheck * 7 ngày)
    const endDate = new Date(startMon);
    endDate.setDate(startMon.getDate() + weeksToCheck * 7 + 7);

    const startStr = formatDateLocal(startMon);
    const endStr = formatDateLocal(endDate);

    console.log(
      `Scanning future: ${startStr} -> ${endStr} for ${weeksToCheck} weeks`
    );
    const busyData = await api_getUnavailableSlots(
      roomId as string,
      startStr,
      endStr
    );

    for (let w = 0; w < weeksToCheck; w++) {
      const targetDate = new Date(startMon);
      targetDate.setDate(startMon.getDate() + w * 7 + dayIndex);
      const targetDateStr = formatDateLocal(targetDate);

      const conflictItem = busyData.find(
        (s: any) => isSameDate(s.date, targetDateStr) && s.slotId === slotId
      );

      if (conflictItem) {
        console.log(
          `Conflict found at ${targetDateStr}, Priority: ${conflictItem.priority}`
        );
        const existingPriority = conflictItem.priority ?? 2;
        const isMaintenance = existingPriority === 0;

        // Chỉ cho phép đè nếu: Không phải bảo trì + Tôi là 1 + Họ là 2
        const canOverride =
          !isMaintenance && myPriority === 1 && existingPriority === 2;

        if (!canOverride) {
          return {
            isConflict: true,
            conflictDate: targetDateStr,
            reason: isMaintenance ? "đang bảo trì" : "đã có lịch khác",
          };
        }
      }
    }
    return { isConflict: false, conflictDate: null, reason: null };
  };

  // --- [FIX] Check khi Thay đổi số tuần ---
  const handleChangeNumWeeks = async (newWeekValue: number) => {
    if (baseSlots.length === 0) return;
    const clampedWeeks = Math.max(1, Math.min(newWeekValue, maxWeeksAllowed));

    // Nếu tăng số tuần -> Phải check conflict cho các tuần mới thêm vào
    if (clampedWeeks > numWeeks) {
      setIsCheckingConflict(true);
      const startPoint = anchorDate || currentMonday;

      // Check từng slot trong baseSlots xem có bị vướng ở các tuần mới không
      for (const slot of baseSlots) {
        // Ép kiểu 'any' để tránh lỗi TS
        const checkResult: any = await checkFutureConflicts(
          slot.dayIndex,
          slot.slotId,
          startPoint,
          clampedWeeks
        );

        if (checkResult.isConflict) {
          setIsCheckingConflict(false);
          const slotInfo = allSlots.find((s) => s.id === slot.slotId);
          const dayName = weekdays_short[slot.dayIndex];
          let dateDisplay = checkResult.conflictDate || "";
          if (dateDisplay.includes("-")) {
            const [y, m, d] = dateDisplay.split("-");
            dateDisplay = `${d}/${m}/${y}`;
          }

          Alert.alert(
            "Không thể tăng tuần",
            `Nếu tăng lên ${clampedWeeks} tuần, Slot ${slotInfo?.label} vào ${dayName} ngày ${dateDisplay} sẽ bị trùng (${checkResult.reason}).\n\nVui lòng chọn slot khác hoặc giữ nguyên số tuần.`
          );
          return; // Dừng, không setNumWeeks
        }
      }
      setIsCheckingConflict(false);
    }

    setNumWeeks(clampedWeeks);
  };

  // --- Toggle Recurring ---
  const toggleRecurringSlot = async (dayIndex: number, slotId: string) => {
    let startPoint = anchorDate;
    if (!startPoint || currentMonday < startPoint) startPoint = currentMonday;

    const targetDateThisWeek = new Date(currentMonday);
    targetDateThisWeek.setDate(currentMonday.getDate() + dayIndex);
    const dateString = formatDateLocal(targetDateThisWeek);
    const slotInfo = allSlots.find((s) => s.id === slotId);

    if (isTimeRestricted(targetDateThisWeek, slotInfo?.startTime)) {
      Alert.alert("Không hợp lệ", "Slot này quá gần giờ hiện tại.");
      return;
    }

    const unavailableSlotThisWeek = unavailableSlots.find(
      (s) => isSameDate(s.date, dateString) && s.slotId === slotId
    );
    if (!checkCanSelect(unavailableSlotThisWeek)) return;

    const isSelecting = !baseSlots.some(
      (s) => s.dayIndex === dayIndex && s.slotId === slotId
    );

    if (isSelecting) {
      setIsCheckingConflict(true);
      const checkResult: any = await checkFutureConflicts(
        dayIndex,
        slotId,
        startPoint,
        numWeeks
      );
      setIsCheckingConflict(false);

      if (checkResult.isConflict) {
        const dayName = weekdays_short[dayIndex];
        let dateDisplay = checkResult.conflictDate || "";
        if (dateDisplay.includes("-")) {
          const [y, m, d] = dateDisplay.split("-");
          dateDisplay = `${d}/${m}/${y}`;
        }
        Alert.alert(
          "Trùng lịch",
          `Slot ${slotInfo?.label} vào ${dayName} ngày ${dateDisplay} ${checkResult.reason}.`
        );
        return;
      }
    }

    if (baseSlots.length === 0 || (anchorDate && currentMonday < anchorDate)) {
      setAnchorDate(currentMonday);
    }

    const newBaseSlots = [...baseSlots];
    const idx = newBaseSlots.findIndex(
      (s) => s.dayIndex === dayIndex && s.slotId === slotId
    );
    if (idx > -1) newBaseSlots.splice(idx, 1);
    else newBaseSlots.push({ dayIndex, slotId });

    if (newBaseSlots.length > 0) {
      const newMax = Math.floor(maxSlotsTotal / newBaseSlots.length);
      if (numWeeks > newMax) setNumWeeks(newMax);
    } else {
      setNumWeeks(1);
    }
    setBaseSlots(newBaseSlots);
  };

  // --- Other Handlers ---
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

  const checkCanSelect = (unavailableSlot: any) => {
    if (!unavailableSlot) return true;
    const existingPriority = unavailableSlot.priority ?? 2;
    if (existingPriority === 0) {
      Alert.alert("Bảo trì", "Phòng đang bảo trì, không thể chọn.");
      return false;
    }
    if (myPriority === 1 && existingPriority === 2) return true;

    Alert.alert("Không thể chọn", "Slot này đã có người đặt.");
    return false;
  };

  const toggleMultiSlot = (date: Date, slotId: string) => {
    const dateString = formatDateLocal(date);
    const slotInfo = allSlots.find((s) => s.id === slotId);

    if (isTimeRestricted(date, slotInfo?.startTime)) {
      Alert.alert("Không hợp lệ", "Slot quá gần giờ hiện tại.");
      return;
    }

    const unavailableSlot = unavailableSlots.find(
      (s) => isSameDate(s.date, dateString) && s.slotId === slotId
    );
    if (!checkCanSelect(unavailableSlot)) return;

    let isBooked = !!unavailableSlot;
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
        Alert.alert("Đã đạt giới hạn", `Tối đa ${maxSlotsTotal} slot.`);
        return;
      }
      setSelectedSlots([
        ...selectedSlots,
        { date: dateString, slotId, isConflict: isBooked },
      ]);
    }
  };

  const handleToggleSlot = (date: Date, slotId: string, dayIndex: number) => {
    if (isRecurring) toggleRecurringSlot(dayIndex, slotId);
    else toggleMultiSlot(date, slotId);
  };

  const goToDevices = async () => {
    // 1. Validate cơ bản
    if (selectedSlots.length === 0) {
      Alert.alert(
        "Chưa chọn slot",
        "Vui lòng chọn ít nhất một giờ học/làm việc."
      );
      return;
    }

    // 2. Phân loại slot (Chủ yếu để debug hoặc nếu bạn muốn hiện Alert xác nhận ngay tại đây)
    const normalSlots = selectedSlots.filter((s) => !s.isConflict);
    const overrideSlots = selectedSlots.filter((s) => s.isConflict);

    console.log(`[Navigation] Chuẩn bị sang trang Device:`);
    console.log(`- Tổng slot: ${selectedSlots.length}`);
    console.log(`- Slot trống (Đặt mới): ${normalSlots.length}`);
    console.log(`- Slot trùng (Ghi đè): ${overrideSlots.length}`);

    try {
      // 3. Lấy dữ liệu booking hiện tại từ Storage
      const currentStr = await AsyncStorage.getItem("currentBooking");
      const currentBooking = currentStr ? JSON.parse(currentStr) : {};

      // 4. Đóng gói dữ liệu mới
      const updatedBookingData = {
        ...currentBooking,

        // A. Lưu toàn bộ slot đã chọn (bao gồm cả cờ isConflict)
        slots: selectedSlots,

        // B. Lưu thông tin thiết bị có sẵn của phòng (để trang Device hiển thị Read-only)
        existingDevices: roomDetails?.equipments || [],

        // C. Lưu thêm thông tin phòng (để trang sau hiển thị Header đẹp)
        roomName: roomDetails?.labName,
        roomLocation: roomDetails?.location,
        maximumLimit: roomDetails?.maximumLimit || 0,
      };

      // 5. Lưu xuống Storage
      await AsyncStorage.setItem(
        "currentBooking",
        JSON.stringify(updatedBookingData)
      );

      // 6. Chuyển trang
      router.push("/book/devices" as any);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu chuyển trang:", error);
      Alert.alert(
        "Lỗi hệ thống",
        "Không thể lưu dữ liệu đặt phòng. Vui lòng thử lại."
      );
    }
  };

  const selectionInfo = useMemo(() => {
    if (isRecurring) {
      if (baseSlots.length === 0) return "Chưa chọn slot";
      return (
        <>
          <Text style={{ fontWeight: "bold" }}>{baseSlots.length}</Text>{" "}
          slot/tuần. Tổng:{" "}
          <Text style={{ fontWeight: "bold" }}>{selectedSlots.length}</Text> /{" "}
          {maxSlotsTotal} slots
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

  const isLoading = isLoadingSlots || isLoadingRoom;
  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  if (!roomDetails)
    return (
      <View style={styles.centered}>
        <Text>Lỗi tải dữ liệu</Text>
      </View>
    );

  const startDateStr = weekDates[0]
    ? `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1}`
    : "";
  const endDateStr = weekDates[6]
    ? `${weekDates[6].getDate()}/${
        weekDates[6].getMonth() + 1
      }/${weekDates[6].getFullYear()}`
    : "";
  const dateRange = `${startDateStr} - ${endDateStr}`;
  const weeksDiffFromStart = Math.floor(
    (currentMonday.getTime() - (anchorDate || currentMonday).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

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
      <BookingProgress step={2} />
      <BookingPageHeader
        icon={headerIcon}
        title={roomDetails.labName}
        subtitle={`${roomDetails.location} - ${roomDetails.maximumLimit} chỗ`}
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
          {weekDates.map((date, idx) => (
            <View key={idx} style={styles.dayHeader}>
              <Text style={styles.dayNameText}>{weekdays_short[idx]}</Text>
              <Text style={styles.dateNumText}>{date.getDate()}</Text>
            </View>
          ))}
        </View>

        {(isLoadingUnavailable || isCheckingConflict) && (
          <View style={styles.slotsLoading}>
            <ActivityIndicator size="small" color="#EA580C" />
            {isCheckingConflict && (
              <Text style={styles.checkingText}>Kiểm tra lịch...</Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.slotsGrid,
            (isLoadingUnavailable || isCheckingConflict) && styles.hidden,
          ]}
        >
          {weekDates.map((date, dayIndex) => (
            <View key={dayIndex} style={styles.dayColumn}>
              {allSlots.map((slot) => {
                const dateString = formatDateLocal(date);
                const unavailableSlot = unavailableSlots.find(
                  (s) => isSameDate(s.date, dateString) && s.slotId === slot.id
                );
                const existingPriority = unavailableSlot?.priority ?? 2;
                const isMaintenance = existingPriority === 0;
                const canOverride =
                  unavailableSlot &&
                  !isMaintenance &&
                  myPriority === 1 &&
                  existingPriority === 2;
                const isDisabled = unavailableSlot && !canOverride;
                const isRestricted = isTimeRestricted(date, slot.startTime);

                let isSelected = false;
                if (isRecurring) {
                  const isInSelectedWeekRange =
                    weeksDiffFromStart >= 0 && weeksDiffFromStart < numWeeks;
                  if (isInSelectedWeekRange)
                    isSelected = baseSlots.some(
                      (s) => s.dayIndex === dayIndex && s.slotId === slot.id
                    );
                } else {
                  isSelected = selectedSlots.some(
                    (s) => s.date === dateString && s.slotId === slot.id
                  );
                }

                let slotStyle: any = styles.availableSlot;
                let textStyle: any = [styles.slotLabel];

                if (isSelected) {
                  slotStyle = styles.selectedSlot;
                  textStyle.push(styles.selectedSlotText);
                } else if (canOverride) {
                  slotStyle = styles.overrideSlot;
                  textStyle.push(styles.overrideSlotText);
                } else if (isRestricted) {
                  slotStyle = styles.pastSlot;
                  textStyle.push(styles.unavailableSlotText);
                } else if (isDisabled) {
                  if (isMaintenance) {
                    slotStyle = styles.maintenanceSlot;
                    textStyle.push(styles.maintenanceSlotText);
                  } else {
                    slotStyle = styles.unavailableSlot;
                    textStyle.push(styles.unavailableSlotText);
                  }
                }

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => handleToggleSlot(date, slot.id, dayIndex)}
                    disabled={(!isRecurring && isDisabled) || isRestricted}
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
          <Text style={styles.legendText}>Trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSlot]} />
          <Text style={styles.legendText}>Đang chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSlot]} />
          <Text style={styles.legendText}>Đã đặt</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.maintenanceSlot]} />
          <Text style={styles.legendText}>Bảo trì</Text>
        </View>
        {isPriority && (
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.overrideSlot]} />
            <Text style={styles.legendText}>Ghi đè</Text>
          </View>
        )}
      </View>
      {isRecurring && (
        <View style={styles.weekSelectorContainer}>
          <Text style={styles.weekSelectorLabel}>Lặp lại:</Text>
          <View style={styles.weekSelectorControls}>
            <TouchableOpacity
              onPress={() => handleChangeNumWeeks(numWeeks - 1)}
              disabled={numWeeks <= 1}
              style={[
                styles.weekNavButton,
                numWeeks <= 1 && styles.disabledButton,
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
              disabled={numWeeks >= (maxWeeksAllowed || 20)}
              style={[
                styles.weekNavButton,
                numWeeks >= (maxWeeksAllowed || 20) && styles.disabledButton,
              ]}
            >
              <Text style={styles.weekNavText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.selectionText}>
          {isRecurring
            ? `${baseSlots.length} slot/tuần. Tổng: ${selectedSlots.length} slots`
            : `Đã chọn: ${selectedSlots.length} / ${maxSlotsTotal} slot`}
        </Text>
        <BookingButton
          label="Tiếp theo"
          onPress={goToDevices}
          disabled={selectedSlots.length === 0}
        />
      </View>
      <View style={styles.infoSection}>
        <SlotTimeInfo />
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
  navButton: { padding: 8 },
  dateRangeText: { fontSize: 14, fontWeight: "600", color: "#C2410C" },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    position: "relative",
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
  slotButton: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
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
  checkingText: {
    marginTop: 8,
    color: "#EA580C",
    fontWeight: "500",
    fontSize: 12,
  },
  hidden: { opacity: 0.3 },
  slotLabel: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  selectedSlotText: { color: "#fff" },
  // --- SWAPPED COLORS ---
  unavailableSlot: { backgroundColor: "#FEFCE8", borderColor: "#FACC15" }, // Booked = Vàng
  unavailableSlotText: { color: "#A16207" },
  maintenanceSlot: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }, // Maintenance = Xám
  maintenanceSlotText: { color: "#94A3B8", fontWeight: "500" },
  overrideSlot: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FDA4AF",
    borderStyle: "dashed",
  },
  overrideSlotText: { color: "#BE123C", fontWeight: "600" },
  pastSlot: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E1",
    opacity: 0.7,
  },
  conflictSlot: { backgroundColor: "#FFFBEB", borderColor: "#FBBF24" },
  conflictSlotText: { color: "#B45309", fontWeight: "600" },
  legend: {
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    columnGap: 8,
    rowGap: 12,
  },
  legendItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
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
  weekSelectorLabel: { fontSize: 15, fontWeight: "500", color: "#0F172A" },
  weekSelectorControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  weekNavButton: {
    width: 32,
    height: 32,
    backgroundColor: "#FFEDD5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  weekNavText: { fontSize: 20, fontWeight: "600", color: "#EA580C" },
  weekCountText: { fontSize: 15, color: "#0F172A" },
  disabledButton: { backgroundColor: "#F1F5F9" },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: { fontSize: 14, color: "#64748B", flex: 1 },
  infoSection: {
    marginTop: 12,
    // Không cần style nền/border ở đây nữa vì component con đã tự lo
  },
});
