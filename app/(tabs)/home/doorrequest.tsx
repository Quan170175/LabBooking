import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  DoorOpen,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  History,
  Trash2, // 🟢
} from "lucide-react-native";

import apiClient from "../../../utils/api";

export enum DoorRequestStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Completed = 3,
  Cancelled = 4,
}

interface LabRoom {
  id: string;
  labName: string;
  location: string;
}

interface DoorRequestItem {
  id: string;
  labRoomName: string;
  location: string;
  requestTime: string;
  status: DoorRequestStatus;
}

const mapStatus = (statusStr: string): DoorRequestStatus => {
  switch (statusStr) {
    case "Pending":
      return DoorRequestStatus.Pending;
    case "Accepted":
    case "Open":
      return DoorRequestStatus.Accepted;
    case "Rejected":
      return DoorRequestStatus.Rejected;
    case "Completed":
      return DoorRequestStatus.Completed;
    case "Cancelled":
      return DoorRequestStatus.Cancelled;
    default:
      return DoorRequestStatus.Pending;
  }
};

const getStatusConfig = (status: DoorRequestStatus) => {
  switch (status) {
    case DoorRequestStatus.Pending:
      return {
        label: "Chờ xử lý",
        color: "#F59E0B",
        bg: "#FEF3C7",
        icon: <Clock size={14} color="#F59E0B" />,
      };
    case DoorRequestStatus.Accepted:
      return {
        label: "Đã mở cửa",
        color: "#16A34A",
        bg: "#DCFCE7",
        icon: <CheckCircle2 size={14} color="#16A34A" />,
      };
    case DoorRequestStatus.Completed:
      return {
        label: "Hoàn thành",
        color: "#10B981",
        bg: "#D1FAE5",
        icon: <CheckCircle2 size={14} color="#10B981" />,
      };
    case DoorRequestStatus.Rejected:
      return {
        label: "Bị từ chối",
        color: "#EF4444",
        bg: "#FEE2E2",
        icon: <XCircle size={14} color="#EF4444" />,
      };
    case DoorRequestStatus.Cancelled:
      return {
        label: "Đã hủy",
        color: "#64748B",
        bg: "#F1F5F9",
        icon: <XCircle size={14} color="#64748B" />,
      };
    default:
      return {
        label: "Không rõ",
        color: "#6B7280",
        bg: "#F3F4F6",
        icon: <AlertCircle size={14} color="#6B7280" />,
      };
  }
};

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

export default function DoorRequestScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<DoorRequestItem[]>([]);
  const [rooms, setRooms] = useState<LabRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomRes, historyRes] = await Promise.all([
        apiClient.get("/api/LabRooms", {
          params: { PageNumber: 1, PageSize: 10 },
        }),
        apiClient.get("/api/DoorRequests/history"),
      ]);

      const rawRooms = roomRes.data?.items || roomRes.data?.data?.items || [];
      const mappedRooms: LabRoom[] = rawRooms.map((r: any) => ({
        id: r.id,
        labName: r.labName || r.name || "Phòng Lab",
        location: r.location || "Khu vực Lab",
      }));
      setRooms(mappedRooms);

      const rawHistory = Array.isArray(historyRes.data)
        ? historyRes.data
        : historyRes.data?.data || [];
      const mappedHistory: DoorRequestItem[] = rawHistory.map((h: any) => ({
        id: h.id,
        labRoomName: h.labRoomName || "Phòng Lab",
        location: "Yêu cầu cá nhân",
        requestTime: h.requestTime || h.createdDate || new Date().toISOString(),
        status: mapStatus(h.status),
      }));

      mappedHistory.sort(
        (a, b) =>
          new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime()
      );
      setRequests(mappedHistory);
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleCreateRequest = async () => {
    if (!selectedRoomId) {
      Alert.alert("Lỗi", "Vui lòng chọn phòng Lab.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/DoorRequests", { labRoomId: selectedRoomId });
      Alert.alert("Thành công", "Yêu cầu mở cửa đã được gửi!");
      setModalVisible(false);
      setSelectedRoomId(null);
      onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Gửi yêu cầu thất bại.";
      Alert.alert("Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 HÀM XỬ LÝ HỦY
  const handleCancelRequest = (id: string) => {
    Alert.alert("Hủy yêu cầu", "Bạn có chắc chắn muốn hủy yêu cầu này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Đồng ý",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.post(`/api/DoorRequests/cancel/${id}`);
            Alert.alert("Đã hủy", "Yêu cầu đã được hủy.");
            onRefresh();
          } catch (error: any) {
            Alert.alert(
              "Lỗi",
              error.response?.data?.message || "Không thể hủy."
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: DoorRequestItem }) => {
    const statusConf = getStatusConfig(item.status);
    const canCancel = item.status === DoorRequestStatus.Pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <DoorOpen size={20} color="#16A34A" />
            <Text style={styles.typeText}>{item.labRoomName}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}
          >
            {statusConf.icon}
            <Text style={[styles.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{formatTime(item.requestTime)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>

        {/* 🟢 HIỂN THỊ NÚT HỦY KHI PENDING */}
        {canCancel && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelRequest(item.id)}
            >
              <Trash2 size={16} color="#DC2626" />
              <Text style={styles.cancelButtonText}>Hủy yêu cầu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu Mở cửa</Text>
        <Text style={styles.headerSub}>Quản lý yêu cầu ra vào phòng Lab</Text>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
              <History size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>Chưa có lịch sử yêu cầu nào.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo yêu cầu mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Chọn phòng cần mở cửa</Text>
              <View style={styles.roomListContainer}>
                {rooms.length === 0 ? (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ color: "#94A3B8" }}>
                      Đang tải danh sách phòng...
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={rooms}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.roomItem,
                          selectedRoomId === item.id && styles.roomItemActive,
                        ]}
                        onPress={() => setSelectedRoomId(item.id)}
                      >
                        <View style={styles.roomItemLeft}>
                          <MapPin
                            size={18}
                            color={
                              selectedRoomId === item.id ? "#EA580C" : "#64748B"
                            }
                          />
                          <View>
                            <Text
                              style={[
                                styles.roomItemName,
                                selectedRoomId === item.id && styles.activeText,
                              ]}
                            >
                              {item.labName}
                            </Text>
                            <Text style={styles.roomItemLoc}>
                              {item.location}
                            </Text>
                          </View>
                        </View>
                        {selectedRoomId === item.id && (
                          <CheckCircle2 size={18} color="#EA580C" />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedRoomId || isSubmitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleCreateRequest}
              disabled={!selectedRoomId || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 16, backgroundColor: "#FFF7ED" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 14, color: "#64748B", marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeText: { fontWeight: "700", fontSize: 16, color: "#166534" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 16, gap: 6 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  infoText: { color: "#64748B", fontSize: 13 },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EA580C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  formGroup: { marginBottom: 20, flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 10,
  },
  roomListContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  roomItemActive: { backgroundColor: "#FFF7ED" },
  roomItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  roomItemName: { fontSize: 14, color: "#334155", fontWeight: "500" },
  roomItemLoc: { fontSize: 12, color: "#94A3B8" },
  activeText: { color: "#EA580C", fontWeight: "700" },
  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: { backgroundColor: "#CBD5E1" },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },

  // 🟢 STYLE CHO FOOTER & NÚT HỦY
  cardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
});
