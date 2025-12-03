import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Flame,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  CheckCircle,
} from "lucide-react-native";

// 🟢 Import Component Lọc Chung
// Lưu ý: Đảm bảo bạn đã update IncidentFilterBar như code trên
import IncidentFilterBar, {
  FilterOption,
} from "../../../../components/common/IncidentFilterBar";

// 🟢 Import API Client
import apiClient from "../../../../utils/api";

// --- 1. TYPES ---
export type IncidentType = string;
export type LevelOfImportance = "Low" | "Medium" | "High" | string;

export interface Incident {
  id: string;
  labRoomName: string;
  description: string;
  type: IncidentType;
  importanceLevel: LevelOfImportance;
  status: string;
  equipmentName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
}

// --- 2. HELPER FUNCTIONS ---
const getTypeConfig = (type: IncidentType) => {
  switch (type) {
    case "Fire":
      return {
        label: "Cháy nổ",
        icon: <Flame size={18} color="#DC2626" />,
        color: "#FEE2E2",
      };
    case "PowerOutage":
      return {
        label: "Cúp điện",
        icon: <Zap size={18} color="#D97706" />,
        color: "#FEF3C7",
      };
    case "EquipmentFailure":
      return {
        label: "Hỏng thiết bị",
        icon: <AlertTriangle size={18} color="#EA580C" />,
        color: "#FFEDD5",
      };
    case "SecurityIssue":
      return {
        label: "An ninh",
        icon: <ShieldAlert size={18} color="#7C3AED" />,
        color: "#EDE9FE",
      };
    default:
      return {
        label: type || "Khác",
        icon: <HelpCircle size={18} color="#64748B" />,
        color: "#F1F5F9",
      };
  }
};

const getImportanceColor = (level: LevelOfImportance) => {
  switch (level) {
    case "High":
      return { bg: "#FEE2E2", text: "#DC2626" };
    case "Medium":
      return { bg: "#FEF9C3", text: "#CA8A04" };
    case "Low":
      return { bg: "#F1F5F9", text: "#475569" };
    default:
      return { bg: "#F1F5F9", text: "#475569" };
  }
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// --- 3. MAIN SCREEN ---
export default function IncidentHistoryScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterImportance, setFilterImportance] = useState("All");

  // 🟢 STATE CHO LAB ROOM
  const [labOptions, setLabOptions] = useState<FilterOption[]>([]);
  const [selectedLabId, setSelectedLabId] = useState("All");

  // 🟢 1. FETCH LAB ROOMS (DEBUG VERSION)
  useEffect(() => {
    const fetchLabs = async () => {
      // 1. Log Params chuẩn bị gửi
      const apiParams = {
        PageNumber: 1,
        PageSize: 10, // Thử số nhỏ an toàn
        SearchPhrase: "",
      };

      console.log("🚀 [START] Bắt đầu gọi API LabRooms...");
      console.log("👉 [PARAMS] Đang gửi:", JSON.stringify(apiParams, null, 2));

      try {
        const response = await apiClient.get("/api/LabRooms", {
          params: apiParams,
        });

        // 2. Log kết quả trả về nếu thành công (200)
        console.log("✅ [SUCCESS] Status:", response.status);

        // 3. Xử lý dữ liệu
        // Dựa vào JSON bạn cung cấp: { statusCode: 200, data: { items: [...] } }
        const labsData = response.data?.items || [];

        console.log(`📊 [INFO] Tìm thấy ${labsData.length} phòng.`);

        const options: FilterOption[] = [
          { label: "Tất cả phòng", value: "All" },
          ...labsData.map((lab: any) => ({
            // Check kỹ xem dùng labName hay name
            label: lab.labName || lab.name || "Phòng " + lab.id,
            value: lab.id,
          })),
        ];

        setLabOptions(options);
      } catch (error: any) {
        // 4. LOG LỖI CHI TIẾT (Quan trọng nhất)
        console.error("❌ [ERROR] Gọi API thất bại!");

        if (error.response) {
          // Lỗi từ Server trả về (400, 404, 500...)
          console.error("⚠️ [HTTP STATUS]:", error.response.status);
          console.error(
            "⚠️ [ERROR DATA]:",
            JSON.stringify(error.response.data, null, 2)
          );
          console.error(
            "⚠️ [HEADERS]:",
            JSON.stringify(error.response.headers, null, 2)
          );
        } else if (error.request) {
          // Không nhận được phản hồi
          console.error(
            "⚠️ [NO RESPONSE]: Không nhận được phản hồi từ server."
          );
        } else {
          // Lỗi khi setup request
          console.error("⚠️ [SETUP ERROR]:", error.message);
        }

        // Set mặc định để app không crash
        setLabOptions([{ label: "Tất cả phòng", value: "All" }]);
      }
    };

    fetchLabs();
  }, []);

  // --- 2. FETCH INCIDENTS (Chạy khi filter thay đổi) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const params: any = {
        FromDate: startDate.toISOString(),
        ToDate: endDate.toISOString(),
        IsDescending: true,
      };

      // Filter Logic
      if (filterStatus === "Resolved") params.IsResolved = true;
      else if (filterStatus === "Pending") params.IsResolved = false;

      if (filterImportance !== "All") params.Importance = filterImportance;

      // 🟢 Thêm Filter LabId
      if (selectedLabId !== "All") {
        params.LabRoomId = selectedLabId; // Tên param tuỳ thuộc API Incidents (LabRoomId hoặc LabId)
      }

      console.log("🚀 [History API Request]", params);

      const response = await apiClient.get("/api/Incidents", { params });

      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      }

      const mappedData: Incident[] = rawData.map((item: any) => ({
        ...item,
        isResolved:
          !!item.resolvedAt ||
          item.status === "Đã xử lý" ||
          item.isResolved === true,
      }));

      setIncidents(mappedData);
    } catch (error: any) {
      console.error("❌ [API Error]:", error);
      setIncidents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, filterStatus, filterImportance, selectedLabId]); // Thêm selectedLabId vào dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Incident }) => {
    const typeConf = getTypeConfig(item.type);
    const impConf = getImportanceColor(item.importanceLevel);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
            {typeConf.icon}
            <Text style={styles.typeText}>{typeConf.label}</Text>
          </View>
          <View style={[styles.impBadge, { backgroundColor: impConf.bg }]}>
            <Text style={[styles.impText, { color: impConf.text }]}>
              {item.importanceLevel}
            </Text>
          </View>
        </View>

        <Text style={styles.roomName} numberOfLines={1}>
          {item.labRoomName}{" "}
          {item.equipmentName ? `- ${item.equipmentName}` : ""}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{formatTime(item.createdAt)}</Text>
          </View>
          {item.isResolved ? (
            <View style={styles.statusResolved}>
              <CheckCircle2 size={14} color="#16A34A" />
              <Text style={styles.statusTextResolved}>Đã xử lý</Text>
            </View>
          ) : (
            <View style={styles.statusPending}>
              <AlertTriangle size={14} color="#B45309" />
              <Text style={styles.statusTextPending}>Chưa xử lý</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử sự cố</Text>
        <Text style={styles.headerSub}>Quản lý sự cố và bảo trì</Text>
      </View>

      {/* 🟢 FILTER SECTION (Truyền thêm Lab Props) */}
      <IncidentFilterBar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterSeverity={filterImportance}
        onSeverityChange={setFilterImportance}
        // Lab Props
        labOptions={labOptions}
        selectedLabId={selectedLabId}
        onLabChange={setSelectedLabId}
      />

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={incidents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Không tìm thấy sự cố nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 16, backgroundColor: "#FFF7ED" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 14 },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  impBadge: { padding: 4, paddingHorizontal: 8, borderRadius: 6 },
  impText: { fontSize: 11, fontWeight: "700" },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  desc: { fontSize: 13, color: "#475569", marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 12, color: "#64748B" },
  statusResolved: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#F0FDF4",
    padding: 4,
    borderRadius: 10,
  },
  statusTextResolved: { fontSize: 11, color: "#16A34A", fontWeight: "600" },
  statusPending: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#FFFBEB",
    padding: 4,
    borderRadius: 10,
  },
  statusTextPending: { fontSize: 11, color: "#B45309", fontWeight: "600" },
});
