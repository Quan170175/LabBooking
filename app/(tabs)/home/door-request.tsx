import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Hash,
  ListFilter,
  Search,
  Eye,
  Building2,
  QrCode,
  User,
  Phone,
  Mail,
  CalendarDays,
  Send,
  Briefcase,
} from "lucide-react-native";

import QRCode from "react-native-qrcode-svg";
import apiClient from "../../../utils/api";
import FilterSortBar, {
  FilterOption,
} from "../../../components/common/FilterSortBar";

// --- INTERFACES ---
interface Slot {
  slotId: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
}

interface DateSlot {
  date: string;
  slots: Slot[];
}

interface VerifyResultData {
  id: string;
  bookingCode: string;
  labName: string;
  dateSlots: DateSlot[];
}

interface DoorRequestItem {
  id: string;
  bookingCode: string;
  reason: string;
  requestTime: string;
  status: string;
}

interface DoorRequestDetail {
  id: string;
  bookingCode: string;
  requestDate: string;
  slotId: string;
  slotLabel: string;
  slotStartTime: string;
  slotEndTime: string;
  reason: string;
  status: string;
  requestTime: string;
  acceptedTime: string | null;
  managerNote: string | null;
  labName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactRole: string;
}

// Interface cho API QR mới dựa trên response
interface QrCodeData {
  requestId: string;
  labRoomName: string;
  userFullName: string;
  validTimeSlot: string;
  startTime: string;
  endTime: string;
}

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
  if (s === "accepted" || s === "approved") return "Đã duyệt";
  if (s === "rejected") return "Từ chối";
  return "Chờ duyệt";
};

// Logic màu sắc: Xanh (Duyệt), Đỏ (Từ chối), Cam (Chờ)
const getStatusColorConfig = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "accepted" || s === "approved") {
    return { bg: "#DCFCE7", border: "#86EFAC", text: "#166534" }; // XANH LÁ
  }
  if (s === "rejected") {
    return { bg: "#FEE2E2", border: "#FECACA", text: "#B91C1C" }; // ĐỎ
  }
  return { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" }; // CAM
};

const formatDateForAPI = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getErrorMessage = (error: any) => {
  const data = error?.response?.data || error;
  if (!data) return "Lỗi kết nối.";
  if (data.errors && typeof data.errors === "object") {
    const errorKeys = Object.keys(data.errors);
    if (errorKeys.length > 0) return data.errors[errorKeys[0]][0];
  }
  return data.message || data.detail || "Có lỗi xảy ra.";
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function DoorRequestScreen() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [displayList, setDisplayList] = useState<DoorRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<
    "Ascending" | "Descending"
  >("Descending");

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [reason, setReason] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResultData | null>(
    null
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<DoorRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // State QR cập nhật
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState<QrCodeData | null>(null); // Lưu object data từ API
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Fetch Data
  const fetchDoorRequests = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    const params: any = {
      PageNumber: 1,
      PageSize: 50,
      SortBy: "RequestTime",
      SortDirection: sortDirection,
      IsHistory: activeTab === "history",
    };
    if (filterDate) params.FilterDate = formatDateForAPI(filterDate);
    if (activeTab === "history") {
      if (filterStatus) params.FilterStatus = filterStatus;
    } else {
      params.FilterStatus = "Pending";
    }

    try {
      const response = await apiClient.get("/api/DoorRequests", { params });
      const resData = response.data?.items || response.data?.data?.items || [];
      setDisplayList(resData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, activeTab, filterDate, filterStatus, sortDirection]);

  useEffect(() => {
    fetchDoorRequests();
  }, [fetchDoorRequests]);

  const handleVerifyCode = async () => {
    if (!bookingCode.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập Mã đặt phòng.");
    setIsVerifying(true);
    try {
      const response = await apiClient.get(
        `/api/Bookings/lookup/${bookingCode.trim()}`
      );
      const apiData = response.data?.data || response.data;
      if (apiData && apiData.dateSlots?.length > 0) setVerifyResult(apiData);
    } catch (error) {
      Alert.alert("Lỗi", getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRequest = async () => {
    if (
      !bookingCode.trim() ||
      !reason.trim() ||
      !selectedDateStr ||
      !selectedSlot
    )
      return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/DoorRequests", {
        bookingCode: bookingCode.trim(),
        requestDate: selectedDateStr.split("T")[0],
        slotId: selectedSlot.slotId,
        reason: reason.trim(),
      });
      setModalVisible(false);
      resetForm();
      fetchDoorRequests();
    } catch (error) {
      Alert.alert("Lỗi", getErrorMessage(error));
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
          } catch (e) {}
        },
      },
    ]);
  };

  const resetForm = () => {
    setBookingCode("");
    setReason("");
    setVerifyResult(null);
    setSelectedDateStr(null);
    setSelectedSlot(null);
  };

  const availableSlots = useMemo(() => {
    if (!selectedDateStr || !verifyResult) return [];
    return (
      verifyResult.dateSlots.find((d) => d.date === selectedDateStr)?.slots ||
      []
    );
  }, [selectedDateStr, verifyResult]);

  const handleViewDetail = async (id: string) => {
    setDetailModalVisible(true);
    setIsLoadingDetail(true);
    try {
      const response = await apiClient.get(`/api/DoorRequests/${id}`);
      setSelectedRequest(response.data?.data || response.data);
    } catch (error) {
      Alert.alert("Lỗi", "Không tải được thông tin chi tiết.");
      setDetailModalVisible(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // --- LOGIC MỚI CHO API QR ---
  const handleShowQrCode = async (id: string) => {
    setQrModalVisible(true);
    setIsLoadingQr(true);
    setQrData(null); // Reset cũ
    try {
      const response = await apiClient.get(`/api/DoorRequests/${id}/qr-code`);
      // Cấu trúc response: { data: { requestId, labRoomName... } }
      const apiData = response.data;
      if (apiData && apiData.data) {
        setQrData(apiData.data);
      } else {
        // Fallback nếu API trả thẳng object không bọc trong data
        setQrData(apiData);
      }
    } catch (error) {
      // Alert.alert("Lỗi", getErrorMessage(error));
      setQrModalVisible(false);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const renderItem = ({ item }: { item: DoorRequestItem }) => {
    const s = item.status?.toLowerCase();
    const isAccepted = s === "accepted" || s === "approved";
    const statusColor = getStatusColorConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Hash size={18} color="#EA580C" />
            <Text style={styles.cardTitle}>{item.bookingCode}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {activeTab === "history" && isAccepted && (
              <TouchableOpacity onPress={() => handleShowQrCode(item.id)}>
                <QrCode size={20} color="#166534" />
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
        <Text style={styles.descriptionText} numberOfLines={1}>
          {item.reason}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.requestTime).toLocaleString("vi-VN")}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Tabs */}
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
            onPress={() => setActiveTab(tab as any)}
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

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
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
          <View style={styles.center}>
            <ListFilter size={40} color="#CBD5E1" />
            <Text style={{ color: "#94A3B8", marginTop: 10 }}>
              Không có dữ liệu
            </Text>
          </View>
        }
      />

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu cầu mở cửa mới</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Mã đặt phòng:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Nhập mã đặt phòng..."
                  value={bookingCode}
                  onChangeText={setBookingCode}
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
                <View style={styles.selectionArea}>
                  <View style={styles.labInfoBanner}>
                    <Building2 size={16} color="#EA580C" />
                    <Text style={styles.labNameText}>
                      {verifyResult.labName}
                    </Text>
                  </View>
                  <Text style={styles.subLabel}>1. Chọn ngày sử dụng:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                  >
                    {verifyResult.dateSlots.map((ds) => (
                      <TouchableOpacity
                        key={ds.date}
                        style={[
                          styles.dateChip,
                          selectedDateStr === ds.date && styles.dateChipActive,
                        ]}
                        onPress={() => {
                          setSelectedDateStr(ds.date);
                          setSelectedSlot(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.dateChipText,
                            selectedDateStr === ds.date &&
                              styles.dateChipTextActive,
                          ]}
                        >
                          {new Date(ds.date).toLocaleDateString("vi-VN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedDateStr && (
                    <View style={styles.slotGrid}>
                      {availableSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot.slotId}
                          style={[
                            styles.slotCard,
                            selectedSlot?.slotId === slot.slotId &&
                              styles.slotCardActive,
                          ]}
                          onPress={() => setSelectedSlot(slot)}
                        >
                          <Text
                            style={[
                              styles.slotLabelText,
                              selectedSlot?.slotId === slot.slotId && {
                                color: "#FFF",
                              },
                            ]}
                          >
                            {slot.slotLabel}
                          </Text>
                          <Text
                            style={[
                              styles.slotTimeText,
                              selectedSlot?.slotId === slot.slotId && {
                                color: "#E0F2FE",
                              },
                            ]}
                          >
                            {slot.startTime.substring(0, 5)} -{" "}
                            {slot.endTime.substring(0, 5)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.label}>Lý do cần mở cửa:</Text>
              <TextInput
                style={styles.inputMulti}
                placeholder="Ví dụ: Em đến sớm..."
                value={reason}
                onChangeText={setReason}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedSlot || !reason) && styles.disabledButton,
                ]}
                onPress={handleCreateRequest}
                disabled={isSubmitting || !selectedSlot || !reason}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isLoadingDetail ? (
              <View style={{ padding: 60 }}>
                <ActivityIndicator size="large" color="#EA580C" />
              </View>
            ) : selectedRequest ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
              >
                <View style={styles.detailDivider} />

                {/* --- PHẦN THÔNG TIN NGƯỜI DUYỆT (LUÔN HIỆN) --- */}
                <Text style={styles.detailSectionHeader}>
                  THÔNG TIN NGƯỜI DUYỆT
                </Text>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <User size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Họ tên</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.contactName || "N/A"}
                    </Text>
                  </View>
                </View>

                {selectedRequest.contactRole && (
                  <View style={styles.detailInfoItem}>
                    <View style={styles.iconContainer}>
                      <Briefcase size={20} color="#64748B" />
                    </View>
                    <View>
                      <Text style={styles.detailInfoLabel}>Vai trò</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedRequest.contactRole}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Phone size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Số điện thoại</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.contactPhoneNumber || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Mail size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Email</Text>
                    <Text
                      style={[
                        styles.detailInfoValue,
                        { fontWeight: "400", fontSize: 14 },
                      ]}
                    >
                      {selectedRequest.contactEmail || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                {/* --- CÁC THÔNG TIN KHÁC --- */}
                <Text style={styles.detailSectionHeader}>
                  THÔNG TIN PHÒNG & YÊU CẦU
                </Text>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Building2 size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Phòng Lab</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.labName || "Phòng Lab"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Hash size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Mã đặt phòng</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.bookingCode}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Send size={20} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>
                      Thời gian gửi yêu cầu
                    </Text>
                    <Text style={styles.detailInfoValue}>
                      {new Date(selectedRequest.requestTime).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit" }
                      )}{" "}
                      -{" "}
                      {new Date(selectedRequest.requestTime).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <CalendarDays size={20} color="#EA580C" />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.detailInfoLabel,
                        { color: "#EA580C", fontWeight: "bold" },
                      ]}
                    >
                      Ngày muốn mở cửa
                    </Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.requestDate
                        ? new Date(
                            selectedRequest.requestDate
                          ).toLocaleDateString("vi-VN")
                        : "N/A"}{" "}
                      ({selectedRequest.slotLabel || "Slot"})
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoItem}>
                  <View style={styles.iconContainer}>
                    <Clock size={20} color="#EA580C" />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.detailInfoLabel,
                        { color: "#EA580C", fontWeight: "bold" },
                      ]}
                    >
                      Ca trực/Thời gian mở
                    </Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedRequest.slotStartTime?.substring(0, 5) ||
                        "00:00"}{" "}
                      -{" "}
                      {selectedRequest.slotEndTime?.substring(0, 5) || "00:00"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.detailReasonHeader, { marginTop: 15 }]}>
                  Lý do mở cửa:
                </Text>
                <View style={styles.detailReasonBox}>
                  <Text style={styles.detailReasonText}>
                    {selectedRequest.reason}
                  </Text>
                </View>

                {/* MANAGER NOTE: MÀU SẮC ĐỘNG (XANH/ĐỎ) */}
                {selectedRequest.managerNote && (
                  <View
                    style={[
                      styles.detailReasonBox,
                      {
                        backgroundColor: getStatusColorConfig(
                          selectedRequest.status
                        ).bg,
                        borderColor: getStatusColorConfig(
                          selectedRequest.status
                        ).border,
                        marginTop: 15,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: getStatusColorConfig(selectedRequest.status)
                          .text,
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      Ghi chú quản lý:
                    </Text>
                    <Text
                      style={{
                        color: getStatusColorConfig(selectedRequest.status)
                          .text,
                      }}
                    >
                      {selectedRequest.managerNote}
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 25, alignItems: "flex-start" }}>
                  <Text
                    style={[styles.detailSectionHeader, { marginBottom: 10 }]}
                  >
                    TRẠNG THÁI HIỆN TẠI
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColorConfig(
                          selectedRequest.status
                        ).bg,
                        paddingHorizontal: 15,
                        paddingVertical: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: getStatusColorConfig(selectedRequest.status)
                            .text,
                          fontSize: 14,
                        },
                      ]}
                    >
                      {getStatusLabel(selectedRequest.status)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* QR MODAL - Cập nhật để hiển thị thông tin kèm mã QR */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
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
              }}
            >
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <X size={26} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text
              style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}
            >
              Mã QR Mở Cửa
            </Text>

            {isLoadingQr ? (
              <ActivityIndicator size="large" color="#EA580C" />
            ) : qrData ? (
              <>
                <View
                  style={{
                    borderWidth: 4,
                    borderColor: "#166534",
                    borderRadius: 12,
                    padding: 8,
                  }}
                >
                  <QRCode value={JSON.stringify(qrData)} size={220} />
                </View>

                {/* Hiển thị thêm thông tin bên dưới mã QR */}
                <View
                  style={{ marginTop: 24, alignItems: "center", width: "100%" }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#EA580C",
                      marginBottom: 6,
                    }}
                  >
                    {qrData.labRoomName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#334155",
                    }}
                  >
                    {qrData.validTimeSlot}
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}
                  >
                    {qrData.userFullName}
                  </Text>
                </View>
              </>
            ) : (
              <Text>Không có dữ liệu QR</Text>
            )}
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
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  descriptionText: { fontSize: 14, color: "#475569", marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  dateText: { fontSize: 12, color: "#94A3B8" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // --- Modal General ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginTop: 15,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 15,
    marginBottom: 10,
  },
  inputRow: { flexDirection: "row", gap: 10 },
  inputFlex: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkButton: {
    backgroundColor: "#0EA5E9",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionArea: { marginTop: 10 },
  labInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  labNameText: { fontWeight: "700", color: "#C2410C" },
  chipScroll: { flexDirection: "row", marginBottom: 15 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateChipActive: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  dateChipText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  dateChipTextActive: { color: "#FFF" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotCard: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  slotCardActive: { backgroundColor: "#0EA5E9", borderColor: "#0EA5E9" },
  slotLabelText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  slotTimeText: { fontSize: 12, color: "#64748B" },
  inputMulti: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#EA580C",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },
  disabledButton: { backgroundColor: "#CBD5E1" },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

  // --- RE-DESIGNED DETAIL MODAL STYLES ---
  detailModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingBottom: 20,
    maxHeight: "94%",
    width: "100%",
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  detailModalTitle: { fontSize: 22, fontWeight: "bold", color: "#1E293B" },
  detailDivider: {
    height: 1.5,
    backgroundColor: "#F8FAFC",
    marginVertical: 10,
  },
  detailSectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 15,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  detailInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 18,
  },
  iconContainer: { width: 28, alignItems: "center" },
  detailInfoLabel: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  detailInfoValue: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  detailReasonHeader: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  detailReasonBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailReasonText: {
    fontSize: 15,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 22,
  },
});
