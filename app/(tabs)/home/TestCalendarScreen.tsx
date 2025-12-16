import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import * as AddCalendarEvent from "react-native-add-calendar-event";
import {
  Calendar,
  CheckCircle,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
} from "lucide-react-native";

export default function TestCalendarScreen() {
  const router = useRouter();

  // --- MOCK DATA: Chỉnh lại thành 12h45 Hôm nay ---

  const getTodayAt1245 = () => {
    const today = new Date();
    today.setHours(12, 45, 0, 0); // 12:45:00
    return today;
  };

  const getTodayAt1545 = () => {
    const today = new Date();
    today.setHours(15, 45, 0, 0); // 15:45:00 (Học 3 tiếng)
    return today;
  };

  const eventDetails = {
    title: "Thực hành IoT & Nhúng - Phòng Lab A101",
    startDate: getTodayAt1245().toISOString(),
    endDate: getTodayAt1545().toISOString(),
    location: "Phòng 305, Tòa nhà Innovation, Khu CNC",
    notes: "Lưu ý: Mang theo Laptop đã cài Keil C và mạch Arduino Uno.",
  };

  // --- HÀM XỬ LÝ CHÍNH ---
  const addToCalendar = () => {
    const eventConfig = {
      title: eventDetails.title,
      startDate: eventDetails.startDate,
      endDate: eventDetails.endDate,
      location: eventDetails.location,
      notes: eventDetails.notes,

      // --- CẤU HÌNH NHẮC NHỞ ---
      alarms: [
        {
          date: -30, // Nhắc trước 30 phút (tức là 12:15 sẽ báo)
        },
        {
          date: -10, // Nhắc thêm 1 lần nữa trước 10 phút (12:35 sẽ báo)
        },
      ],
    };

    AddCalendarEvent.presentEventCreatingDialog(eventConfig)
      .then((eventInfo: any) => {
        if (eventInfo.action === "CANCELED") {
          console.log("User cancelled");
        } else {
          Alert.alert(
            "Thành công",
            "Đã thêm lịch. Hãy kiểm tra App Lịch trên máy!"
          );
          console.log(JSON.stringify(eventInfo));
        }
      })
      .catch((error: any) => {
        console.warn(error);
        Alert.alert("Lỗi", "Không thể mở ứng dụng Lịch.");
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt phòng thành công</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successBox}>
          <CheckCircle size={80} color="#16A34A" fill="#DCFCE7" />
          <Text style={styles.successTitle}>Đã đặt lịch thành công!</Text>
          <Text style={styles.successSub}>
            Yêu cầu mượn phòng của bạn đã được phê duyệt tự động.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Thông tin buổi học</Text>

          {/* DÒNG THỜI GIAN ĐÃ SỬA */}
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Clock size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.label}>Thời gian</Text>
              <Text style={styles.value}>12:45 - 15:45, Hôm nay</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.label}>Địa điểm</Text>
              <Text style={styles.value} numberOfLines={2}>
                {eventDetails.location}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Calendar size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.label}>Môn học</Text>
              <Text style={styles.value}>{eventDetails.title}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.calendarBtn} onPress={addToCalendar}>
          <View style={styles.btnContent}>
            <Calendar size={22} color="white" />
            <Text style={styles.btnText}>Thêm vào Lịch điện thoại</Text>
          </View>
          <ChevronRight size={20} color="#FFEDD5" />
        </TouchableOpacity>

        <Text style={styles.hintText}>
          *Bấm nút trên để nhận thông báo nhắc nhở tự động từ điện thoại.
        </Text>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()}>
          <Text style={styles.homeBtnText}>Quay về Trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A" },

  content: { padding: 20, alignItems: "center" },

  successBox: { alignItems: "center", marginBottom: 30 },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
    marginTop: 16,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: "#0F172A", flexShrink: 1 },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
    marginLeft: 52,
  },

  calendarBtn: {
    width: "100%",
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: { color: "white", fontSize: 16, fontWeight: "700" },

  hintText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  homeBtn: { marginTop: 30, padding: 12 },
  homeBtnText: { color: "#64748B", fontSize: 15, fontWeight: "600" },
});
