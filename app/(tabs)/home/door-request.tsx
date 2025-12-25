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
  User,
  Phone,
  Mail,
  StickyNote,
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
  studentName?: string;
  isValid?: boolean;
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

const getErrorMessage = (error: any) => {
  const data = error?.response?.data || error;
  if (!data) return "Lỗi kết nối hoặc không có phản hồi.";
  if (data.errors && typeof data.errors === "object") {
    const errorKeys = Object.keys(data.errors);
    if (errorKeys.length > 0) {
      const firstError = data.errors[errorKeys[0]];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }
  }
  return data.detail || data.message || "Có lỗi xảy ra, vui lòng thử lại.";
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
      PageSize: 50, // Lấy nhiều hơn để test
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
      const apiBody = response.data !== undefined ? response.data : response;
      let finalData = apiBody.bookingCode
        ? apiBody
        : apiBody.data?.bookingCode
        ? apiBody.data
        : null;

      if (finalData) {
        setVerifyResult({ ...finalData, isValid: true });
      } else {
        Alert.alert("Thông báo", apiBody?.message || "Mã không hợp lệ.");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Mã không tồn tại.");
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
      // Logic Payload QR tùy thuộc vào hệ thống của bạn
      const payload = { requestId: id, timestamp: new Date().getTime() };
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
          <View style={{ flexDirection: "row", gap: 12 }}>
            {activeTab === "history" && isAccepted && (
              <TouchableOpacity onPress={() => handleShowQrCode(item.id)}>
                <QrCode size={20} color="#0F172A" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleViewDetail(item.id)}>
              <Eye size={20} color="#0EA5E9" />
            </TouchableOpacity>
            {activeTab === "pending" && (
              <TouchableOpacity onPress={() => handleDeleteRequest(item.id)}>
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
        {["pending", "history"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "pending" ? "Chờ duyệt" : "Lịch sử"}
            </Text>
          </TouchableOpacity>
        ))}
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
                <View style={styles.verifiedCard}>
                  <View style={styles.verifiedHeader}>
                    <CheckCircle2 size={16} color="#166534" />
                    <Text style={styles.verifiedTitle}>Thông tin hợp lệ</Text>
                  </View>
                  <View style={styles.verifiedInfoItem}>
                    <Building2 size={14} color="#64748B" />
                    <Text style={styles.verifiedTextMain}>
                      {verifyResult.labName}
                    </Text>
                  </View>
                  <View style={styles.verifiedInfoItem}>
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

      {/* MODAL CHI TIẾT YÊU CẦU */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {isLoadingDetail ? (
              <ActivityIndicator
                size="large"
                color="#EA580C"
                style={{ marginVertical: 40 }}
              />
            ) : selectedRequest ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <DetailRow
                    icon={<Building2 size={18} color="#EA580C" />}
                    label="Phòng Lab"
                    value={selectedRequest.labName}
                  />
                  <DetailRow
                    icon={<Hash size={18} color="#EA580C" />}
                    label="Mã đặt phòng"
                    value={selectedRequest.bookingCode}
                  />
                  <DetailRow
                    icon={<Clock size={18} color="#EA580C" />}
                    label="Thời gian gửi"
                    value={new Date(selectedRequest.requestTime).toLocaleString(
                      "vi-VN"
                    )}
                  />
                  <DetailRow
                    icon={<FileText size={18} color="#EA580C" />}
                    label="Lý do"
                    value={selectedRequest.reason}
                  />
                </View>

                <Text style={styles.sectionTitle}>Thông tin người gửi</Text>
                <View style={styles.detailCard}>
                  <DetailRow
                    icon={<User size={18} color="#64748B" />}
                    label="Họ tên"
                    value={selectedRequest.requestedByName}
                  />
                  <DetailRow
                    icon={<Mail size={18} color="#64748B" />}
                    label="Email"
                    value={selectedRequest.requestedByEmail}
                  />
                  <DetailRow
                    icon={<Phone size={18} color="#64748B" />}
                    label="Số điện thoại"
                    value={
                      selectedRequest.requestedByPhoneNumber || "Chưa cập nhật"
                    }
                  />
                </View>

                <Text style={styles.sectionTitle}>Kết quả xử lý</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Trạng thái</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          alignSelf: "flex-start",
                          marginTop: 4,
                          backgroundColor:
                            selectedRequest.status === "Accepted"
                              ? "#DCFCE7"
                              : "#FEE2E2",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            selectedRequest.status === "Accepted"
                              ? "#166534"
                              : "#B91C1C",
                          fontWeight: "700",
                        }}
                      >
                        {getStatusLabel(selectedRequest.status)}
                      </Text>
                    </View>
                  </View>
                  {selectedRequest.managerNote && (
                    <DetailRow
                      icon={<StickyNote size={18} color="#B45309" />}
                      label="Ghi chú quản lý"
                      value={selectedRequest.managerNote}
                      isLast
                    />
                  )}
                </View>
                <View style={{ height: 30 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
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
              <View style={styles.qrContainer}>
                <QRCode value={qrContent} size={220} />
              </View>
            )}
            <Text style={styles.qrHint}>
              Đưa mã này vào máy quét tại cửa phòng Lab để tự động mở khóa.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Sub-component cho Detail Row
const DetailRow = ({
  icon,
  label,
  value,
  isLast,
}: {
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.detailItem, !isLast && styles.detailBorder]}>
    <View style={styles.detailHeaderRow}>
      {icon}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
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
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  descriptionText: { fontSize: 14, color: "#475569", flex: 1, lineHeight: 20 },
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
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginTop: 12,
  },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  inputFlex: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 15,
  },
  checkButton: {
    backgroundColor: "#0EA5E9",
    width: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedCard: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 16,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  verifiedTitle: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  verifiedInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  verifiedTextMain: { fontWeight: "700", color: "#0F172A", fontSize: 14 },
  verifiedText: { fontSize: 13, color: "#475569" },
  inputMulti: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: "#EA580C",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },
  disabledButton: { backgroundColor: "#CBD5E1" },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  emptyState: { alignItems: "center", marginTop: 80, gap: 16 },
  emptyText: { color: "#94A3B8", fontSize: 15 },

  // Detail Modal Styles
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailItem: { paddingVertical: 10 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    paddingLeft: 26,
  },

  // QR Styles
  qrContainer: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  qrHint: {
    marginTop: 24,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },
});
