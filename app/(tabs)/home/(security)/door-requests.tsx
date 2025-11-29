import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  DoorOpen,
  DoorClosed,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  History,
  ListTodo,
} from "lucide-react-native";

// --- 1. ĐỊNH NGHĨA TYPES ---
export type DoorRequestStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Completed";
export type DoorRequestType = "Open" | "Close";

export interface DoorOpeningRequest {
  id: string;
  requestedById: string;
  requestedByName: string;
  labRoomId: string;
  labRoomName: string;
  requestTime: string;
  status: DoorRequestStatus;
  type: DoorRequestType;
  handledById?: string;
  bookingId?: string;
}

// --- 2. MOCK DATA ---
const MOCK_REQUESTS: DoorOpeningRequest[] = [
  {
    id: "1",
    requestedById: "stu1",
    requestedByName: "Nguyễn Văn A",
    labRoomId: "lab1",
    labRoomName: "Lab A101 (IoT)",
    requestTime: new Date().toISOString(),
    status: "Pending",
    type: "Open",
  },
  {
    id: "2",
    requestedById: "lec1",
    requestedByName: "GV. Trần Thị B",
    labRoomId: "lab2",
    labRoomName: "Lab B202 (Network)",
    requestTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "Accepted",
    type: "Close",
    handledById: "sec_me",
  },
  {
    id: "3",
    requestedById: "stu2",
    requestedByName: "Lê Văn C",
    labRoomId: "lab3",
    labRoomName: "Lab C303 (AI)",
    requestTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: "Completed",
    type: "Open",
    handledById: "sec_other",
  },
];

// --- 3. HELPER FUNCTIONS ---
const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )} - ${d.getDate()}/${d.getMonth() + 1}`;
};

const getStatusConfig = (status: DoorRequestStatus) => {
  switch (status) {
    case "Pending":
      return { color: "#F59E0B", label: "Chờ xử lý", bg: "#FEF3C7" };
    case "Accepted":
      return { color: "#3B82F6", label: "Đang thực hiện", bg: "#EFF6FF" };
    case "Completed":
      return { color: "#10B981", label: "Hoàn thành", bg: "#D1FAE5" };
    case "Rejected":
      return { color: "#EF4444", label: "Từ chối", bg: "#FEE2E2" };
    default:
      return { color: "#6B7280", label: status, bg: "#F3F4F6" };
  }
};

const getTypeConfig = (type: DoorRequestType) => {
  if (type === "Open") {
    return {
      icon: <DoorOpen size={24} color="#16A34A" />,
      label: "Yêu cầu MỞ cửa",
      textColor: "#166534",
      bgColor: "#DCFCE7",
    };
  } else {
    return {
      icon: <DoorClosed size={24} color="#C2410C" />,
      label: "Yêu cầu ĐÓNG cửa",
      textColor: "#9A3412",
      bgColor: "#FFEDD5",
    };
  }
};

export default function DoorRequestScreen() {
  const [requests, setRequests] = useState<DoorOpeningRequest[]>(MOCK_REQUESTS);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filter logic
  const filteredData = useMemo(() => {
    if (activeTab === "active") {
      return requests.filter(
        (r) => r.status === "Pending" || r.status === "Accepted"
      );
    } else {
      return requests.filter(
        (r) => r.status === "Completed" || r.status === "Rejected"
      );
    }
  }, [requests, activeTab]);

  // Action handler
  const handleUpdateStatus = (id: string, newStatus: DoorRequestStatus) => {
    Alert.alert(
      "Xác nhận",
      `Bạn muốn chuyển trạng thái thành "${newStatus}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: () => {
            setLoadingId(id);
            setTimeout(() => {
              setRequests((prev) =>
                prev.map((req) =>
                  req.id === id
                    ? { ...req, status: newStatus, handledById: "sec_me" }
                    : req
                )
              );
              setLoadingId(null);
            }, 500);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: DoorOpeningRequest }) => {
    const typeConf = getTypeConfig(item.type);
    const statusConf = getStatusConfig(item.status);
    const isLoading = loadingId === item.id;

    return (
      <View style={styles.card}>
        {/* Header Card */}
        <View
          style={[styles.cardHeader, { backgroundColor: typeConf.bgColor }]}
        >
          <View style={styles.typeRow}>
            {typeConf.icon}
            <Text style={[styles.typeText, { color: typeConf.textColor }]}>
              {typeConf.label}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}
          >
            <Text style={[styles.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {/* Body Card */}
        <View style={styles.cardBody}>
          <Text style={styles.roomName}>{item.labRoomName}</Text>

          <View style={styles.infoRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.infoText}>
              Người yêu cầu: {item.requestedByName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{formatTime(item.requestTime)}</Text>
          </View>

          {/* Action Buttons */}
          {activeTab === "active" && !isLoading && (
            <View style={styles.actionRow}>
              {item.status === "Pending" && (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.btnReject]}
                    onPress={() => handleUpdateStatus(item.id, "Rejected")}
                  >
                    <XCircle size={18} color="#DC2626" />
                    <Text style={styles.btnTextReject}>Từ chối</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.btnAccept]}
                    onPress={() => handleUpdateStatus(item.id, "Accepted")}
                  >
                    <Play size={18} color="white" fill="white" />
                    <Text style={styles.btnTextAccept}>Tiếp nhận</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status === "Accepted" && (
                <TouchableOpacity
                  style={[styles.button, styles.btnComplete]}
                  onPress={() => handleUpdateStatus(item.id, "Completed")}
                >
                  <CheckCircle2 size={18} color="white" />
                  <Text style={styles.btnTextAccept}>Xác nhận Hoàn thành</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isLoading && (
            <ActivityIndicator style={{ marginTop: 12 }} color="#EA580C" />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER ĐÃ SỬA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hỗ trợ Mở/Đóng cửa</Text>
        <Text style={styles.headerSub}>Quản lý yêu cầu ra vào phòng Lab</Text>
      </View>

      {/* TABS (STYLE MỚI) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <ListTodo
            size={16}
            color={activeTab === "active" ? "white" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.tabTextActive,
            ]}
          >
            Cần xử lý (
            {
              requests.filter(
                (r) => r.status === "Pending" || r.status === "Accepted"
              ).length
            }
            )
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <History
            size={16}
            color={activeTab === "history" ? "white" : "#64748B"}
          />
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

      {/* LIST */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Check size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {activeTab === "active"
                ? "Không có yêu cầu nào cần xử lý."
                : "Chưa có lịch sử yêu cầu."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🔥 MÀU NỀN CHÍNH
  container: { flex: 1, backgroundColor: "#FFF7ED" },

  // 🔥 HEADER MỚI
  header: {
    padding: 16,
    backgroundColor: "#FFF7ED", // Cùng màu nền
    // Bỏ border
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },

  // 🔥 TABS STYLE VIÊN THUỐC (Pill)
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: "#EA580C" }, // Cam nền khi active
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "white" }, // Chữ trắng khi active

  // List
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 14 },

  // Card (Giữ nền trắng)
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeText: { fontWeight: "700", fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Card Body
  cardBody: { padding: 16 },
  roomName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: { color: "#475569", fontSize: 13 },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },

  btnReject: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  btnTextReject: { color: "#DC2626", fontWeight: "600", fontSize: 14 },

  btnAccept: { backgroundColor: "#EA580C" },
  btnTextAccept: { color: "white", fontWeight: "600", fontSize: 14 },

  btnComplete: { backgroundColor: "#16A34A" },
});
