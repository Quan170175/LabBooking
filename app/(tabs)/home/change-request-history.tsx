import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack } from "expo-router";
import {
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  XCircle,
  MapPin,
  Trash2,
} from "lucide-react-native";

// --- TYPES ---
type RequestStatus = "Pending" | "Approved" | "Rejected";

interface ChangeRequest {
  id: string;
  labName: string;
  fromSlot: { date: string; time: string };
  toSlot: { date: string; time: string };
  reason: string;
  status: RequestStatus;
  createdAt: string;
  rejectReason?: string;
}

export default function LecturerChangeRequestsScreen() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | RequestStatus>("All");

  // --- LOAD DATA ---
  const loadData = async () => {
    try {
      const mockData = await mockFetchMyRequests();
      setRequests(mockData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const mockFetchMyRequests = async (): Promise<ChangeRequest[]> => {
    await new Promise((r) => setTimeout(r, 600));
    return [
      {
        id: "req-01",
        labName: "Lab A101 - IoT System",
        fromSlot: { date: "2025-12-12", time: "Ca 1 (07:00 - 09:15)" },
        toSlot: { date: "2025-12-15", time: "Ca 3 (12:30 - 14:45)" },
        reason: "Tôi có lịch công tác đột xuất.",
        status: "Pending",
        createdAt: "2025-12-10T08:00:00Z",
      },
      {
        id: "req-02",
        labName: "Lab B202 - AI Research",
        fromSlot: { date: "2025-11-20", time: "Ca 2" },
        toSlot: { date: "2025-11-21", time: "Ca 2" },
        reason: "Phòng máy lạnh bị hỏng.",
        status: "Approved",
        createdAt: "2025-11-18T09:00:00Z",
      },
      {
        id: "req-03",
        labName: "Lab C305 - Network",
        fromSlot: { date: "2025-10-05", time: "Ca 4" },
        toSlot: { date: "2025-10-06", time: "Ca 1" },
        reason: "Sinh viên đề xuất dời lịch.",
        status: "Rejected",
        rejectReason: "Phòng đã kín lịch vào ngày mới.",
        createdAt: "2025-10-01T10:00:00Z",
      },
    ];
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCancel = (item: ChangeRequest) => {
    Alert.alert("Hủy yêu cầu", "Bạn có chắc muốn hủy yêu cầu này không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy",
        style: "destructive",
        onPress: () =>
          setRequests((prev) => prev.filter((r) => r.id !== item.id)),
      },
    ]);
  };

  // --- FILTER ---
  const filteredRequests = useMemo(() => {
    if (activeTab === "All") return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  // --- HELPERS ---
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "Approved":
        return "#16A34A";
      case "Pending":
        return "#D97706";
      case "Rejected":
        return "#DC2626";
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

  // --- LIST HEADER (Tiêu đề to + Tabs) ---
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Yêu cầu thay đổi</Text>
      <Text style={styles.headerSubtitle}>
        Theo dõi trạng thái các yêu cầu dời lịch
      </Text>

      {/* Tabs */}
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

  // --- RENDER ITEM (Card cũ) ---
  const renderItem = ({ item }: { item: ChangeRequest }) => (
    <View style={styles.card}>
      {/* 1. Header Card */}
      <View style={styles.cardHeader}>
        <View style={styles.labRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.labName}>{item.labName}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. So sánh lịch */}
      <View style={styles.compareRow}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Lịch cũ</Text>
          <View style={styles.infoRow}>
            <Calendar size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.fromSlot.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.fromSlot.time}
            </Text>
          </View>
        </View>

        <View style={styles.arrowBox}>
          <ArrowRight size={20} color="#EA580C" />
        </View>

        <View style={styles.col}>
          <Text style={[styles.colLabel, { color: "#EA580C" }]}>Lịch mới</Text>
          <View style={styles.infoRow}>
            <Calendar size={14} color="#EA580C" />
            <Text
              style={[styles.infoText, { fontWeight: "600", color: "#0F172A" }]}
            >
              {item.toSlot.date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#EA580C" />
            <Text
              style={[styles.infoText, { fontWeight: "600", color: "#0F172A" }]}
              numberOfLines={1}
            >
              {item.toSlot.time}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Lý do */}
      <View style={styles.reasonBox}>
        <AlertCircle size={14} color="#64748B" style={{ marginTop: 2 }} />
        <Text style={styles.reasonText}>"{item.reason}"</Text>
      </View>

      {/* 4. Lý do từ chối (nếu có) */}
      {item.status === "Rejected" && item.rejectReason && (
        <View
          style={[
            styles.reasonBox,
            { backgroundColor: "#FEF2F2", marginTop: 8 },
          ]}
        >
          <XCircle size={14} color="#DC2626" style={{ marginTop: 2 }} />
          <Text style={[styles.reasonText, { color: "#DC2626" }]}>
            Manager: "{item.rejectReason}"
          </Text>
        </View>
      )}

      {/* 5. Nút Hủy (Chỉ hiện khi Pending) */}
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
      {/* Cấu hình App Header: Title rỗng để đỡ lặp lại với Header to bên dưới, hoặc bạn có thể để title="Lịch sử" */}
      <Stack.Screen
        options={{
          title: "", // Để trống vì đã có tiêu đề to bên dưới
          headerShadowVisible: false, // Xóa gạch chân header để liền mạch với màu nền
          headerStyle: { backgroundColor: "#FFF7ED" },
          headerTintColor: "#000",
          headerShown: true, // BẮT BUỘC TRUE ĐỂ HIỆN NÚT BACK
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
          ListHeaderComponent={ListHeader} // Header to nằm ở đây
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 40 },

  // --- HEADER TO ---
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    // Không cần paddingTop lớn nữa vì đã có App Header
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },

  // --- TABS ---
  tabContainer: { flexDirection: "row", gap: 10 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFE4D6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: { backgroundColor: "#EA580C" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9A3412" },
  tabTextActive: { color: "white" },

  // --- CARD ---
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
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
  labName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  compareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  col: { flex: 1 },
  arrowBox: { width: 30, alignItems: "center" },
  colLabel: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: "#334155" },

  reasonBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    flex: 1,
    lineHeight: 18,
  },

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
