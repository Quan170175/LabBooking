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
  MessageSquareQuote, // Icon cho tin nhắn
  Clock,
  User,
  Hash, // Icon cho mã code
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
// Đảm bảo đường dẫn import đúng với dự án của bạn
import apiClient from "../../../../utils/api";

// --- INTERFACES (Dựa trên JSON bạn cung cấp) ---
interface DailyNote {
  requestId: string;
  labName: string;
  slotTime: string;
  requesterName: string;
  managerNote: string;
  bookingCode: string;
}

const SecurityDailyNotesScreen = () => {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notesData, setNotesData] = useState<DailyNote[]>([]);
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

  // --- API: FETCH DAILY NOTES ---
  const fetchDailyNotes = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(selectedDate);
      console.log("Fetching notes for:", dateStr);

      // Gọi API theo endpoint trong hình bạn cung cấp
      const res = await apiClient.get(`/api/DoorRequests/daily-notes`, {
        params: { date: dateStr },
      });

      const rawData = res.data;
      let finalData: DailyNote[] = [];

      // Xử lý data an toàn (phòng trường hợp axios trả về trực tiếp hoặc bọc trong data)
      if (Array.isArray(rawData)) {
        finalData = rawData;
      } else if (rawData && Array.isArray(rawData.data)) {
        finalData = rawData.data;
      }

      setNotesData(finalData);
    } catch (error) {
      console.error("Fetch Notes Error:", error);
      Alert.alert("Lỗi", "Không thể tải ghi chú. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDailyNotes();
  }, [selectedDate]);

  // --- HANDLERS ---
  const onRefresh = () => {
    setRefreshing(true);
    fetchDailyNotes();
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

  // --- RENDER ITEM ---
  const renderNoteItem = ({ item }: { item: DailyNote }) => {
    return (
      <View style={styles.cardContainer}>
        {/* Header Card: Tên Lab & Mã Booking */}
        <View style={styles.cardHeader}>
          <Text style={styles.labName}>{item.labName}</Text>
          <View style={styles.codeBadge}>
            <Hash size={12} color="#C2410C" />
            <Text style={styles.codeText}>{item.bookingCode}</Text>
          </View>
        </View>

        {/* Thông tin Người yêu cầu & Thời gian */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <User size={14} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.requesterName}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.slotTime}</Text>
          </View>
        </View>

        {/* Phần QUAN TRỌNG NHẤT: Lời nhắn Manager */}
        <View style={styles.noteBox}>
          <View style={styles.noteTitleRow}>
            <MessageSquareQuote size={18} color="#EA580C" />
            <Text style={styles.noteTitle}>Lời nhắn Quản lý:</Text>
          </View>
          <Text style={styles.noteContent}>"{item.managerNote}"</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ClipboardList
            size={24}
            color="#EA580C"
            style={{ marginRight: 10 }}
          />
          <View>
            <Text style={styles.headerTitle}>Sổ Ghi Chú</Text>
            {/* <Text style={styles.subTitle}>Chỉ đạo từ Quản lý phòng Lab</Text> */}
          </View>
        </View>
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
          data={notesData}
          keyExtractor={(item) => item.requestId}
          renderItem={renderNoteItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EA580C"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ClipboardList
                size={40}
                color="#CBD5E1"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.emptyText}>
                Không có ghi chú nào trong ngày này.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// --- STYLES (THEME CREAM) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED", // Nền kem
  },
  headerContainer: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
  },
  subTitle: {
    fontSize: 13,
    color: "#64748B",
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

  // CARD ITEM
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FED7AA", // Viền cam nhạt
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  labName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
    marginRight: 10,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  codeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C2410C",
    marginLeft: 4,
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },

  // Note Box
  noteBox: {
    backgroundColor: "#FFFaf0", // Màu kem rất nhạt cho box note
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#EA580C", // Viền trái cam đậm để nhấn mạnh
    borderWidth: 1,
    borderColor: "#FED7AA", // Viền bao quanh nhạt
  },
  noteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EA580C",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  noteContent: {
    fontSize: 15,
    color: "#1E293B",
    fontStyle: "italic",
    lineHeight: 22,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
  },
});

export default SecurityDailyNotesScreen;
