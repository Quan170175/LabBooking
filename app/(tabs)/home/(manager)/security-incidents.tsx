import { Stack } from "expo-router";
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
  Phone,
  User,
  X,
  Eye,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
} from "react-native";

import IncidentFilterBar from "../../../../components/common/IncidentFilterBar";
import apiClient from "../../../../utils/api";

export type IncidentType =
  | "Fire"
  | "PowerOutage"
  | "EquipmentFailure"
  | "SecurityIssue"
  | "Opened"
  | "Closed"
  | "Other"
  | string;

export type IncidentSeverity = "High" | "Medium" | "Low";

export type Incident = {
  id: string;
  labRoomId: string;
  labRoomName: string;
  reportedById: string;
  reportedByName: string | null;
  reportedByPhone: string | null;
  equipmentName: string | null;
  type: IncidentType;
  description: string;
  isResolved: boolean;
  createdAt: string;
  levelOfImportance: IncidentSeverity;
  rawStatus: string;
};

const getSeverityConfig = (severity: IncidentSeverity) => {
  switch (severity) {
    case "High":
      return {
        color: "#DC2626",
        bgColor: "#FEE2E2",
        icon: <ShieldAlert size={20} color="white" />,
        label: "Rất nghiêm trọng",
      };
    case "Medium":
      return {
        color: "#D97706",
        bgColor: "#FEF3C7",
        icon: <AlertTriangle size={20} color="white" />,
        label: "Nghiêm trọng",
      };
    case "Low":
    default:
      return {
        color: "#64748B",
        bgColor: "#F1F5F9",
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
      return {
        label: type || "Khác",
        icon: <Clipboard size={14} color="#64748B" />,
      };
  }
};

const formatTimestamp = (isoString: string) => {
  try {
    if (!isoString) return "N/A";
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

const IncidentCard = ({
  incident,
  onPress,
  onDelete,
}: {
  incident: Incident;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const severityConfig = getSeverityConfig(incident.levelOfImportance);
  const typeConfig = getIncidentTypeConfig(incident.type);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[styles.cardHeader, { backgroundColor: severityConfig.color }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {severityConfig.icon}
          <Text style={styles.cardHeaderText}>{severityConfig.label}</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={onPress}>
            <Eye size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          {!incident.isResolved && (
            <TouchableOpacity onPress={onDelete}>
              <Trash2 size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.roomName} numberOfLines={1}>
          {incident.labRoomName}{" "}
          {incident.equipmentName ? `- ${incident.equipmentName}` : ""}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {incident.description}
        </Text>

        <View style={styles.cardFooterRow}>
          <View style={styles.footerLeft}>
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

          <View style={styles.footerRight}>
            {incident.isResolved ? (
              <View style={[styles.statusBadge, styles.statusResolved]}>
                <CheckCircle size={14} color="#15803D" />
                <Text
                  style={[styles.statusBadgeText, styles.statusResolvedText]}
                >
                  Đã xử lý
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusPending]}>
                <AlertTriangle size={14} color="#B45309" />
                <Text
                  style={[styles.statusBadgeText, styles.statusPendingText]}
                >
                  Chưa xử lý
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SecurityIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  // --- API: FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
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

      if (filterStatus === "Resolved") params.IsResolved = true;
      else if (filterStatus === "Pending") params.IsResolved = false;
      if (filterSeverity !== "All") params.Importance = filterSeverity;

      const response = await apiClient.get("/api/Incidents", { params });

      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      }

      const mappedData: Incident[] = rawData.map((item: any) => ({
        id: item.id,
        labRoomId: item.labRoomId || "unknown",
        labRoomName: item.labRoomName || "Chưa xác định",
        reportedById: "system",
        reportedByName: item.reportedByName,
        reportedByPhone: item.reportedByPhone,
        equipmentName: item.equipmentName,
        type: item.type,
        description: item.description,
        isResolved:
          !!item.resolvedAt ||
          item.status === "Đã xử lý" ||
          item.isResolved === true,
        rawStatus: item.status || "Chưa xử lý",
        createdAt: item.createdAt,
        levelOfImportance: (item.importanceLevel as IncidentSeverity) || "Low",
      }));

      setIncidents(mappedData);
    } catch (error) {
      console.error("❌ Error fetching incidents:", error);
      setIncidents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, filterSeverity, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    console.log("🔍 [Prepare Delete] ID to delete:", id);

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                `🚀 [Deleting] Calling API: DELETE /api/Incidents/${id}`
              );

              // Gọi API Delete
              const res = await apiClient.delete(`/api/Incidents/${id}`);

              // Log kết quả thành công
              console.log("✅ [Delete Success] Status:", res.status, res.data);

              // Cập nhật UI
              setIncidents((prev) => prev.filter((item) => item.id !== id));
              if (selectedIncident?.id === id) setModalVisible(false);

              Alert.alert("Thành công", "Đã xóa sự cố.");
            } catch (error: any) {
              console.error("❌ [Delete FAILED] Error details:");
              if (error.response) {
                console.log("   - Status:", error.response.status);
                console.log(
                  "   - Data:",
                  JSON.stringify(error.response.data, null, 2)
                );
                console.log("   - Headers:", error.response.headers);

                Alert.alert(
                  "Lỗi xóa (" + error.response.status + ")",
                  typeof error.response.data === "string"
                    ? error.response.data
                    : "Server trả về lỗi không xác định. Vui lòng xem log."
                );
              } else if (error.request) {
                console.log("   - No response received:", error.request);
                Alert.alert("Lỗi mạng", "Không thể kết nối đến server.");
              } else {
                // Lỗi setup
                console.log("   - Error Message:", error.message);
                Alert.alert("Lỗi", error.message);
              }
            }
          },
        },
      ]
    );
  };

  const handleOpenDetail = (incident: Incident) => {
    setSelectedIncident(incident);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Báo cáo từ bảo vệ" }} />

      <View style={styles.fixedHeaderContainer}>
        <View style={styles.headerTitleArea}>
          <Text style={styles.title}>Báo cáo từ bảo vệ</Text>
          {/* <Text style={styles.subtitle}>
            Theo dõi sự cố và phản hồi nhanh chóng.
          </Text> */}
        </View>

        <IncidentFilterBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterSeverity={filterSeverity}
          onSeverityChange={setFilterSeverity}
        />
      </View>

      {isLoading && !isRefreshing ? (
        <ActivityIndicator
          style={styles.centered}
          size="large"
          color="#EA580C"
        />
      ) : (
        <FlatList
          data={incidents}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => handleOpenDetail(item)}
              onDelete={() => handleDelete(item.id)} // Truyền hàm xóa
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchData();
              }}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Clipboard size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Không tìm thấy sự cố nào.</Text>
            </View>
          }
        />
      )}

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết sự cố</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedIncident && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Thông tin chung</Text>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Phòng:</Text>
                    <Text style={styles.value}>
                      {selectedIncident.labRoomName}
                    </Text>
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Trạng thái:</Text>
                    <Text
                      style={[
                        styles.value,
                        {
                          color: selectedIncident.isResolved
                            ? "#15803D"
                            : "#B45309",
                        },
                      ]}
                    >
                      {selectedIncident.rawStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Nội dung báo cáo</Text>
                  <Text style={styles.descriptionText}>
                    {selectedIncident.description}
                  </Text>
                  <Text style={styles.timeText}>
                    Thời gian: {formatTimestamp(selectedIncident.createdAt)}
                  </Text>
                </View>

                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Người báo cáo</Text>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Họ tên:</Text>
                    <Text style={styles.value}>
                      {selectedIncident.reportedByName || "Không có tên"}
                    </Text>
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>SĐT:</Text>
                    <Text style={styles.value}>
                      {selectedIncident.reportedByPhone || "Không có SĐT"}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={{ gap: 10 }}>
              {selectedIncident && !selectedIncident.isResolved && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#DC2626" }]}
                  onPress={() => handleDelete(selectedIncident.id)}
                >
                  <Text style={styles.modalButtonText}>Xóa báo cáo này</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- 5. STYLES ---
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
    marginTop: 12,
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
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  cardFooterRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: { gap: 6 },
  footerRight: {},
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: "#334155" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "600" },
  statusResolved: { backgroundColor: "#F0FDF4" },
  statusResolvedText: { color: "#15803D" },
  statusPending: { backgroundColor: "#FFFBEB" },
  statusPendingText: { color: "#B45309" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  closeButton: { padding: 4 },
  modalBody: { marginBottom: 20 },
  sectionBox: {
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: { fontSize: 14, color: "#64748B", minWidth: 80 },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    textAlign: "right",
  },
  descriptionText: { fontSize: 15, color: "#334155", lineHeight: 22 },
  timeText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 8,
    fontStyle: "italic",
  },
  modalButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
