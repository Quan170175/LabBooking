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
  User,
  Mail,
  Phone,
  Building2,
  QrCode,
  CalendarDays,
} from "lucide-react-native";

import QRCode from "react-native-qrcode-svg";
import apiClient from "../../../../utils/api";
import FilterSortBar, {
  FilterOption,
} from "../../../../components/common/FilterSortBar";

// --- INTERFACES ---
interface DoorRequestItem {
  id: string;
  bookingCode: string;
  reason: string;
  requestTime: string;
  status: string;
}

// [UPDATED] Interface khớp với JSON bạn cung cấp
interface VerifyResultData {
  isValid: boolean;
  message: string; // "Hợp lệ. Mời vào."
  studentName: string; // "Tran Ngoc Quan"
  labName: string; // "Phòng Lab mới"
  timeSlot: string; // "23/12/2025 (12:30 - 14:45)"
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
const SIGNATURE_KEY = "LAB_ACCESS_SECURE_TOKEN";

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
  const errorData = error.response?.data;
  // Xử lý logic lỗi dựa trên response mới nếu cần
  if (errorData?.message) return errorData.message;

  const rawMessage = typeof errorData === "string" ? errorData : "";
  if (rawMessage.includes("doesn't exist")) {
    return "Mã đặt phòng không tồn tại.";
  }
  return "Có lỗi xảy ra, vui lòng thử lại.";
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
      IsHistory: true,
    };
    if (filterDate) params.FilterDate = formatDateForAPI(filterDate);
    if (isHistoryTab) {
      if (filterStatus) params.FilterStatus = filterStatus;
    } else {
      params.FilterStatus = "Pending";
    }

    try {
      const response = await apiClient.get("/api/DoorRequests", { params });
      const resData = response.data;
      let items: DoorRequestItem[] =
        resData?.items ||
        resData?.data ||
        (Array.isArray(resData) ? resData : []);
      if (isHistoryTab) {
        items = items.filter((item) => item.status !== "Pending");
      }
      setDisplayList(items);
    } catch (error: any) {
      console.error("GET Error:", error);
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

  // --- [UPDATED] Hàm Verify xử lý cấu trúc JSON mới ---
  const handleVerifyCode = async () => {
    if (!bookingCode.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập Mã đặt phòng.");

    setIsVerifying(true);
    setVerifyResult(null); // Reset kết quả cũ

    try {
      const response = await apiClient.get(
        `/api/Bookings/lookup/${bookingCode.trim()}`
      );

      // Axios trả về response, body nằm trong response.data
      // Cấu trúc body của bạn: { statusCode: 200, data: { ... } }
      const body = response.data;

      if (body.statusCode === 200 && body.data) {
        setVerifyResult(body.data);
      } else {
        Alert.alert("Thông báo", body.message || "Không tìm thấy thông tin.");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!bookingCode.trim() || !reason.trim())
      return Alert.alert("Thiếu thông tin", "Nhập đủ mã và lý do.");

    // Nếu đã verify mà isValid = false thì chặn (tuỳ logic của bạn)
    if (verifyResult && !verifyResult.isValid) {
      return Alert.alert(
        "Lỗi",
        "Mã đặt phòng không hợp lệ, không thể gửi yêu cầu."
      );
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/DoorRequests", {
        bookingCode: bookingCode.trim(),
        reason: reason.trim(),
      });
      Alert.alert("Thành công", "Đã gửi yêu cầu.");
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
      setSelectedRequest(response.data);
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
      const securePayload = {
        requestId: id,
        signature: SIGNATURE_KEY,
        createdAt: new Date().toISOString(),
      };
      setQrContent(JSON.stringify(securePayload));
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

      <View style={{ zIndex: 10 }}>
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
      </View>

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

      {/* CREATE MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
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
                  placeholder="Nhập mã..."
                  value={bookingCode}
                  onChangeText={(t) => {
                    setBookingCode(t);
                    setVerifyResult(null); // Reset khi gõ
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

              {/* ----- PHẦN HIỂN THỊ KẾT QUẢ KIỂM TRA MỚI ----- */}
              {verifyResult && (
                <View
                  style={[
                    styles.verifiedCard,
                    // Đổi màu nền nếu không hợp lệ
                    !verifyResult.isValid && {
                      backgroundColor: "#FEF2F2",
                      borderColor: "#FCA5A5",
                    },
                  ]}
                >
                  <View style={styles.verifiedHeader}>
                    {verifyResult.isValid ? (
                      <CheckCircle2 size={16} color="#166534" />
                    ) : (
                      <XCircle size={16} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.verifiedTitle,
                        !verifyResult.isValid && { color: "#DC2626" },
                      ]}
                    >
                      {verifyResult.message}{" "}
                      {/* Hiển thị: "Hợp lệ. Mời vào." */}
                    </Text>
                  </View>

                  {/* Nếu hợp lệ mới hiện chi tiết */}
                  {verifyResult.isValid && (
                    <>
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
                          {verifyResult.timeSlot}
                        </Text>
                      </View>

                      {/* Thông tin người yêu cầu (Mapping studentName -> Người yêu cầu) */}
                      <View style={styles.requesterInfoBox}>
                        <Text style={styles.requesterLabel}>
                          Người yêu cầu:
                        </Text>
                        <Text style={styles.requesterName}>
                          {verifyResult.studentName}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
              {/* ------------------------------------------ */}

              <Text style={styles.label}>Lý do:</Text>
              <TextInput
                style={styles.inputMulti}
                placeholder="Lý do..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitting || (verifyResult && !verifyResult.isValid)) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateRequest}
                disabled={
                  isSubmitting ||
                  (verifyResult !== null && !verifyResult.isValid)
                }
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

      {/* DETAIL MODAL */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isLoadingDetail ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#EA580C" />
                <Text style={{ marginTop: 10, color: "#64748B" }}>
                  Đang tải thông tin...
                </Text>
              </View>
            ) : selectedRequest ? (
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Người yêu cầu</Text>
                  <View style={styles.detailRow}>
                    <User size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {selectedRequest.requestedByName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Mail size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {selectedRequest.requestedByEmail}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {selectedRequest.requestedByPhoneNumber}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                  <View style={styles.detailRow}>
                    <Building2 size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {selectedRequest.labName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Hash size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      Booking: {selectedRequest.bookingCode}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Nội dung yêu cầu</Text>
                  <View style={styles.bgGrayBox}>
                    <Text style={styles.detailLabel}>Lý do:</Text>
                    <Text style={styles.reasonText}>
                      {selectedRequest.reason}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.detailLabel}>Thời gian tạo:</Text>
                    <Text style={styles.detailText}>
                      {new Date(selectedRequest.requestTime).toLocaleString(
                        "vi-VN"
                      )}
                    </Text>

                    <Text style={[styles.detailLabel, { marginTop: 8 }]}>
                      Trạng thái:
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color:
                          selectedRequest.status === "Accepted"
                            ? "green"
                            : selectedRequest.status === "Rejected"
                            ? "red"
                            : "#B45309",
                      }}
                    >
                      {getStatusLabel(selectedRequest.status)}
                    </Text>
                  </View>
                </View>

                {selectedRequest.status !== "Pending" && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Phản hồi quản lý</Text>
                    <View
                      style={[styles.bgGrayBox, { backgroundColor: "#F0F9FF" }]}
                    >
                      {selectedRequest.acceptedTime && (
                        <>
                          <Text style={styles.detailLabel}>
                            Thời gian xử lý:
                          </Text>
                          <Text style={styles.detailText}>
                            {new Date(
                              selectedRequest.acceptedTime
                            ).toLocaleString("vi-VN")}
                          </Text>
                        </>
                      )}
                      {selectedRequest.managerNote && (
                        <>
                          <Text style={[styles.detailLabel, { marginTop: 8 }]}>
                            Ghi chú:
                          </Text>
                          <Text style={styles.detailText}>
                            {selectedRequest.managerNote}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            ) : (
              <View style={styles.center}>
                <Text style={{ color: "#EF4444" }}>Không tìm thấy dữ liệu</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* QR MODAL */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { alignItems: "center", paddingTop: 30, paddingBottom: 40 },
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
              <TouchableOpacity
                onPress={() => setQrModalVisible(false)}
                style={{ padding: 4 }}
              >
                <X size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 30,
                color: "#0F172A",
              }}
            >
              Mã QR Ra Vào
            </Text>

            {isLoadingQr ? (
              <View style={{ height: 200, justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#EA580C" />
              </View>
            ) : qrContent ? (
              <View
                style={{
                  padding: 20,
                  backgroundColor: "white",
                  borderRadius: 16,
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QRCode
                  value={qrContent}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              </View>
            ) : (
              <View style={{ height: 200, justifyContent: "center" }}>
                <Text style={{ color: "#EF4444" }}>Không có dữ liệu QR</Text>
              </View>
            )}

            <Text
              style={{
                marginTop: 24,
                textAlign: "center",
                color: "#64748B",
                maxWidth: "80%",
              }}
            >
              Vui lòng đưa mã này vào thiết bị quét để mở cửa.
              {"\n"}(Mã đã được mã hóa bảo mật)
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
    backgroundColor: "#FFF7ED",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  addButton: {
    backgroundColor: "#EA580C",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginTop: 4,
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
  listContent: { padding: 16, paddingTop: 12 },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  deleteButton: { padding: 4 },
  iconButton: { padding: 4 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  descriptionText: { fontSize: 14, color: "#334155", flex: 1, lineHeight: 20 },
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
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
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
    fontSize: 16,
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
    marginBottom: 8,
  },
  verifiedTitle: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  verifiedText: { fontSize: 13, color: "#334155" },
  // Styles mới cho phần người yêu cầu
  requesterInfoBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(22, 101, 52, 0.1)",
  },
  requesterLabel: {
    fontSize: 12,
    color: "#15803d",
    marginBottom: 2,
    fontWeight: "600",
  },
  requesterName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
  requesterEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  inputMulti: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 80,
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
  disabledButton: { opacity: 0.6, backgroundColor: "#94A3B8" },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  detailSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#EA580C",
    paddingLeft: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  detailText: { fontSize: 14, color: "#334155", flex: 1 },
  bgGrayBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailLabel: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  reasonText: { fontSize: 14, color: "#0F172A", fontStyle: "italic" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 },
});
