import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Plus,
  Trash2,
  X,
  DoorOpen,
  Clock,
  FileText,
  Hash,
  ListFilter,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Building2,
  QrCode,
  CalendarDays,
} from "lucide-react-native";

import QRCode from "react-native-qrcode-svg";
import apiClient from "../../../utils/api";
import FilterSortBar, {
  FilterOption,
} from "../../../components/common/FilterSortBar";

// --- INTERFACES ---
interface DoorRequestItem {
  id: string;
  bookingCode: string;
  reason: string;
  requestTime: string;
  status: string;
}

interface VerifyResultData {
  id: string;
  bookingCode: string;
  labName: string;
  date: string;
  timeSlot: string;
  studentName?: string; // Nếu API trả về studentName hoặc requesterFullName
  isValid?: boolean; // Thuộc tính bổ sung để UI xử lý logic
}

interface DoorRequestDetail {
  id: string;
  bookingCode: string;
  reason: string;
  status: string;
  requestTime: string;
  acceptedTime?: string;
  managerNote?: string;
  labName: string;
  requestedByName: string;
  requestedByEmail: string;
  requestedByPhoneNumber: string;
}

// --- CONSTANTS ---
const PENDING_FILTER_OPTIONS: FilterOption[] = [
  { label: "Đang chờ", value: "Pending" },
];

const HISTORY_FILTER_OPTIONS: FilterOption[] = [
  { label: "Tất cả", value: "" },
  { label: "Đã duyệt", value: "Accepted" },
  { label: "Từ chối", value: "Rejected" },
];

// --- HELPER FUNCTIONS ---
const getStatusLabel = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "accepted") return "Đã duyệt";
  if (s === "rejected") return "Từ chối";
  return "Chờ duyệt";
};

const formatDateForAPI = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// --- HELPER FUNCTIONS ---

const getErrorMessage = (error: any) => {
  const data = error?.response?.data || error;

  console.log("🔥 Parsing Error Data:", JSON.stringify(data, null, 2));

  if (!data) return "Lỗi kết nối hoặc không có phản hồi.";
  if (data.errors && typeof data.errors === "object") {
    const errorKeys = Object.keys(data.errors);

    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const firstError = data.errors[firstKey];

      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
      if (typeof firstError === "string") {
        return firstError;
      }
    }
  }

  if (data.detail && typeof data.detail === "string") {
    return data.detail;
  }

  if (data.message && typeof data.message === "string") {
    if (
      data.message !== "Validation Failed" &&
      data.message !== "One or more validation errors occurred."
    ) {
      return data.message;
    }
  }

  if (typeof data === "string") return data;

  return data.message || data.title || "Có lỗi xảy ra, vui lòng thử lại.";
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function DoorRequestScreen() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [displayList, setDisplayList] = useState<DoorRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Sort
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<
    "Ascending" | "Descending"
  >("Descending");

  // Modal Create
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [reason, setReason] = useState("");

  // Verify State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResultData | null>(
    null
  );

  // Modal Detail
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<DoorRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // QR Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrContent, setQrContent] = useState<string>("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Fetch Requests
  const fetchDoorRequests = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    const isHistoryTab = activeTab === "history";
    const params: any = {
      PageNumber: 1,
      PageSize: 10,
      SortBy: "RequestTime",
      SortDirection: sortDirection,
      IsHistory: isHistoryTab,
    };
    if (filterDate) params.FilterDate = formatDateForAPI(filterDate);
    if (isHistoryTab) {
      if (filterStatus) params.FilterStatus = filterStatus;
    } else {
      params.FilterStatus = "Pending";
    }

    try {
      const response = await apiClient.get("/api/DoorRequests", { params });
      // Xử lý dữ liệu trả về linh hoạt
      const resData =
        response.data?.items ||
        response.data?.data ||
        (Array.isArray(response.data) ? response.data : []);
      setDisplayList(resData);
    } catch (error: any) {
      console.error("GET Requests Error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, activeTab, filterDate, filterStatus, sortDirection]);

  useEffect(() => {
    fetchDoorRequests();
  }, [fetchDoorRequests]);

  const handleTabChange = (tab: "pending" | "history") => {
    setActiveTab(tab);
    setFilterStatus("");
    setFilterDate(null);
    setSortDirection("Descending");
  };

  const handleVerifyCode = async () => {
    if (!bookingCode.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập Mã đặt phòng.");

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const response: any = await apiClient.get(
        `/api/Bookings/lookup/${bookingCode.trim()}`
      );

      // --- LOG ĐỂ KIỂM TRA (DEBUG) ---
      console.log(
        "1. Raw Response:",
        !!response.config ? "Axios Object" : "JSON Object"
      );

      // Bước 1: Lấy JSON body (loại bỏ lớp vỏ Axios nếu có)
      const apiBody = response.data !== undefined ? response.data : response;

      // Bước 2: Tìm dữ liệu thực tế (Phòng máy, thời gian...)
      // Chúng ta sẽ kiểm tra xem dữ liệu nằm trực tiếp hay nằm trong field .data
      let finalData = null;

      if (apiBody.bookingCode) {
        // Trường hợp 1: Dữ liệu đã được bóc tách hoàn toàn (giống log trước của bạn)
        finalData = apiBody;
      } else if (apiBody.data && apiBody.data.bookingCode) {
        // Trường hợp 2: Dữ liệu nằm trong field .data (giống trên Swagger)
        finalData = apiBody.data;
      }

      // Bước 3: Xử lý kết quả
      if (finalData) {
        console.log("==> ĐÃ TÌM THẤY PHÒNG:", finalData.labName);
        setVerifyResult({ ...finalData, isValid: true });
      } else {
        // Nếu không tìm thấy field bookingCode ở đâu cả
        const msg =
          apiBody?.message ||
          "Mã đặt phòng không hợp lệ hoặc không có dữ liệu.";
        Alert.alert("Thông báo", msg);
      }
    } catch (error: any) {
      console.error("Lỗi API:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Không thể kết nối hoặc mã không tồn tại.";
      Alert.alert("Lỗi", errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!bookingCode.trim() || !reason.trim())
      return Alert.alert("Thiếu thông tin", "Nhập đủ mã và lý do.");

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/DoorRequests", {
        bookingCode: bookingCode.trim(),
        reason: reason.trim(),
      });
      Alert.alert("Thành công", "Đã gửi yêu cầu mở cửa.");
      setBookingCode("");
      setReason("");
      setVerifyResult(null);
      setModalVisible(false);
      setActiveTab("pending");
      fetchDoorRequests();
    } catch (error: any) {
      Alert.alert("Gửi thất bại", getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    Alert.alert("Xác nhận", "Hủy yêu cầu này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/DoorRequests/${id}`);
            fetchDoorRequests();
          } catch (e) {
            Alert.alert("Lỗi", getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleViewDetail = async (id: string) => {
    setDetailModalVisible(true);
    setIsLoadingDetail(true);
    setSelectedRequest(null);
    try {
      const response = await apiClient.get(`/api/DoorRequests/${id}`);
      setSelectedRequest(response.data?.data || response.data);
    } catch (error) {
      Alert.alert("Lỗi", "Không tải được chi tiết yêu cầu.");
      setDetailModalVisible(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleShowQrCode = async (id: string) => {
    setQrModalVisible(true);
    setIsLoadingQr(true);
    setQrContent("");
    try {
      const payload = { requestId: id, createdAt: new Date().toISOString() };
      setQrContent(JSON.stringify(payload));
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo mã QR.");
      setQrModalVisible(false);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const renderItem = ({ item }: { item: DoorRequestItem }) => {
    let statusColor = "#B45309";
    let statusBg = "#FFFBEB";
    let statusIcon = <Clock size={12} color="#B45309" />;
    const s = item.status?.toLowerCase();
    const isAccepted = s === "accepted";

    if (isAccepted) {
      statusColor = "#166534";
      statusBg = "#DCFCE7";
      statusIcon = <CheckCircle2 size={12} color="#166534" />;
    } else if (s === "rejected") {
      statusColor = "#B91C1C";
      statusBg = "#FEE2E2";
      statusIcon = <XCircle size={12} color="#B91C1C" />;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Hash size={18} color="#EA580C" />
            <Text style={styles.cardTitle}>Mã: {item.bookingCode}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {activeTab === "history" && isAccepted && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleShowQrCode(item.id)}
              >
                <QrCode size={20} color="#0F172A" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleViewDetail(item.id)}
            >
              <Eye size={20} color="#0EA5E9" />
            </TouchableOpacity>
            {activeTab === "pending" && (
              <TouchableOpacity
                onPress={() => handleDeleteRequest(item.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.row}>
          <FileText size={14} color="#64748B" style={{ marginTop: 2 }} />
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.reason}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.dateText}>
              {item.requestTime
                ? new Date(item.requestTime).toLocaleString("vi-VN")
                : "--/--"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <DoorOpen size={24} color="#EA580C" />
          <Text style={styles.headerTitle}>Yêu cầu mở cửa</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FilterSortBar
        selectedDate={filterDate}
        onDateChange={setFilterDate}
        sortDirection={sortDirection}
        onSortChange={setSortDirection}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        statusOptions={
          activeTab === "history"
            ? HISTORY_FILTER_OPTIONS
            : PENDING_FILTER_OPTIONS
        }
        isStatusDisabled={activeTab === "pending"}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "pending" && styles.tabActive,
          ]}
          onPress={() => handleTabChange("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.tabTextActive,
            ]}
          >
            Chờ duyệt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "history" && styles.tabActive,
          ]}
          onPress={() => handleTabChange("history")}
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

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={displayList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchDoorRequests();
              }}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ListFilter size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {activeTab === "pending"
                  ? "Không có yêu cầu đang chờ."
                  : "Không tìm thấy dữ liệu."}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL TẠO MỚI */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo yêu cầu mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Mã đặt phòng:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Ví dụ: G8ZCCU7A"
                  value={bookingCode}
                  onChangeText={(t) => {
                    setBookingCode(t);
                    setVerifyResult(null);
                  }}
                />
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Search size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              {verifyResult && (
                <View
                  style={[
                    styles.verifiedCard,
                    !verifyResult.isValid && {
                      backgroundColor: "#FEF2F2",
                      borderColor: "#FCA5A5",
                    },
                  ]}
                >
                  <View style={styles.verifiedHeader}>
                    <CheckCircle2 size={16} color="#166534" />
                    <Text style={styles.verifiedTitle}>Thông tin hợp lệ</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Building2 size={14} color="#64748B" />
                    <Text
                      style={[
                        styles.verifiedText,
                        { fontWeight: "700", color: "#0F172A" },
                      ]}
                    >
                      {verifyResult.labName}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <CalendarDays size={14} color="#64748B" />
                    <Text style={styles.verifiedText}>
                      {verifyResult.date} ({verifyResult.timeSlot})
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Lý do cần mở cửa:</Text>
              <TextInput
                style={styles.inputMulti}
                placeholder="Nhập lý do..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitting || !verifyResult) && styles.disabledButton,
                ]}
                onPress={handleCreateRequest}
                disabled={isSubmitting || !verifyResult}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL QR CODE */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { alignItems: "center", paddingBottom: 40 },
            ]}
          >
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <X size={26} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}
            >
              Mã QR Mở Cửa
            </Text>
            {isLoadingQr ? (
              <ActivityIndicator size="large" color="#EA580C" />
            ) : (
              <View
                style={{
                  padding: 20,
                  backgroundColor: "white",
                  borderRadius: 10,
                  elevation: 5,
                }}
              >
                <QRCode value={qrContent} size={200} />
              </View>
            )}
            <Text
              style={{ marginTop: 20, color: "#64748B", textAlign: "center" }}
            >
              Đưa mã này vào máy quét tại phòng Lab.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  addButton: {
    backgroundColor: "#EA580C",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#EA580C", fontWeight: "700" },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  deleteButton: { padding: 4 },
  iconButton: { padding: 4 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  descriptionText: { fontSize: 14, color: "#334155", flex: 1 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 12, color: "#64748B" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 10,
  },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  inputFlex: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkButton: {
    backgroundColor: "#0EA5E9",
    width: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedCard: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 16,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  verifiedTitle: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  verifiedText: { fontSize: 13, color: "#334155" },
  inputMulti: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#EA580C",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8" },
});
