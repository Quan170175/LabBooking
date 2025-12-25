import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import apiClient from "../../../../utils/api";

// --- INTERFACES ---
interface Schedule {
  timeRange: string;
  activityTitle: string;
  responsiblePerson: string;
  bookingCode: string;
  status: string;
  startTime: string;
}

interface LabRoom {
  labId: string;
  labName: string;
  location: string;
  schedules: Schedule[];
}

const SecurityLabScheduleScreen = () => {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [labData, setLabData] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- HELPER ---
  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // --- API: FETCH SCHEDULE ---
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(selectedDate);

      const res = await apiClient.get(`/api/LabRooms/daily-schedule`, {
        params: { date: dateStr },
      });

      // Xử lý dữ liệu an toàn
      const rawData = res.data;
      let finalData: LabRoom[] = [];

      if (Array.isArray(rawData)) {
        finalData = rawData;
      } else if (rawData && Array.isArray(rawData.data)) {
        finalData = rawData.data;
      }

      setLabData(finalData);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      Alert.alert("Lỗi", "Không thể tải lịch trình. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  // --- HANDLERS ---
  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const onChangeDate = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
  };

  // --- RENDER ITEM: SCHEDULE ROW ---
  const renderScheduleItem = (schedule: Schedule, index: number) => {
    // Lấy giờ hiển thị (cắt bỏ giây)
    const displayTime = schedule.startTime
      ? schedule.startTime.substring(0, 5)
      : "--:--";

    return (
      <View key={`${schedule.bookingCode}-${index}`} style={styles.scheduleRow}>
        {/* Cột thời gian bên trái */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{displayTime}</Text>
          <View style={styles.timeLine} />
        </View>

        {/* Card thông tin chi tiết */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.activityTitle} numberOfLines={2}>
              {schedule.activityTitle || "Không có tiêu đề"}
            </Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.detailText}>{schedule.timeRange}</Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.detailText}>
              SV/GV:{" "}
              <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                {schedule.responsiblePerson}
              </Text>
            </Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <BookOpen size={14} color="#64748B" />
            <Text style={styles.detailText}>Mã: {schedule.bookingCode}</Text>
          </View>
        </View>
      </View>
    );
  };

  // --- RENDER ITEM: LAB CARD ---
  const renderLabItem = ({ item }: { item: LabRoom }) => {
    const schedulesList = Array.isArray(item.schedules) ? item.schedules : [];
    const hasSchedules = schedulesList.length > 0;

    return (
      <View style={styles.labContainer}>
        {/* Header của Lab */}
        <View style={styles.labHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labName}>{item.labName}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>

          <View
            style={[
              styles.countBadge,
              hasSchedules
                ? { backgroundColor: "#E0F2FE" }
                : { backgroundColor: "#F1F5F9" },
            ]}
          >
            <Text
              style={[
                styles.countText,
                hasSchedules ? { color: "#0284C7" } : { color: "#64748B" },
              ]}
            >
              {schedulesList.length} ca
            </Text>
          </View>
        </View>

        {/* Danh sách lịch trong Lab */}
        <View style={styles.scheduleList}>
          {hasSchedules ? (
            schedulesList.map((sch, idx) => renderScheduleItem(sch, idx))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Hôm nay phòng trống</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Lịch Hoạt Động Lab</Text>
        {/* <Text style={styles.subTitle}>Dành cho bộ phận An ninh</Text> */}
      </View>

      {/* DATE BAR */}
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.arrowBtn}>
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={() => setShowDatePicker(true)}
        >
          <CalendarIcon size={18} color="#EA580C" style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextDay} style={styles.arrowBtn}>
          <ChevronRight size={24} color="#334155" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {/* CONTENT LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#EA580C"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={labData}
          keyExtractor={(item) => item.labId}
          renderItem={renderLabItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EA580C"
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: "#64748B", fontSize: 16 }}>
                Không có dữ liệu ngày này.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED", // Cream Background
  },
  headerContainer: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },
  subTitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },

  // Date Bar
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF7ED",
    marginBottom: 5,
  },
  arrowBtn: {
    padding: 8,
    backgroundColor: "#FFEDD5",
    borderRadius: 8,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDBA74",
    shadowColor: "#EA580C",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C2410C",
    textTransform: "capitalize",
  },

  // Lab Item Container
  labContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  labHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFfff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  labName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Schedule Area
  scheduleList: {
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  scheduleRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeColumn: {
    width: 45,
    alignItems: "center",
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  timeLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
  },

  // Card Lịch Chi Tiết
  scheduleCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // Viền trái màu cam để nhận diện
    borderLeftWidth: 4,
    borderLeftColor: "#EA580C",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  scheduleDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    flex: 1,
  },

  // Empty State
  emptyState: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFaf0",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default SecurityLabScheduleScreen;
