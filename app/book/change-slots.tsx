import axios from "axios";
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
  View
} from "react-native";
import { Path, Svg } from "react-native-svg";
import BookingButton from "../../components/booking/BookingButton";
import BookingPageHeader from "../../components/booking/BookingPageHeader";

const apiClient = axios.create({
  baseURL: "https://localhost:7089/api",
});

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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const isTimeRestricted = (date: Date, timeString: string) => {
    if (!timeString) return false;
    const [hours, minutes] = timeString.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const restrictedThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000); 
    return slotTime < restrictedThreshold;
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
  
  // Snapshot để tính toán Diff (Hủy/Thêm) và Reset
  const [originalSnapshot, setOriginalSnapshot] = useState<any[]>([]); 

  // --- 1. FETCH DATA (Dùng useCallback để gọi lại khi Reset) ---
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // A. Template
      const resSlot = await apiClient.get("/Slot");
      setAllSlotsTemplate(resSlot.data);

      // B. Booking Detail
      const resBooking = await apiClient.get(`/Bookings/${bookingId}`);
      const myBooking = resBooking.data;
      setBookingDetail(myBooking);

      // C. Init State
      if (myBooking.slots) {
          const initialSlots = myBooking.slots.map((s:any) => ({
              date: s.date.split('T')[0], 
              slotId: s.slotId
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


  // --- 2. LOAD BUSY SLOTS ---
  useEffect(() => {
      const loadBusySlots = async () => {
          if (!bookingDetail) return;
          try {
            setIsBusyLoading(true);
            const startStr = formatDateLocal(currentMonday);
            const endObj = new Date(currentMonday); 
            endObj.setDate(endObj.getDate() + 6);
            const endStr = formatDateLocal(endObj);
            
            const resBusy = await apiClient.get("/BookingSlot", {
                params: { 
                    LabRoomId: bookingDetail.labRoomId,
                    StartDate: startStr,
                    EndDate: endStr
                }
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


  // --- 3. DATE HANDLING ---
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
  }, [currentMonday]);

  const handlePrevWeek = () => setCurrentMonday(prev => { const d = new Date(prev); d.setDate(prev.getDate() - 7); return d; });
  const handleNextWeek = () => setCurrentMonday(prev => { const d = new Date(prev); d.setDate(prev.getDate() + 7); return d; });

  // --- 4. TÍNH TOÁN THAY ĐỔI (Diff Calculation) ---
  const diffInfo = useMemo(() => {
      // 1. Số lượng slot cũ đã bị bỏ (Có trong Original nhưng không có trong Selected)
      const removedCount = originalSnapshot.filter(orig => 
          !selectedSlots.some(curr => curr.date === orig.date && curr.slotId === orig.slotId)
      ).length;

      // 2. Số lượng slot mới được chọn thêm (Có trong Selected nhưng không có trong Original)
      const addedCount = selectedSlots.filter(curr => 
          !originalSnapshot.some(orig => orig.date === curr.date && orig.slotId === curr.slotId)
      ).length;

      return { removedCount, addedCount };
  }, [selectedSlots, originalSnapshot]);


  // --- 5. HANDLERS ---
  const handleReset = () => {
    Alert.alert("Làm mới", "Quay về trạng thái ban đầu?", [
        { text: "Hủy", style: "cancel" },
        { 
            text: "Đồng ý", 
            onPress: () => {
                setSelectedSlots([...originalSnapshot]);
                setCurrentMonday(getMonday(new Date()));
            }
        }
    ]);
  };

  const handleToggleSlot = (dateStr: string, slotId: string, isRestricted: boolean, isMaintenance: boolean, isBusyByOthers: boolean) => {
    if (isRestricted) {
        Alert.alert("Không hợp lệ", "Slot này đã diễn ra hoặc quá gần giờ hiện tại.");
        return;
    }
    if (isMaintenance) {
        Alert.alert("Bảo trì", "Phòng đang được bảo trì vào khung giờ này.");
        return;
    }
    if (isBusyByOthers) {
        Alert.alert("Đã kín", "Slot này đã bị người khác đặt.");
        return;
    }

    const exists = selectedSlots.find(s => s.date === dateStr && s.slotId === slotId);
    if (exists) {
        setSelectedSlots(prev => prev.filter(s => !(s.date === dateStr && s.slotId === slotId)));
    } else {
        setSelectedSlots(prev => [...prev, { date: dateStr, slotId }]);
    }
  };

  const handleNext = () => {
    if (selectedSlots.length === 0) {
        Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 slot.");
        return;
    }
    router.push({
        pathname: "/book/change-detail",
        params: { 
            bookingId: bookingId,
            currentSlots: JSON.stringify(selectedSlots) 
        }
    } as any);
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#EA580C" /></View>;

  const dateRange = `${weekDates[0]?.getDate()}/${weekDates[0]?.getMonth()+1} - ${weekDates[6]?.getDate()}/${weekDates[6]?.getMonth()+1}`;
  const headerIcon = (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#EA580C" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></Svg>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingPageHeader icon={headerIcon} title="Điều chỉnh lịch" subtitle={`Phòng: ${bookingDetail?.labRoomResponse?.labName || "Unknown"}`} />

      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}><ChevronLeft size={20} color="#EA580C" /></TouchableOpacity>
        <Text style={styles.dateRangeText}>{dateRange}</Text>
        <View style={{flexDirection:'row', gap: 4}}>
            <TouchableOpacity onPress={handleReset} style={styles.navButton}><RefreshCcw size={18} color="#EA580C" /></TouchableOpacity>
            <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}><ChevronRight size={20} color="#EA580C" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
         <View style={styles.weekdaysHeader}>
            {weekDates.map((d, i) => (
                <View key={i} style={styles.dayHeader}>
                    <Text style={styles.dayNameText}>{weekdays_short[i]}</Text>
                    <Text style={styles.dateNumText}>{d.getDate()}</Text>
                </View>
            ))}
         </View>

         {isBusyLoading && <View style={styles.loadingOverlay}><ActivityIndicator size="small" color="#EA580C" /></View>}
         
         <View style={[styles.slotsGrid, isBusyLoading && {opacity: 0.5}]}>
            {weekDates.map((date, i) => (
                <View key={i} style={styles.dayColumn}>
                    {allSlotsTemplate.map(slot => {
                        const dateStr = formatDateLocal(date);
                        
                        // --- LOGIC CHECK TRẠNG THÁI ---
                        const isRestricted = isTimeRestricted(date, slot.startTime);
                        
                        const isMyOriginal = bookingDetail?.slots?.some((s: any) => 
                             s.date.split('T')[0] === dateStr && s.slotId === slot.id
                        );

                        // Tìm thông tin trong danh sách bận
                        const unavailableItem = systemBusySlots.find((s: any) => 
                             s.date.split('T')[0] === dateStr && s.slotId === slot.id
                        );
                        
                        const isInSystemBusy = !!unavailableItem;
                        // Priority: 0 = Bảo trì, 2 = Đã đặt
                        const isMaintenance = unavailableItem?.priority === 0;
                        
                        // Chỉ tính là bận nếu không phải là slot của chính mình (để mình còn sửa được)
                        const isBusyByOthers = isInSystemBusy && !isMyOriginal && !isMaintenance; 
                        // Lưu ý: Nếu là Maintenance thì dù là của mình hay không cũng bị khóa (đây là logic thường thấy)

                        const isSelected = selectedSlots.some(s => s.date === dateStr && s.slotId === slot.id);

                        // --- STYLING ---
                        let slotStyle: any = styles.availableSlot;
                        let textStyle: any = styles.slotLabel;
                        let isDisabled = false;

                        if (isRestricted) {
                            slotStyle = styles.pastSlot; 
                            textStyle = styles.unavailableSlotText; 
                            isDisabled = true;
                        } else if (isMaintenance) {
                            slotStyle = styles.maintenanceSlot; 
                            textStyle = styles.maintenanceSlotText; 
                            isDisabled = true;
                        } else if (isBusyByOthers) {
                            slotStyle = styles.unavailableSlot; 
                            textStyle = styles.unavailableSlotText; 
                            isDisabled = true;
                        } else if (isSelected) {
                            slotStyle = styles.selectedSlot; 
                            textStyle = styles.selectedSlotText;
                        }

                        return (
                            <TouchableOpacity 
                                key={slot.id} 
                                style={[styles.slotButton, slotStyle]}
                                onPress={() => handleToggleSlot(dateStr, slot.id, isRestricted, isMaintenance, isBusyByOthers)}
                                disabled={isDisabled}
                            >
                                <Text style={textStyle} numberOfLines={1}>
                                    {slot.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
         </View>
      </View>

      {/* --- CHÚ THÍCH --- */}
      <View style={styles.legend}>
         <View style={styles.legendItem}><View style={[styles.legendBox, styles.availableSlot]} /><Text style={styles.legendText}>Slot trống</Text></View>
         <View style={styles.legendItem}><View style={[styles.legendBox, styles.selectedSlot]} /><Text style={styles.legendText}>Đang chọn</Text></View>
         <View style={styles.legendItem}><View style={[styles.legendBox, styles.unavailableSlot]} /><Text style={styles.legendText}>Đã được đặt</Text></View>
         <View style={styles.legendItem}><View style={[styles.legendBox, styles.maintenanceSlot]} /><Text style={styles.legendText}>Bảo trì</Text></View>
      </View>

      {/* --- FOOTER THÔNG TIN --- */}
      <View style={styles.footer}>
         <Text style={styles.selectionText}>
            Bỏ: <Text style={{fontWeight:'bold', color:'#DC2626'}}>{diffInfo.removedCount}</Text> • 
            Thêm: <Text style={{fontWeight:'bold', color:'#16A34A'}}>{diffInfo.addedCount}</Text> • 
            Tổng: <Text style={{fontWeight:'bold'}}>{selectedSlots.length}</Text>
         </Text>
         <BookingButton label="Tiếp theo" onPress={handleNext} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF7ED" },
  
  calendarNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginBottom: 16, backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#FFE8DA" },
  navButton: { padding: 8 },
  dateRangeText: { fontSize: 14, fontWeight: "600", color: "#C2410C", flex: 1, textAlign: 'center' },
  
  calendarContainer: { backgroundColor: "white", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#FFE8DA", minHeight: 200 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  
  weekdaysHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  dayHeader: { flex: 1, alignItems: "center", gap: 4 },
  dayNameText: { fontSize: 12, color: "#64748B" },
  dateNumText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  
  slotsGrid: { flexDirection: "row", gap: 8 },
  dayColumn: { flex: 1, gap: 8 },
  slotButton: { width: "100%", height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  slotLabel: { fontSize: 11, fontWeight: "500", color: "#0F172A" },
  
  // --- COLORS ---
  availableSlot: { backgroundColor: "#fff", borderColor: "#F1F5F9" },
  
  selectedSlot: { backgroundColor: "#EA580C", borderColor: "#EA580C" }, // Cam
  selectedSlotText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  
  unavailableSlot: { backgroundColor: "#FEFCE8", borderColor: "#FACC15" }, // Vàng (Đã đặt)
  unavailableSlotText: { color: "#A16207" },
  
  maintenanceSlot: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", borderStyle: 'dashed' }, // Xám (Bảo trì)
  maintenanceSlotText: { color: "#94A3B8", fontWeight: "500" },
  
  pastSlot: { backgroundColor: "#E2E8F0", borderColor: "#CBD5E1", opacity: 0.6 }, // Quá khứ

  legend: { flexDirection: "row", flexWrap: 'wrap', justifyContent: "space-around", marginTop: 16, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: "#64748B" },

  footer: { marginTop: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectionText: { fontSize: 13, color: "#64748B", flex: 1 },
});