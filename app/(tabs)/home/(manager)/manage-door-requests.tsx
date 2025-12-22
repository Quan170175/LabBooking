import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Clock,
  CheckCircle2,
  User,
  XCircle,
  ListFilter,
  Hash,
  FileText,
  X,
  Check,
  Phone,
  Mail,
  Eye,
  DoorOpen,
  Building2,
  Search,
  CalendarDays,
} from "lucide-react-native";

import apiClient from "../../../../utils/api";
import FilterSortBar, {
  FilterOption,
} from "../../../../components/common/FilterSortBar";

interface DoorRequestItem {
  id: string;
  bookingCode: string;
  reason: string;
  requestedByName: string;
  requestTime: string;
  status: string;
}

interface DoorRequestDetail {
  id: string;
  bookingCode: string;
  labName: string;
  reason: string;
  requestedByName: string;
  requestedByPhoneNumber: string;
  requestedByEmail: string;
  requestTime: string;
  status: string;
  managerNote?: string;
  acceptedTime?: string;
}

interface BookingLookupResponse {
  id: string;
  bookingCode: string;
  labName: string;
  date: string;
  timeSlot: string;
  requesterFullName: string;
  requesterEmail: string;
  requesterPhoneNumber: string | null;
}

const PENDING_FILTER_OPTIONS: FilterOption[] = [
  { label: "Đang chờ", value: "Pending" },
];

const HISTORY_FILTER_OPTIONS: FilterOption[] = [
  { label: "Tất cả", value: "" },
  { label: "Đã duyệt", value: "Accepted" },
  { label: "Đã từ chối", value: "Rejected" },
];

const formatTime = (isoString?: string) => {
  try {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")} - ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  } catch (e) {
    return "N/A";
  }
};

const formatDateForAPI = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "pending")
    return {
      label: "Chờ duyệt",
      color: "#F59E0B",
      bg: "#FEF3C7",
      icon: <Clock size={12} color="#F59E0B" />,
    };
  if (s === "accepted")
    return {
      label: "Đã duyệt",
      color: "#16A34A",
      bg: "#DCFCE7",
      icon: <CheckCircle2 size={12} color="#16A34A" />,
    };
  if (s === "rejected")
    return {
      label: "Đã từ chối",
      color: "#EF4444",
      bg: "#FEE2E2",
      icon: <XCircle size={12} color="#EF4444" />,
    };
  return {
    label: s || "N/A",
    color: "#64748B",
    bg: "#F1F5F9",
    icon: <Clock size={12} color="#64748B" />,
  };
};

const displayData = (
  text: string | undefined | null,
  fallback = "Không có"
) => {
  if (!text || text === "" || text.toLowerCase() === "unknown") return fallback;
  return text;
};

//main component//
export default function ManagerDoorRequestScreen() {
  // --- STATE LIST ---
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [dataList, setDataList] = useState<DoorRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- STATE FILTER ---
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<
    "Ascending" | "Descending"
  >("Descending");

  // --- STATE DETAIL MODAL ---
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<DoorRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // --- STATE REJECT MODAL ---
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- STATE LOOKUP MODAL ---
  const [lookupModalVisible, setLookupModalVisible] = useState(false);
  const [lookupCode, setLookupCode] = useState("");
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupResult, setLookupResult] =
    useState<BookingLookupResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    try {
      const isHistoryTab = activeTab === "history";
      const params: any = {
        PageNumber: 1,
        PageSize: 10,
        SortDirection: sortDirection,
        SortBy: "RequestTime",
        IsHistory: isHistoryTab,
      };

      if (filterDate) params.FilterDate = formatDateForAPI(filterDate);
      if (isHistoryTab) {
        if (filterStatus) params.FilterStatus = filterStatus;
      } else {
        params.FilterStatus = "Pending";
      }

      const response = await apiClient.get("/api/DoorRequests", { params });
      const resData = response.data;
      const items: DoorRequestItem[] =
        resData?.items ||
        resData?.data ||
        (Array.isArray(resData) ? resData : []);

      setDataList(items);
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Lỗi", "Không tải được danh sách yêu cầu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, isRefreshing, sortDirection, filterStatus, filterDate]);

  useEffect(() => {
    setFilterStatus("");
    setFilterDate(null);
    setSortDirection("Descending");
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleViewDetail = async (id: string) => {
    setDetailModalVisible(true);
    setIsLoadingDetail(true);
    setSelectedDetail(null);

    try {
      const response = await apiClient.get(`/api/DoorRequests/${id}`);
      setSelectedDetail(response.data);
    } catch (error) {
      Alert.alert("Lỗi", "Không tải được chi tiết yêu cầu.");
      setDetailModalVisible(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone || phone === "N/A")
      return Alert.alert("Lỗi", "Không có số điện thoại");
    Linking.openURL(`tel:${phone}`);
  };

  // ==========================================
  // 6. APPROVE / REJECT LOGIC
  // ==========================================
  const handleAccept = (id: string) => {
    Alert.alert("Xác nhận duyệt", "Bạn muốn mở cửa cho yêu cầu này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Duyệt ngay",
        onPress: () => processRequest(id, "Accepted", "Yêu cầu đã được duyệt."),
      },
    ]);
  };

  const handleRejectInit = (id: string) => {
    setProcessingId(id);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do từ chối.");
      return;
    }
    if (processingId) {
      processRequest(processingId, "Rejected", rejectReason);
      setRejectModalVisible(false);
    }
  };

  const processRequest = async (
    id: string,
    newStatus: "Accepted" | "Rejected",
    note: string
  ) => {
    setProcessingId(id);
    try {
      const body = {
        newStatus: newStatus,
        note: note,
      };

      await apiClient.put(`/api/DoorRequests/${id}/status`, body);

      Alert.alert(
        "Thành công",
        newStatus === "Accepted" ? "Đã duyệt yêu cầu." : "Đã từ chối yêu cầu."
      );

      if (detailModalVisible && selectedDetail?.id === id) {
        setDetailModalVisible(false);
      }
      onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra.";
      Alert.alert("Thất bại", msg);
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================
  // 7. LOOKUP API LOGIC
  // ==========================================
  const handleLookupBooking = async () => {
    if (!lookupCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã Booking hoặc ID");
      return;
    }

    setIsLoadingLookup(true);
    setLookupResult(null);

    try {
      const response = await apiClient.get(
        `/api/Bookings/lookup/${lookupCode}`
      );
      setLookupResult(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert(
          "Không tìm thấy",
          `Booking với mã: "${lookupCode}" không tồn tại.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tra cứu.");
      }
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // ==========================================
  // 8. RENDER ITEM
  // ==========================================
  const renderItem = ({ item }: { item: DoorRequestItem }) => {
    const isPending = activeTab === "pending";
    const statusConf = getStatusConfig(item.status);
    const isProcessing = processingId === item.id;

    return (
      <View style={[styles.card, !isPending && { opacity: 0.95 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <User size={18} color={isPending ? "#EA580C" : "#64748B"} />
            <Text
              style={
                isPending ? styles.userNameHeader : styles.userNameHeaderHistory
              }
            >
              {displayData(item.requestedByName, "Người dùng ẩn")}
            </Text>
          </View>
          {isPending ? (
            <View style={styles.timeBadge}>
              <Clock size={11} color="#B45309" />
              <Text style={styles.timeText}>
                {formatTime(item.requestTime)}
              </Text>
            </View>
          ) : (
            <View
              style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}
            >
              {statusConf.icon}
              <Text style={[styles.statusText, { color: statusConf.color }]}>
                {statusConf.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Hash size={14} color="#64748B" />
            <Text style={styles.infoText}>
              Mã:{" "}
              <Text style={styles.boldText}>
                {displayData(item.bookingCode)}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <FileText size={14} color="#64748B" />
            <Text style={styles.reasonText} numberOfLines={1}>
              Lý do: "{displayData(item.reason)}"
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewDetailLink}
            onPress={() => handleViewDetail(item.id)}
          >
            <Text style={styles.viewDetailText}>Xem chi tiết</Text>
            <Eye size={14} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {isPending && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnReject]}
              onPress={() => handleRejectInit(item.id)}
              disabled={isProcessing}
            >
              <X size={18} color="#EF4444" />
              <Text style={styles.textReject}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.btnAccept]}
              onPress={() => handleAccept(item.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.textAccept}>Duyệt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <DoorOpen size={24} color="#EA580C" />
          <Text style={styles.headerTitle}>Quản Lý Cửa</Text>
        </View>

        <TouchableOpacity
          style={styles.searchHeaderBtn}
          onPress={() => setLookupModalVisible(true)}
        >
          <Search size={22} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {/* FILTER BAR */}
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

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "pending" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("pending")}
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
          onPress={() => setActiveTab("history")}
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

      {/* LIST CONTENT */}
      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={{ marginTop: 10, color: "#64748B" }}>
            Đang tải dữ liệu...
          </Text>
        </View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
              <ListFilter size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {activeTab === "pending"
                  ? "Không có yêu cầu nào"
                  : "Chưa có lịch sử"}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        transparent
        visible={rejectModalVisible}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.rejectModalContent}>
            <View style={styles.rejectHeader}>
              <Text style={styles.rejectTitle}>Từ chối yêu cầu</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.rejectLabel}>
              Vui lòng nhập lý do từ chối để thông báo cho sinh viên:
            </Text>

            <TextInput
              style={styles.rejectInput}
              placeholder="VD: Sai thông tin, Chưa đến giờ..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={styles.rejectBtnCancel}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.rejectBtnTextCancel}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtnConfirm}
                onPress={confirmReject}
              >
                <Text style={styles.rejectBtnTextConfirm}>
                  Xác nhận từ chối
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={detailModalVisible}
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
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#EA580C" />
                <Text style={{ marginTop: 12, color: "#64748B" }}>
                  Đang tải thông tin chi tiết...
                </Text>
              </View>
            ) : selectedDetail ? (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusConfig(selectedDetail.status)
                          .bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusConfig(selectedDetail.status).color },
                      ]}
                    >
                      {getStatusConfig(selectedDetail.status).label}
                    </Text>
                  </View>
                </View>

                {(selectedDetail.status === "Rejected" ||
                  selectedDetail.status === "Accepted") && (
                  <View
                    style={[
                      styles.noteBox,
                      selectedDetail.status === "Rejected"
                        ? styles.noteBoxReject
                        : styles.noteBoxAccept,
                    ]}
                  >
                    <Text
                      style={[
                        styles.noteTitle,
                        {
                          color:
                            selectedDetail.status === "Rejected"
                              ? "#B91C1C"
                              : "#15803D",
                        },
                      ]}
                    >
                      {selectedDetail.status === "Rejected"
                        ? "Lý do từ chối:"
                        : "Ghi chú quản lý:"}
                    </Text>
                    <Text style={styles.noteContent}>
                      {selectedDetail.managerNote || "Không có ghi chú"}
                    </Text>
                    <Text style={styles.noteTime}>
                      {formatTime(selectedDetail.acceptedTime)}
                    </Text>
                  </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Thông tin người gửi</Text>
                <DetailItem
                  label="Họ tên"
                  value={displayData(selectedDetail.requestedByName)}
                  icon={<User size={16} color="#64748B" />}
                />
                <TouchableOpacity
                  onPress={() =>
                    handleCall(selectedDetail.requestedByPhoneNumber)
                  }
                >
                  <DetailItem
                    label="Số điện thoại"
                    value={displayData(selectedDetail.requestedByPhoneNumber)}
                    icon={<Phone size={16} color="#64748B" />}
                    isLink
                  />
                </TouchableOpacity>
                <DetailItem
                  label="Email"
                  value={displayData(selectedDetail.requestedByEmail)}
                  icon={<Mail size={16} color="#64748B" />}
                />

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>
                  Thông tin phòng & Yêu cầu
                </Text>
                <DetailItem
                  label="Phòng Lab"
                  value={displayData(selectedDetail.labName)}
                  icon={<Building2 size={16} color="#64748B" />}
                />
                <DetailItem
                  label="Mã đặt phòng"
                  value={displayData(selectedDetail.bookingCode)}
                  icon={<Hash size={16} color="#64748B" />}
                />
                <DetailItem
                  label="Thời gian gửi"
                  value={formatTime(selectedDetail.requestTime)}
                  icon={<Clock size={16} color="#64748B" />}
                />

                <Text style={[styles.detailLabel, { marginTop: 10 }]}>
                  Lý do mở cửa:
                </Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonFullText}>
                    {displayData(selectedDetail.reason)}
                  </Text>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            ) : (
              <View style={styles.center}>
                <Text style={{ color: "#EF4444" }}>
                  Không tìm thấy dữ liệu.
                </Text>
              </View>
            )}

            {activeTab === "pending" && selectedDetail && !isLoadingDetail && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnReject]}
                  onPress={() => handleRejectInit(selectedDetail.id)}
                >
                  <Text style={styles.textReject}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnAccept]}
                  onPress={() => handleAccept(selectedDetail.id)}
                >
                  <Text style={styles.textAccept}>Duyệt ngay</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={lookupModalVisible}
        animationType="fade"
        onRequestClose={() => setLookupModalVisible(false)}
      >
        <KeyboardAvoidingView
          // 👇 CẬP NHẬT QUAN TRỌNG: Để undefined cho Android để tránh xung đột layout
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Header Lookup */}
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Search size={24} color="#EA580C" />
                <Text style={styles.modalTitle}>Tra Cứu Booking</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setLookupModalVisible(false);
                  setLookupCode("");
                  setLookupResult(null);
                }}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Content ScrollView */}
            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              // 👇 Giữ flexGrow: 0 để modal không bị giãn
              style={{ flexGrow: 0 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Input Area */}
              <Text style={styles.label}>Nhập mã booking hoặc ID:</Text>
              <View style={styles.lookupInputContainer}>
                <TextInput
                  style={styles.lookupInput}
                  placeholder="Ví dụ: 3fa85f64..."
                  value={lookupCode}
                  onChangeText={setLookupCode}
                  autoCapitalize="none"
                  // 👇 Thêm returnKeyType để bàn phím hiện nút "Done" hoặc "Search"
                  returnKeyType="search"
                  onSubmitEditing={handleLookupBooking}
                />
                <TouchableOpacity
                  style={styles.lookupBtn}
                  onPress={handleLookupBooking}
                  disabled={isLoadingLookup}
                >
                  {isLoadingLookup ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Kiểm tra
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Result Area */}
              {lookupResult && (
                <View style={styles.lookupResultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>
                      ✅ Tìm thấy thông tin
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <DetailItem
                    label="Phòng"
                    value={lookupResult.labName}
                    icon={<Building2 size={16} color="#64748B" />}
                  />
                  <DetailItem
                    label="Người đặt"
                    value={lookupResult.requesterFullName}
                    icon={<User size={16} color="#64748B" />}
                  />
                  <DetailItem
                    label="Email"
                    value={displayData(lookupResult.requesterEmail)}
                    icon={<Mail size={16} color="#64748B" />}
                  />
                  <DetailItem
                    label="Số điện thoại"
                    value={displayData(lookupResult.requesterPhoneNumber)}
                    icon={<Phone size={16} color="#64748B" />}
                  />

                  <DetailItem
                    label="Thời gian"
                    value={`${lookupResult.date}\n(${lookupResult.timeSlot})`}
                    icon={<CalendarDays size={16} color="#64748B" />}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const DetailItem = ({ label, value, icon, isLink }: any) => (
  <View style={styles.detailItemRow}>
    <View style={{ marginTop: 2 }}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailItemLabel}>{label}</Text>
      <Text
        style={[
          styles.detailItemValue,
          isLink && { color: "#2563EB", textDecorationLine: "underline" },
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

// ==========================================
// 8. STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 16,
    paddingTop: 10,
    backgroundColor: "#FFF7ED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },

  searchHeaderBtn: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#EA580C", fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
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
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  userNameHeader: { fontSize: 15, fontWeight: "700", color: "#EA580C" },
  userNameHeaderHistory: { fontSize: 15, fontWeight: "600", color: "#334155" },

  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: { fontSize: 11, fontWeight: "600", color: "#B45309" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  cardBody: { padding: 12, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { color: "#334155", fontSize: 14, flex: 1 },
  boldText: { fontWeight: "600", color: "#0F172A" },
  reasonText: { color: "#475569", fontSize: 14, fontStyle: "italic", flex: 1 },
  viewDetailLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  viewDetailText: { fontSize: 13, color: "#3B82F6", fontWeight: "500" },

  cardFooter: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  btnReject: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  btnAccept: { backgroundColor: "#EA580C" },
  textReject: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  textAccept: { color: "white", fontWeight: "600", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: "85%",
    width: "100%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  modalBody: { padding: 16 },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: { fontSize: 14, fontWeight: "600", color: "#475569" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },
  detailItemRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  detailItemLabel: { fontSize: 12, color: "#64748B" },
  detailItemValue: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  reasonBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reasonFullText: {
    fontSize: 14,
    color: "#334155",
    fontStyle: "italic",
    lineHeight: 20,
  },

  rejectModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
  },
  rejectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rejectTitle: { fontSize: 18, fontWeight: "bold", color: "#B91C1C" },
  rejectLabel: { fontSize: 14, color: "#334155", marginBottom: 12 },
  rejectInput: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
  },
  rejectActions: { flexDirection: "row", gap: 12 },
  rejectBtnCancel: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  rejectBtnConfirm: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#DC2626",
  },
  rejectBtnTextCancel: { color: "#64748B", fontWeight: "600" },
  rejectBtnTextConfirm: { color: "#FFF", fontWeight: "600" },

  noteBox: { padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
  noteBoxReject: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  noteBoxAccept: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  noteTitle: { fontWeight: "700", fontSize: 13, marginBottom: 4 },
  noteContent: { fontSize: 14, color: "#334155" },
  noteTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 6,
    fontStyle: "italic",
    textAlign: "right",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  lookupInputContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  lookupInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
  },
  lookupBtn: {
    backgroundColor: "#EA580C",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  lookupResultCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#15803D",
  },
});
