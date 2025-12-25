import apiClient from "@/utils/api";
import { Stack } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquare,
  Trash2,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- TYPES ---
type RequestStatus = "Pending" | "Approved" | "Rejected";

interface GroupedSlot {
  date: string;
  slotNames: string[];
}

interface ChangeRequest {
  id: string;
  labName: string;
  userDescription: string;
  managerFeedback: string | null;
  status: RequestStatus;
  createdAt: string;
  groupedSlots: GroupedSlot[];
  totalSlots: number;
}

interface SlotMasterData {
  id: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  label: string;
}

export default function LecturerChangeRequestsScreen() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | RequestStatus>("All");

  // --- HELPERS ---
  const formatDateVN = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  // --- LOAD DATA ---
  const loadData = async () => {
    try {
      setIsLoading(true);

      // 1. Gọi song song: API danh sách yêu cầu & API danh sách Slot (Master data)
      const [requestsRes, slotsRes] = await Promise.all([
        apiClient.get("/api/BookingChangeRequest"), // Đảm bảo đúng endpoint của giảng viên
        apiClient.get("/api/slot"),
      ]);

      // 2. Xử lý danh sách Slot -> Tạo Dictionary (Map) để tra cứu nhanh
      // Cấu trúc: { "slot-id-123": "Slot 1 (07:00 - 09:15)", ... }
      const rawSlots: SlotMasterData[] =
        slotsRes.data?.data || slotsRes.data || [];
      const slotLookup: Record<string, string> = {};

      rawSlots.forEach((slot) => {
        const timeRange = `${formatTime(slot.startTime)} - ${formatTime(
          slot.endTime
        )}`;
        // Lưu key là ID (dùng lowercase để so sánh cho an toàn)
        slotLookup[slot.id] = `${slot.label}`;
      });

      // 3. Map dữ liệu Requests
      // Kiểm tra cấu trúc response (có thể là res.data hoặc res.data.data tùy backend)
      const rawRequests = requestsRes.data?.data || requestsRes.data || [];

      const mappedRequests: ChangeRequest[] = rawRequests.map((item: any) => {
        const slotsByDate: Record<string, string[]> = {};

        // Sắp xếp slot theo thời gian tăng dần
        const sortedSlots =
          item.newSlots?.sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          ) || [];

        sortedSlots.forEach((slot: any) => {
          const dateStr = formatDateVN(slot.date);
          if (!slotsByDate[dateStr]) {
            slotsByDate[dateStr] = [];
          }

          // --- LOGIC QUAN TRỌNG: Lấy label từ bảng tra cứu ---
          // Backend trả về 'slotId', ta dùng nó để tìm trong 'slotLookup'
          const label = slotLookup[slot.slotId] || "Slot không xác định";

          slotsByDate[dateStr].push(label);
        });

        // Chuyển đổi map slotsByDate thành mảng để render
        const groupedSlotsArray: GroupedSlot[] = Object.keys(slotsByDate).map(
          (date) => ({
            date: date,
            slotNames: slotsByDate[date],
          })
        );

        return {
          id: item.id,
          labName:
            item.roomName || item.labRoomResponse?.labName || "Phòng Lab",
          userDescription:
            item.newDescription || item.newTitle || "Không có mô tả",
          managerFeedback: item.reason || null,
          status: item.status,
          createdAt: item.createdAt,
          groupedSlots: groupedSlotsArray,
          totalSlots: item.newSlots?.length || 0,
        };
      });

      // Sắp xếp: Mới nhất lên đầu
      mappedRequests.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRequests(mappedRequests);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      // Alert.alert("Thông báo", "Không thể tải danh sách yêu cầu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // --- ACTIONS ---
  const handleCancel = (item: ChangeRequest) => {
    Alert.alert(
      "Hủy yêu cầu",
      "Bạn có chắc muốn hủy yêu cầu thay đổi lịch này không?",
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Hủy yêu cầu",
          style: "destructive",
          onPress: async () => {
            try {
              // Gọi API hủy thực tế nếu cần
              await apiClient.delete(`/api/BookingChangeRequest/${item.id}`);
              setRequests((prev) => prev.filter((r) => r.id !== item.id));
              Alert.alert("Thành công", "Đã hủy yêu cầu.");
            } catch (e) {
              Alert.alert("Lỗi", "Không thể hủy yêu cầu.");
            }
          },
        },
      ]
    );
  };

  // --- FILTER & RENDER HELPERS ---
  const filteredRequests = useMemo(() => {
    if (activeTab === "All") return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "Approved":
        return "#16A34A";
      case "Pending":
        return "#D97706";
      case "Rejected":
        return "#DC2626";
      default:
        return "#64748B";
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 size={14} color="#16A34A" />;
      case "Pending":
        return <Clock3 size={14} color="#D97706" />;
      case "Rejected":
        return <XCircle size={14} color="#DC2626" />;
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case "Approved":
        return "Đã duyệt";
      case "Pending":
        return "Chờ duyệt";
      case "Rejected":
        return "Bị từ chối";
    }
  };

  // --- RENDER COMPONENTS ---
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Lịch sử thay đổi</Text>
      {/* <Text style={styles.headerSubtitle}>
        Theo dõi trạng thái các yêu cầu dời lịch
      </Text> */}
      <View style={styles.tabContainer}>
        {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "All" ? "Tất cả" : getStatusText(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ChangeRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.labName}>{item.labName}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getStatusColor(item.status) + "15" },
          ]}
        >
          {getStatusIcon(item.status)}
          <Text
            style={[styles.badgeText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.scheduleContainer}>
        <Text style={styles.sectionLabel}>Lịch đề xuất mới:</Text>

        <View style={styles.groupedList}>
          {item.groupedSlots.map((group, index) => (
            <View key={index} style={styles.rowItem}>
              <View style={styles.dateCol}>
                <Calendar
                  size={14}
                  color="#EA580C"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.rowDateText}>{group.date}:</Text>
              </View>

              <View style={styles.slotsCol}>
                {group.slotNames.map((slotName, sIndex) => (
                  <View key={sIndex} style={styles.slotBadge}>
                    <Text style={styles.slotText}>{slotName}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.reasonBox}>
        <AlertCircle size={14} color="#64748B" style={{ marginTop: 2 }} />
        <Text style={styles.reasonText}>Mô tả: {item.userDescription}</Text>
      </View>

      {item.managerFeedback && (
        <View
          style={[
            styles.reasonBox,
            {
              backgroundColor: "#FEF2F2",
              marginTop: 8,
              borderColor: "#FECACA",
              borderWidth: 1,
            },
          ]}
        >
          <MessageSquare size={14} color="#DC2626" style={{ marginTop: 2 }} />
          <Text
            style={[styles.reasonText, { color: "#DC2626", fontWeight: "500" }]}
          >
            Phản hồi: {item.managerFeedback}
          </Text>
        </View>
      )}

      {item.status === "Pending" && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item)}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={styles.cancelBtnText}>Hủy yêu cầu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FFF7ED" },
          headerTintColor: "#000",
          headerShown: true,
        }}
      />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có yêu cầu nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 40 },

  headerContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 20,
    marginTop: 20,
  },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 16 },

  tabContainer: { flexDirection: "row", gap: 8 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFE4D6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: { backgroundColor: "#EA580C" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9A3412" },
  tabTextActive: { color: "white" },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  labName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  scheduleContainer: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  groupedList: { gap: 8 },

  rowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dateCol: {
    flexDirection: "row",
    alignItems: "center",
    width: 110,
    paddingTop: 6,
  },
  rowDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  slotsCol: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  slotBadge: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotText: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "600",
  },

  reasonBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  reasonText: { fontSize: 13, color: "#475569", flex: 1, lineHeight: 18 },

  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "flex-end",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelBtnText: { fontSize: 13, color: "#DC2626", fontWeight: "600" },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94A3B8" },
});
