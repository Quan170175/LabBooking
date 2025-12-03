import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  DoorOpen,
  Clock,
  CheckCircle2,
  User,
  Mail,
  Phone,
  History,
  XCircle,
  ListFilter,
} from "lucide-react-native";

// 🟢 Import API Client
import apiClient from "../../../../utils/api";

// --- 1. TYPES ---

interface PendingRequest {
  requestId: string;
  labRoomName: string;
  requestTime: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface HistoryRequest {
  id: string;
  labRoomName: string;
  type: string;
  status: string;
  requestTime: string;
  acceptedTime: string | null;
  requestedByCode: string;
  requestedByName: string | null;
  handledByName: string;
}

const formatTime = (isoString: string) => {
  try {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(
      2,
      "0"
    )} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  } catch (e) {
    return "N/A";
  }
};

const getHistoryStatusConfig = (status: string) => {
  switch (status) {
    case "Pending":
      return {
        label: "Chờ xử lý",
        color: "#F59E0B",
        bg: "#FEF3C7",
        icon: <Clock size={12} color="#F59E0B" />,
      };
    case "Open":
    case "Accepted":
      return {
        label: "Đã mở cửa",
        color: "#16A34A",
        bg: "#DCFCE7",
        icon: <CheckCircle2 size={12} color="#16A34A" />,
      };
    case "Rejected":
      return {
        label: "Từ chối",
        color: "#DC2626",
        bg: "#FEE2E2",
        icon: <XCircle size={12} color="#DC2626" />,
      };
    default:
      return {
        label: status,
        color: "#64748B",
        bg: "#F1F5F9",
        icon: <Clock size={12} color="#64748B" />,
      };
  }
};

// --- MAIN SCREEN ---
export default function SecurityDoorRequestScreen() {
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingList, setPendingList] = useState<PendingRequest[]>([]);
  const [historyList, setHistoryList] = useState<HistoryRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- 2. FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "pending") {
        const res = await apiClient.get("/api/DoorRequests/pending");
        setPendingList(res.data?.data || res.data || []);
      } else {
        const res = await apiClient.get("/api/DoorRequests/history");
        setHistoryList(res.data?.data || res.data || []);
      }
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // --- 3. ACTIONS ---
  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/api/DoorRequests/accept/${id}`);
      Alert.alert("Thành công", "Đã mở cửa phòng thành công!");
      setPendingList((prev) => prev.filter((item) => item.requestId !== id));
    } catch (error: any) {
      console.error("❌ Lỗi chấp nhận:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- RENDER ITEMS ---
  const renderPendingItem = ({ item }: { item: PendingRequest }) => {
    const isProcessing = processingId === item.requestId;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <DoorOpen size={20} color="#16A34A" />
            <Text style={styles.roomName}>{item.labRoomName}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Clock size={12} color="#B45309" />
            <Text style={styles.timeText}>{formatTime(item.requestTime)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
          {item.phoneNumber ? (
            <View style={styles.infoRow}>
              <Phone size={14} color="#64748B" />
              <Text style={styles.infoText}>{item.phoneNumber}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item.requestId)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <CheckCircle2 size={18} color="white" />
                <Text style={styles.acceptButtonText}>Chấp nhận mở cửa</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryRequest }) => {
    const statusConfig = getHistoryStatusConfig(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <History size={20} color="#64748B" />
            <Text style={[styles.roomName, { color: "#334155" }]}>
              {item.labRoomName}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
          >
            {statusConfig.icon}
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.infoText}>
              Người yêu cầu:{" "}
              <Text style={{ fontWeight: "600", color: "#0F172A" }}>
                {item.requestedByCode}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>
              Yêu cầu: {formatTime(item.requestTime)}
            </Text>
          </View>
          {item.acceptedTime && (
            <View style={styles.infoRow}>
              <CheckCircle2 size={14} color="#16A34A" />
              <Text style={styles.infoText}>
                Đã mở lúc: {formatTime(item.acceptedTime)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    // 🟢 Sửa background màu kem
    <View style={styles.container}>
      {/* 🟢 Header mới: Tiêu đề + Mô tả, Không nút Back */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu Mở cửa</Text>
        <Text style={styles.headerSub}>Quản lý yêu cầu ra vào phòng Lab</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "pending" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.tabTextActive,
            ]}
          >
            Chờ duyệt
          </Text>
          {pendingList.length > 0 && activeTab !== "pending" && (
            <View style={styles.badgeDot} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "history" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.tabTextActive,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT LIST */}
      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === "pending" ? (
            <FlatList
              data={pendingList}
              keyExtractor={(item) => item.requestId}
              renderItem={renderPendingItem}
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
                  <ListFilter size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>
                    Không có yêu cầu chờ duyệt.
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={historyList}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
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
                  <History size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>Chưa có lịch sử.</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 🟢 Update background container
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // 🟢 Update Header Styles giống IncidentHistory
  header: {
    padding: 16,
    backgroundColor: "#FFF7ED",
    // Bỏ borderBottom nếu muốn liền mạch, hoặc giữ lại tùy ý
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED", // Cập nhật màu nền Tab cho đồng bộ
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    position: "relative",
  },
  tabActive: {
    borderBottomColor: "#EA580C",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#EA580C",
    fontWeight: "700",
  },
  badgeDot: {
    position: "absolute",
    top: 10,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  // List
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16, // Bo góc lớn hơn cho mềm mại
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9", // Viền nhạt hơn
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white", // Để nền trắng cho sạch sẽ
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
    flex: 1,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
  },

  // Status Badge (History)
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Card Body
  cardBody: {
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    color: "#334155",
    fontSize: 14,
    flex: 1,
  },

  // Card Footer (Pending Only)
  cardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "flex-end",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minWidth: 140,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
