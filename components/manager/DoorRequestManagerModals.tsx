import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Search,
  User,
  Phone,
  Mail,
  Building2,
  Hash,
  Clock,
  CalendarDays,
  Check,
} from "lucide-react-native";

// --- Helper: Format Date dd/MM/yyyy ---
const formatDateDisplay = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return dateString;
  }
};

// --- Interfaces ---

interface DoorRequestManagerModalsProps {
  styles: any;

  // --- Reject Modal Props ---
  rejectModalVisible: boolean;
  setRejectModalVisible: (visible: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  confirmReject: () => void;

  // --- Accept Modal Props ---
  acceptModalVisible: boolean;
  setAcceptModalVisible: (visible: boolean) => void;
  acceptNote: string;
  setAcceptNote: (note: string) => void;
  confirmAccept: () => void;

  // --- Detail Modal Props ---
  detailModalVisible: boolean;
  setDetailModalVisible: (visible: boolean) => void;
  isLoadingDetail: boolean;
  selectedDetail: any;
  activeTab: string;
  handleRejectInit: (id: string | number) => void;
  handleAccept: (id: string | number) => void;

  // --- Lookup Modal Props ---
  lookupModalVisible: boolean;
  setLookupModalVisible: (visible: boolean) => void;
  lookupCode: string;
  setLookupCode: (code: string) => void;
  handleLookupBooking: () => void;
  isLoadingLookup: boolean;
  lookupResult: any | null;

  // --- Helpers ---
  getStatusConfig: (status: string) => {
    bg: string;
    color: string;
    label: string;
  };
  formatTime: (time: string) => string;
  displayData: (data: any) => string;
  handleCall: (phone: string) => void;
}

interface DetailItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isLink?: boolean;
  styles: any;
}

// --- Helper Component ---
const DetailItem = ({
  label,
  value,
  icon,
  isLink,
  styles,
}: DetailItemProps) => (
  <View style={styles.detailRowItem}>
    <View style={styles.detailIconWrapper}>{icon}</View>
    <View style={styles.detailTextWrapper}>
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

// --- Main Component ---

const DoorRequestManagerModals: React.FC<DoorRequestManagerModalsProps> = ({
  styles,
  // Reject
  rejectModalVisible,
  setRejectModalVisible,
  rejectReason,
  setRejectReason,
  confirmReject,
  // Accept
  acceptModalVisible,
  setAcceptModalVisible,
  acceptNote,
  setAcceptNote,
  confirmAccept,
  // Detail
  detailModalVisible,
  setDetailModalVisible,
  isLoadingDetail,
  selectedDetail,
  activeTab,
  handleRejectInit,
  handleAccept,
  // Lookup
  lookupModalVisible,
  setLookupModalVisible,
  lookupCode,
  setLookupCode,
  handleLookupBooking,
  isLoadingLookup,
  lookupResult,
  // Helpers
  getStatusConfig,
  formatTime,
  displayData,
  handleCall,
}) => {
  return (
    <>
      {/* --- 1. REJECT MODAL (TỪ CHỐI) --- */}
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
              style={[
                styles.rejectInput,
                { backgroundColor: "#FFFFFF", borderColor: "#FECACA" },
              ]}
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

      {/* --- 2. ACCEPT MODAL (DUYỆT) --- */}
      <Modal
        transparent
        visible={acceptModalVisible}
        animationType="fade"
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.rejectModalContent}>
            <View style={styles.rejectHeader}>
              <Text style={[styles.rejectTitle, { color: "#16A34A" }]}>
                Xác nhận Duyệt
              </Text>
              <TouchableOpacity onPress={() => setAcceptModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.rejectLabel}>
              Nhập ghi chú cho sinh viên (không bắt buộc):
            </Text>

            <TextInput
              style={[
                styles.rejectInput,
                { borderColor: "#BBF7D0", backgroundColor: "#FFFFFF" },
              ]}
              placeholder="VD: Yêu cầu hợp lệ, đã mở cửa..."
              value={acceptNote}
              onChangeText={setAcceptNote}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={styles.rejectBtnCancel}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={styles.rejectBtnTextCancel}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rejectBtnConfirm,
                  { backgroundColor: "#16A34A" },
                ]}
                onPress={confirmAccept}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Check size={18} color="white" />
                  <Text style={styles.rejectBtnTextConfirm}>Duyệt ngay</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- 3. DETAIL MODAL --- */}
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
                  styles={styles}
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
                    styles={styles}
                    label="Số điện thoại"
                    value={displayData(selectedDetail.requestedByPhoneNumber)}
                    icon={<Phone size={16} color="#64748B" />}
                    isLink
                  />
                </TouchableOpacity>
                <DetailItem
                  styles={styles}
                  label="Email"
                  value={displayData(selectedDetail.requestedByEmail)}
                  icon={<Mail size={16} color="#64748B" />}
                />

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>
                  Thông tin phòng & Yêu cầu
                </Text>
                <DetailItem
                  styles={styles}
                  label="Phòng Lab"
                  value={displayData(selectedDetail.labName)}
                  icon={<Building2 size={16} color="#64748B" />}
                />
                <DetailItem
                  styles={styles}
                  label="Mã đặt phòng"
                  value={displayData(selectedDetail.bookingCode)}
                  icon={<Hash size={16} color="#64748B" />}
                />
                {/* Thời gian gửi (Giữ nguyên) */}
                <DetailItem
                  styles={styles}
                  label="Thời gian gửi"
                  value={formatTime(selectedDetail.requestTime)}
                  icon={<Clock size={16} color="#64748B" />}
                />

                {/* --- MỚI: NGÀY MUỐN MỞ CỬA --- */}
                <View style={styles.detailRowItem}>
                  <View style={styles.detailIconWrapper}>
                    <CalendarDays size={18} color="#EA580C" />
                  </View>
                  <View style={styles.detailTextWrapper}>
                    <Text
                      style={[
                        styles.detailItemLabel,
                        { color: "#EA580C", fontWeight: "600" },
                      ]}
                    >
                      Ngày muốn mở cửa
                    </Text>
                    <Text style={styles.detailItemValue}>
                      {formatDateDisplay(selectedDetail.requestDate)}{" "}
                      {selectedDetail.slotLabel
                        ? `(${selectedDetail.slotLabel})`
                        : ""}
                    </Text>
                  </View>
                </View>

                {/* --- MỚI: CA TRỰC / THỜI GIAN --- */}
                <View style={styles.detailRowItem}>
                  <View style={styles.detailIconWrapper}>
                    <Clock size={18} color="#EA580C" />
                  </View>
                  <View style={styles.detailTextWrapper}>
                    <Text
                      style={[
                        styles.detailItemLabel,
                        { color: "#EA580C", fontWeight: "600" },
                      ]}
                    >
                      Ca trực/Thời gian mở
                    </Text>
                    <Text style={styles.detailItemValue}>
                      {selectedDetail.slotStartTime?.slice(0, 5) || "--:--"} -{" "}
                      {selectedDetail.slotEndTime?.slice(0, 5) || "--:--"}
                    </Text>
                  </View>
                </View>

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

      {/* --- 4. LOOKUP MODAL --- */}
      <Modal
        transparent
        visible={lookupModalVisible}
        animationType="fade"
        onRequestClose={() => setLookupModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
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
                }}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              style={{ flexGrow: 0 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Nhập mã booking hoặc ID:</Text>
              <View style={styles.lookupInputContainer}>
                <TextInput
                  style={styles.lookupInput}
                  placeholder="Ví dụ: 3fa85f64..."
                  value={lookupCode}
                  onChangeText={setLookupCode}
                  autoCapitalize="none"
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

              {lookupResult && (
                <View style={styles.lookupResultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>
                      ✅ Tìm thấy thông tin
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <DetailItem
                    styles={styles}
                    label="Phòng"
                    value={lookupResult.labName}
                    icon={<Building2 size={16} color="#64748B" />}
                  />
                  <DetailItem
                    styles={styles}
                    label="Người đặt"
                    value={lookupResult.requesterFullName}
                    icon={<User size={16} color="#64748B" />}
                  />
                  <DetailItem
                    styles={styles}
                    label="Email"
                    value={displayData(lookupResult.requesterEmail)}
                    icon={<Mail size={16} color="#64748B" />}
                  />
                  <DetailItem
                    styles={styles}
                    label="Số điện thoại"
                    value={displayData(lookupResult.requesterPhoneNumber)}
                    icon={<Phone size={16} color="#64748B" />}
                  />

                  <DetailItem
                    styles={styles}
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
    </>
  );
};

export default DoorRequestManagerModals;
