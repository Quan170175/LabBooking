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
  ChevronLeft,
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
} from "lucide-react-native";

// --- 1. TYPES & MOCK DATA ---

export enum DoorRequestStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Completed = 3,
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

// 🟢 DỮ LIỆU GIẢ: DANH SÁCH PHÒNG
const MOCK_ROOMS: LabRoom[] = [
  { id: "1", labName: "Phòng Lab IoT (A301)", location: "Tòa A - Tầng 3" },
  { id: "2", labName: "Phòng Lab AI (B202)", location: "Tòa B - Tầng 2" },
  { id: "3", labName: "Phòng Lab Network (C101)", location: "Tòa C - Tầng 1" },
  { id: "4", labName: "Hội trường Beta", location: "Khu F" },
];

// 🟢 DỮ LIỆU GIẢ: LỊCH SỬ YÊU CẦU
const MOCK_HISTORY: DoorRequestItem[] = [
  {
    id: "req-001",
    labRoomName: "Phòng Lab IoT (A301)",
    location: "Tòa A - Tầng 3",
    requestTime: new Date().toISOString(),
    status: DoorRequestStatus.Pending,
  },
  {
    id: "req-002",
    labRoomName: "Phòng Lab AI (B202)",
    location: "Tòa B - Tầng 2",
    requestTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    status: DoorRequestStatus.Accepted,
  },
  {
    id: "req-003",
    labRoomName: "Phòng Lab Network (C101)",
    location: "Tòa C - Tầng 1",
    requestTime: new Date(Date.now() - 86400 * 1000).toISOString(), // Hôm qua
    status: DoorRequestStatus.Completed,
  },
  {
    id: "req-004",
    labRoomName: "Hội trường Beta",
    location: "Khu F",
    requestTime: new Date(Date.now() - 172800 * 1000).toISOString(), // 2 ngày trước
    status: DoorRequestStatus.Rejected,
  },
];

// Helper hiển thị trạng thái
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
        label: "Đã tiếp nhận",
        color: "#3B82F6",
        bg: "#EFF6FF",
        icon: <Loader2 size={14} color="#3B82F6" />,
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
  const date = new Date(isoString);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export default function DoorRequestScreen() {
  const router = useRouter();

  // --- STATE ---
  const [requests, setRequests] = useState<DoorRequestItem[]>([]);
  const [rooms, setRooms] = useState<LabRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 2. LOAD DATA GIẢ ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Giả lập delay mạng 1 giây
    setTimeout(() => {
      setRequests(MOCK_HISTORY);
      setRooms(MOCK_ROOMS);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(); // Load lại data gốc
  };

  // --- 3. TẠO YÊU CẦU GIẢ ---
  const handleCreateRequest = async () => {
    if (!selectedRoomId) {
      Alert.alert("Lỗi", "Vui lòng chọn phòng Lab.");
      return;
    }

    setIsSubmitting(true);

    // Tìm thông tin phòng đã chọn để hiển thị local
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

    // Giả lập delay gửi API
    setTimeout(() => {
      // Tạo một item mới thêm vào đầu danh sách
      const newRequest: DoorRequestItem = {
        id: Math.random().toString(), // ID ngẫu nhiên
        labRoomName: selectedRoom?.labName || "Phòng Lab",
        location: selectedRoom?.location || "Không xác định",
        requestTime: new Date().toISOString(),
        status: DoorRequestStatus.Pending, // Mặc định là Chờ xử lý
      };

      setRequests([newRequest, ...requests]); // Thêm vào đầu list

      setIsSubmitting(false);
      setModalVisible(false);
      setSelectedRoomId(null); // Reset chọn phòng

      Alert.alert("Thành công", "Yêu cầu mở cửa đã được gửi.");
    }, 1500);
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: DoorRequestItem }) => {
    const statusConf = getStatusConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <DoorOpen size={24} color="#16A34A" />
            <Text style={styles.typeText}>Yêu cầu MỞ cửa</Text>
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
          <Text style={styles.roomName}>{item.labRoomName}</Text>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#64748B" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{formatTime(item.requestTime)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu Mở cửa</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* LIST */}
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

      {/* FAB - NÚT TẠO YÊU CẦU */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* MODAL TẠO YÊU CẦU */}
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
              {/* Danh sách phòng trong Modal */}
              <View style={styles.roomListContainer}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  backButton: { padding: 4 },

  // List
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    backgroundColor: "#F0FDF4", // Nền xanh nhạt cho header card
    borderBottomWidth: 1,
    borderBottomColor: "#DCFCE7",
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeText: { fontWeight: "700", fontSize: 14, color: "#166534" }, // Chữ xanh đậm

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  cardBody: { padding: 16 },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  infoText: { color: "#64748B", fontSize: 13 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
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

  // Modal
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
    height: "60%", // Chiều cao modal
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

  // Room List in Modal
  roomListContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
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

  // Submit Button
  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: { backgroundColor: "#CBD5E1" },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
