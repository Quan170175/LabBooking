import { Stack, useRouter } from "expo-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronRight,
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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// (Giả sử bạn sẽ tạo 1 file utils/incidentTypes.ts từ code C#)
// import { Incident, IncidentSeverity, IncidentType } from "../../utils/incidentTypes";

// 1. ĐỊNH NGHĨA TYPESCRIPT (Dựa trên C#)
// ===================================
export type IncidentSeverity = "Low" | "Medium" | "High";

export type IncidentType =
  | "Fire"
  | "PowerOutage"
  | "EquipmentFailure"
  | "SecurityIssue"
  | "Opened"
  | "Closed"
  | "Other";

export type Incident = {
  id: string; // (Guid)
  labRoomId: string;
  labRoom?: { name: string }; // (Dữ liệu join)
  reportedById: string;
  reportedBy?: { name: string }; // (Dữ liệu join)
  bookingId?: string; // (Nullable Guid)
  type: IncidentType;
  description: string;
  isResolved: boolean;
  createdAt: string; // (DateTime)
  levelOfImportance: IncidentSeverity;
};

// 2. DỮ LIỆU GIẢ LẬP (MOCK DATA)
// ===================================
const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC_101",
    labRoomId: "lab1",
    labRoom: { name: "Phòng Lab A101" },
    levelOfImportance: "High",
    reportedById: "sec_user_1",
    reportedBy: { name: "Security Team A" },
    bookingId: "booking-guid-123",
    type: "PowerOutage",
    description:
      "Hệ thống điện chập chờn, đã ngắt cầu dao tổng của phòng A101 để đảm bảo an toàn. Yêu cầu đóng cửa phòng ngay lập tức.",
    createdAt: "2025-11-06T14:30:00Z",
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
    description:
      "Phát hiện rò rỉ nước từ điều hòa. Yêu cầu đóng cửa phòng để xử lý, dự kiến 1-2 ngày.",
    createdAt: "2025-11-06T11:15:00Z",
    isResolved: false,
  },
  {
    id: "INC_103",
    labRoomId: "lab1",
    labRoom: { name: "Phòng Lab A101" },
    levelOfImportance: "Low",
    reportedById: "sec_user_1",
    reportedBy: { name: "Security Team A" },
    bookingId: "booking-guid-456",
    type: "EquipmentFailure",
    description:
      "Máy in 3D số 2 có khói nhẹ. Đã tắt nguồn. Vẫn có thể dùng các thiết bị khác trong phòng.",
    createdAt: "2025-11-05T16:00:00Z",
    isResolved: true, // Đã xử lý
  },
];

// 3. CÁC HÀM HỖ TRỢ (HELPERS)
// ===================================

// Lấy màu và icon dựa trên Mức độ (LevelOfImportance)
const getSeverityConfig = (severity: IncidentSeverity) => {
  switch (severity) {
    case "High":
      return {
        color: "#DC2626", // Đỏ
        icon: <ShieldAlert size={20} color="white" />,
        label: "Rất nghiêm trọng",
      };
    case "Medium":
      return {
        color: "#D97706", // Vàng
        icon: <AlertTriangle size={20} color="white" />,
        label: "Nghiêm trọng",
      };
    case "Low":
    default:
      return {
        color: "#64748B", // Xám
        icon: <Info size={20} color="white" />,
        label: "Cảnh báo",
      };
  }
};

// Lấy tên và icon dựa trên Loại (IncidentType)
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

// Format thời gian (CreatedAt)
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

// 4. COMPONENT CARD (Nội bộ)
// ===================================
const IncidentCard = ({ incident }: { incident: Incident }) => {
  const router = useRouter();
  const severityConfig = getSeverityConfig(incident.levelOfImportance);
  const typeConfig = getIncidentTypeConfig(incident.type);

  // (Bạn có thể thêm logic để fetch booking từ ID nếu cần)
  const onBookingPress = () => {
    Alert.alert("Booking liên quan", `ID: ${incident.bookingId}`);
  };

  return (
    <View style={styles.card}>
      {/* Header (Mức độ) */}
      <View
        style={[styles.cardHeader, { backgroundColor: severityConfig.color }]}
      >
        {severityConfig.icon}
        <Text style={styles.cardHeaderText}>{severityConfig.label}</Text>
      </View>

      {/* Thân card */}
      <View style={styles.cardBody}>
        <Text style={styles.roomName}>
          {incident.labRoom?.name || incident.labRoomId}
        </Text>
        <Text style={styles.description}>{incident.description}</Text>

        {/* Chi tiết */}
        <View style={styles.detailsGrid}>
          {/* Thời gian */}
          <View style={styles.detailItem}>
            <Calendar size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {formatTimestamp(incident.createdAt)}
            </Text>
          </View>
          {/* Loại */}
          <View style={styles.detailItem}>
            {typeConfig.icon}
            <Text style={styles.detailText}>{typeConfig.label}</Text>
          </View>
          {/* Người báo cáo */}
          <View style={styles.detailItem}>
            <User size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {incident.reportedBy?.name || incident.reportedById}
            </Text>
          </View>
        </View>

        {/* Trạng thái xử lý (IsResolved) */}
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

        {/* Booking liên quan (nếu có) */}
        {incident.bookingId && (
          <TouchableOpacity
            style={styles.relatedBookingButton}
            onPress={onBookingPress}
          >
            <Text style={styles.relatedBookingText}>
              Xem Booking liên quan (ID: ...{incident.bookingId.slice(-6)})
            </Text>
            <ChevronRight size={16} color="#C2410C" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// 5. COMPONENT SCREEN CHÍNH
// ===================================
export default function SecurityIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tải dữ liệu (giả lập)
  useEffect(() => {
    const loadIncidents = async () => {
      setIsLoading(true);
      try {
        // (Trong tương lai, bạn sẽ dùng fetch hoặc AsyncStorage.getItem("securityIncidents"))
        setIncidents(MOCK_INCIDENTS);
      } catch (e) {
        console.error("Failed to load incidents", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadIncidents();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Báo cáo Security" }} />

      {isLoading ? (
        <ActivityIndicator
          style={styles.centered}
          size="large"
          color="#EA580C"
        />
      ) : (
        <FlatList
          data={incidents.sort((a, b) => (a.isResolved ? 1 : -1))} // Ưu tiên chưa xử lý lên đầu
          renderItem={({ item }) => <IncidentCard incident={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Báo cáo Security</Text>
              <Text style={styles.subtitle}>
                Theo dõi các sự cố mới nhất được báo cáo từ đội an ninh.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có báo cáo sự cố nào.</Text>
          }
        />
      )}
    </View>
  );
}

// 6. STYLESHEET
// ===================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  listContent: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 40,
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeaderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardBody: {
    padding: 16,
  },
  roomName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  detailsGrid: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#334155",
  },
  // Status Badge (IsResolved)
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusResolved: {
    backgroundColor: "#F0FDF4",
  },
  statusResolvedText: {
    color: "#15803D",
  },
  statusPending: {
    backgroundColor: "#FFFBEB",
  },
  statusPendingText: {
    color: "#B45309",
  },
  // Booking Button
  relatedBookingButton: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  relatedBookingText: {
    fontSize: 14,
    color: "#C2410C",
    fontWeight: "600",
  },
});
