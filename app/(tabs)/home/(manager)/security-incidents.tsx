import { Stack, useRouter } from "expo-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clipboard,
  DoorClosed,
  DoorOpen,
  Flame,
  Info,
  PowerOff,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";

// Import Component Lọc Mới Tách
import IncidentFilters, {
  FilterSeverityType,
  FilterStatusType,
  IncidentSeverity,
} from "../../../../components/security/IncidentFilters";

// 1. TYPE DEFINITIONS
export type IncidentType =
  | "Fire"
  | "PowerOutage"
  | "EquipmentFailure"
  | "SecurityIssue"
  | "Opened"
  | "Closed"
  | "Other";

export type Incident = {
  id: string;
  labRoomId: string;
  labRoom?: { name: string };
  reportedById: string;
  reportedBy?: { name: string };
  bookingId?: string;
  type: IncidentType;
  description: string;
  isResolved: boolean;
  createdAt: string;
  levelOfImportance: IncidentSeverity;
};

// 2. MOCK DATA
const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC_101",
    labRoomId: "lab1",
    labRoom: { name: "Phòng Lab A101" },
    levelOfImportance: "High",
    reportedById: "sec_user_1",
    reportedBy: { name: "Security Team A" },
    type: "PowerOutage",
    description: "Hệ thống điện chập chờn, đã ngắt cầu dao tổng.",
    createdAt: new Date().toISOString(),
    isResolved: false,
  },
  {
    id: "INC_102",
    labRoomId: "lab2",
    labRoom: { name: "Phòng Lab B202" },
    levelOfImportance: "Medium",
    reportedById: "sec_user_2",
    reportedBy: { name: "Security Team B" },
    type: "Closed",
    description: "Phát hiện rò rỉ nước từ điều hòa.",
    createdAt: new Date().toISOString(),
    isResolved: false,
  },
  {
    id: "INC_103",
    labRoomId: "lab1",
    labRoom: { name: "Phòng Lab A101" },
    levelOfImportance: "Low",
    reportedById: "sec_user_1",
    reportedBy: { name: "Security Team A" },
    type: "EquipmentFailure",
    description: "Máy in 3D số 2 có khói nhẹ. Đã tắt nguồn.",
    createdAt: "2023-11-05T16:00:00Z",
    isResolved: true,
  },
];

// 3. HELPERS & CARD COMPONENT (Giữ nguyên)
const getSeverityConfig = (severity: IncidentSeverity) => {
  switch (severity) {
    case "High":
      return {
        color: "#DC2626",
        icon: <ShieldAlert size={20} color="white" />,
        label: "Rất nghiêm trọng",
      };
    case "Medium":
      return {
        color: "#D97706",
        icon: <AlertTriangle size={20} color="white" />,
        label: "Nghiêm trọng",
      };
    case "Low":
    default:
      return {
        color: "#64748B",
        icon: <Info size={20} color="white" />,
        label: "Cảnh báo",
      };
  }
};

const getIncidentTypeConfig = (type: IncidentType) => {
  switch (type) {
    case "Fire":
      return { label: "Cháy nổ", icon: <Flame size={14} color="#64748B" /> };
    case "PowerOutage":
      return {
        label: "Cúp điện",
        icon: <PowerOff size={14} color="#64748B" />,
      };
    case "EquipmentFailure":
      return {
        label: "Hỏng thiết bị",
        icon: <AlertTriangle size={14} color="#64748B" />,
      };
    case "SecurityIssue":
      return { label: "An ninh", icon: <Shield size={14} color="#64748B" /> };
    case "Opened":
      return { label: "Mở cửa", icon: <DoorOpen size={14} color="#64748B" /> };
    case "Closed":
      return {
        label: "Đóng cửa",
        icon: <DoorClosed size={14} color="#64748B" />,
      };
    default:
      return { label: "Khác", icon: <Clipboard size={14} color="#64748B" /> };
  }
};

const formatTimestamp = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "N/A";
  }
};

const IncidentCard = ({ incident }: { incident: Incident }) => {
  const severityConfig = getSeverityConfig(incident.levelOfImportance);
  const typeConfig = getIncidentTypeConfig(incident.type);

  return (
    <View style={styles.card}>
      <View
        style={[styles.cardHeader, { backgroundColor: severityConfig.color }]}
      >
        {severityConfig.icon}
        <Text style={styles.cardHeaderText}>{severityConfig.label}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.roomName}>
          {incident.labRoom?.name || incident.labRoomId}
        </Text>
        <Text style={styles.description}>{incident.description}</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {formatTimestamp(incident.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            {typeConfig.icon}
            <Text style={styles.detailText}>{typeConfig.label}</Text>
          </View>
        </View>
        {incident.isResolved ? (
          <View style={[styles.statusBadge, styles.statusResolved]}>
            <CheckCircle size={14} color="#15803D" />
            <Text style={[styles.statusBadgeText, styles.statusResolvedText]}>
              Đã xử lý
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <AlertTriangle size={14} color="#B45309" />
            <Text style={[styles.statusBadgeText, styles.statusPendingText]}>
              Chưa xử lý
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// 4. MAIN SCREEN
export default function SecurityIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER STATES (Vẫn giữ ở đây để lọc data) ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterSeverity, setFilterSeverity] =
    useState<FilterSeverityType>("All");
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>("All");

  useEffect(() => {
    setTimeout(() => {
      setIncidents(MOCK_INCIDENTS);
      setIsLoading(false);
    }, 500);
  }, []);

  // --- FILTER LOGIC ---
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const isSameDate =
        itemDate.getDate() === selectedDate.getDate() &&
        itemDate.getMonth() === selectedDate.getMonth() &&
        itemDate.getFullYear() === selectedDate.getFullYear();
      if (!isSameDate) return false;
      if (filterSeverity !== "All" && item.levelOfImportance !== filterSeverity)
        return false;
      if (filterStatus === "Resolved" && !item.isResolved) return false;
      if (filterStatus === "Pending" && item.isResolved) return false;
      return true;
    });
  }, [incidents, selectedDate, filterSeverity, filterStatus]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Báo cáo Security" }} />

      {/* --- PHẦN CỐ ĐỊNH --- */}
      <View style={styles.fixedHeaderContainer}>
        <View style={styles.headerTitleArea}>
          <Text style={styles.title}>Báo cáo Security</Text>
          <Text style={styles.subtitle}>
            Theo dõi các sự cố mới nhất được lọc theo tiêu chí.
          </Text>
        </View>

        {/* --- GỌI COMPONENT LỌC (Code gọn hơn rất nhiều) --- */}
        <IncidentFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filterSeverity={filterSeverity}
          onSeverityChange={setFilterSeverity}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
        />
      </View>

      {/* --- DANH SÁCH --- */}
      {isLoading ? (
        <ActivityIndicator
          style={styles.centered}
          size="large"
          color="#EA580C"
        />
      ) : (
        <FlatList
          data={filteredIncidents.sort((a, b) => (a.isResolved ? 1 : -1))}
          renderItem={({ item }) => <IncidentCard incident={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy sự cố nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  fixedHeaderContainer: { backgroundColor: "#FFF7ED", zIndex: 10 },
  headerTitleArea: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 40,
  },
  // Card styles... (Giữ nguyên như cũ)
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardHeaderText: { color: "white", fontSize: 15, fontWeight: "bold" },
  cardBody: { padding: 16 },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  description: { fontSize: 14, color: "#475569", lineHeight: 20 },
  detailsGrid: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    gap: 8,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: "#334155" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "600" },
  statusResolved: { backgroundColor: "#F0FDF4" },
  statusResolvedText: { color: "#15803D" },
  statusPending: { backgroundColor: "#FFFBEB" },
  statusPendingText: { color: "#B45309" },
});
