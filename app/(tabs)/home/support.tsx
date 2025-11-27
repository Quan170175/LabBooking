import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  MessageSquarePlus,
  Plus,
  Send,
  X,
  XCircle, // 👈 Thêm icon cho trạng thái Ignored
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

// 🟢 1. Import API Client
import apiClient from "../../../utils/api";

// --- Types (Cập nhật theo Entity Backend) ---

// 👈 THÊM ENUM STATUS TYPE
type SupportStatus = "Pending" | "Responded" | "Ignored";

type FAQItem = {
  id: string | number;
  question: string;
  answer: string;
};

// Cấu trúc dữ liệu trả về từ API
type SupportTicket = {
  id: string; // Backend trả về UUID
  title: string;
  content: string;
  answer: string | null; // Câu trả lời từ admin
  status: SupportStatus; // 👈 ĐÃ THÊM: Trạng thái từ Backend
  createdDate?: string;
  createdAt?: string;
  respondedAt?: string | null;
  createdById?: string;
};

// Cấu trúc phân trang chung
interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalItemsCount: number;
}

export default function SupportScreen() {
  const router = useRouter();

  // --- States ---
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form States
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ Expand State
  const [expandedFaqId, setExpandedFaqId] = useState<string | number | null>(
    null
  );

  // --- Logic ---

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    await Promise.all([loadTickets(), fetchFAQs()]);
    setIsLoading(false);
  }

  // 🟢 Hàm định dạng ngày giờ (Ngày/Tháng/Năm Giờ:Phút)
  const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return "Chưa xác định";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Chưa xác định";

      const datePart = date.toLocaleDateString("vi-VN");
      const timePart = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${datePart} ${timePart}`;
    } catch {
      return "Chưa xác định";
    }
  };

  // 🟢 2. Hàm lấy danh sách yêu cầu (GET) - Tối ưu hóa
  async function loadTickets() {
    try {
      console.log("➡️ Đang gọi GET /api/Supports/my để lấy lịch sử...");
      // Đã đổi endpoint thành /api/Supports/my như trong code bạn cung cấp
      const response = await apiClient.get<PaginatedResponse<SupportTicket>>(
        "/api/Supports/my",
        {
          params: {
            PageNumber: 1,
            PageSize: 10, // Lấy 10 mục gần nhất
            // Các param khác (SortBy, SortDirection) đã bị xóa để tối giản
          },
        }
      );

      // Xử lý response theo cấu trúc phân trang { items: [...] }
      if (response.data && Array.isArray(response.data.items)) {
        setTickets(response.data.items);
      } else {
        // Trường hợp API trả về mảng trực tiếp
        setTickets(Array.isArray(response.data) ? response.data : []);
      }
    } catch (e) {
      console.error("❌ Lỗi lấy lịch sử hỗ trợ:", e);
      // Giữ lại Alert để báo lỗi 403 cho người dùng
      Alert.alert(
        "Lỗi",
        "Không thể lấy lịch sử yêu cầu. Vui lòng thử lại sau."
      );
    }
  }

  async function fetchFAQs() {
    // FAQ hiện tại vẫn giả lập
    setFaqs([
      {
        id: 1,
        question: "Làm sao để đặt phòng?",
        answer: "Vào mục 'Đặt Lab' > Chọn phòng > Chọn giờ > Xác nhận.",
      },
      {
        id: 2,
        question: "Quy định hủy lịch?",
        answer: "Hủy trước 24h không bị phạt. Hủy muộn sẽ bị ghi nhận vi phạm.",
      },
      {
        id: 3,
        question: "Tôi có thể mượn thiết bị qua đêm không?",
        answer:
          "Không. Thiết bị chỉ được sử dụng trong giờ hành chính tại Lab.",
      },
    ]);
  }

  // 🟢 3. Hàm gửi yêu cầu (POST)
  async function submitTicket() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ tiêu đề và nội dung."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Gọi API POST - apiClient tự động gửi token và UserID
      await apiClient.post("/api/Supports", {
        title: subject,
        content: message,
      });

      Alert.alert("Thành công", "Yêu cầu của bạn đã được gửi!");

      // Reset form
      setSubject("");
      setMessage("");
      setIsFormVisible(false);

      // Load lại danh sách để hiện yêu cầu vừa tạo
      loadTickets();
    } catch (e: any) {
      console.error("❌ Lỗi gửi support:", e);
      Alert.alert("Lỗi", "Không thể gửi yêu cầu. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleFaq = (id: string | number) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EA580C"]}
          />
        }
      >
        {/* PHẦN 1: FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          <View style={styles.card}>
            {faqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqRow, isExpanded && styles.faqRowActive]}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text
                      style={[
                        styles.faqQuestion,
                        isExpanded && styles.faqQuestionActive,
                      ]}
                    >
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#EA580C" />
                    ) : (
                      <ChevronDown size={18} color="#94A3B8" />
                    )}
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PHẦN 2: LỊCH SỬ YÊU CẦU */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Lịch sử yêu cầu của bạn</Text>
            <History size={16} color="#64748B" />
          </View>

          {tickets.length === 0 && !refreshing ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <MessageSquarePlus size={32} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>Bạn chưa gửi yêu cầu nào.</Text>
              <Text style={styles.emptySubText}>
                Nếu gặp vấn đề, hãy nhấn nút bên dưới để tạo yêu cầu mới.
              </Text>
            </View>
          ) : (
            <View style={styles.ticketList}>
              {tickets.map((t) => {
                // 🟢 CẬP NHẬT LOGIC STATUS
                const status = t.status || "Pending";
                const isResolved = status === "Responded";
                const isIgnored = status === "Ignored";
                const createdTime = t.createdAt || t.createdDate;

                // 🟢 CẬP NHẬT GIAO DIỆN STATUS
                const statusDisplay = () => {
                  switch (status) {
                    case "Responded":
                      return {
                        text: "Đã trả lời",
                        badgeStyle: styles.statusResolved,
                        textStyle: styles.textResolved,
                      };
                    case "Ignored":
                      return {
                        text: "Đã bỏ qua",
                        badgeStyle: styles.statusIgnored,
                        textStyle: styles.textIgnored,
                      };
                    case "Pending":
                    default:
                      return {
                        text: "Đang xử lý",
                        badgeStyle: styles.statusPending,
                        textStyle: styles.textPending,
                      };
                  }
                };

                const currentStatus = statusDisplay();

                return (
                  <View key={t.id} style={styles.ticketItem}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <View
                        style={[styles.statusBadge, currentStatus.badgeStyle]}
                      >
                        <Text
                          style={[styles.statusText, currentStatus.textStyle]}
                        >
                          {currentStatus.text}
                        </Text>
                      </View>
                    </View>

                    {/* Nội dung câu hỏi */}
                    <Text style={styles.ticketMessage} numberOfLines={2}>
                      {t.content}
                    </Text>

                    {/* Hiển thị chi tiết trả lời / bỏ qua */}
                    {isResolved && t.answer && (
                      <View style={styles.answerPreview}>
                        <CheckCircle2
                          size={12}
                          color="#16A34A"
                          style={{ marginTop: 2 }}
                        />
                        <Text style={styles.answerText} numberOfLines={2}>
                          {t.answer}
                        </Text>
                      </View>
                    )}

                    {isIgnored && (
                      <View
                        style={[styles.answerPreview, styles.ignorePreview]}
                      >
                        <XCircle
                          size={12}
                          color="#DC2626"
                          style={{ marginTop: 2 }}
                        />
                        <Text
                          style={[styles.answerText, styles.ignoreText]}
                          numberOfLines={2}
                        >
                          Yêu cầu này đã bị từ chối vì không hợp lệ.
                        </Text>
                      </View>
                    )}

                    {/* 🟢 FOOTER: Hiển thị 2 loại thời gian */}
                    <View style={styles.ticketFooterContainer}>
                      {/* Ngày tạo */}
                      <View style={styles.ticketFooter}>
                        <Clock size={12} color="#94A3B8" />
                        <Text style={styles.ticketDateLabel}>Tạo:</Text>
                        <Text style={styles.ticketDate}>
                          {formatDateTime(createdTime)}
                        </Text>
                      </View>

                      {/* Ngày trả lời/xử lý (Chỉ hiện khi Responded hoặc Ignored) */}
                      {(isResolved || isIgnored) && (
                        <View style={styles.ticketFooter}>
                          {isResolved ? (
                            <CheckCircle2 size={12} color="#16A34A" />
                          ) : (
                            <XCircle size={12} color="#DC2626" />
                          )}
                          <Text style={styles.ticketDateLabel}>
                            {isResolved ? "TL:" : "Xử lý:"}
                          </Text>
                          <Text
                            style={[
                              styles.ticketDate,
                              isResolved
                                ? styles.ticketDateResolved
                                : styles.ticketDateIgnored,
                            ]}
                          >
                            {formatDateTime(t.respondedAt)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* PHẦN 3: FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsFormVisible(true)}
        activeOpacity={0.9}
      >
        <Plus size={24} color="white" />
        <Text style={styles.fabText}>Gửi yêu cầu mới</Text>
      </TouchableOpacity>

      {/* --- MODAL FORM --- */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo yêu cầu mới</Text>
              <TouchableOpacity onPress={() => setIsFormVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.label}>Tiêu đề vấn đề</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Lỗi đặt phòng lab 302"
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={styles.label}>Chi tiết nội dung</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả kỹ vấn đề..."
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={submitTicket}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={18} color="white" />
                    <Text style={styles.submitText}>Gửi ngay</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 4 },
  backText: { color: "#64748B", fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  faqRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  faqRowActive: { backgroundColor: "#FFF7ED" },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
    marginRight: 8,
  },
  faqQuestionActive: { color: "#EA580C", fontWeight: "600" },
  faqAnswer: { marginTop: 8, fontSize: 14, color: "#64748B", lineHeight: 20 },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  emptySubText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },

  ticketList: { gap: 12 },
  ticketItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ticketSubject: { fontSize: 15, fontWeight: "700", color: "#0F172A", flex: 1 },

  // 🟢 Status Styles CẬP NHẬT
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPending: { backgroundColor: "#FEF3C7" }, // Màu vàng
  statusResolved: { backgroundColor: "#DCFCE7" }, // Màu xanh lá
  statusIgnored: { backgroundColor: "#FEE2E2" }, // Màu đỏ nhạt

  statusText: { fontSize: 11, fontWeight: "600" },
  textPending: { color: "#D97706" },
  textResolved: { color: "#16A34A" },
  textIgnored: { color: "#DC2626" }, // Màu đỏ đậm

  ticketMessage: { fontSize: 14, color: "#475569", marginBottom: 8 },

  // STYLES CHO HIỂN THỊ THỜI GIAN
  ticketFooterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  ticketFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ticketDateLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginRight: 2,
  },
  ticketDate: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
  },
  ticketDateResolved: {
    color: "#16A34A",
    fontWeight: "600",
  },
  // 👈 THÊM STYLE CHO THỜI GIAN BỊ BỎ QUA
  ticketDateIgnored: {
    color: "#DC2626",
    fontWeight: "600",
  },

  // New Answer Preview Style
  answerPreview: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F0FDF4",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  // 👈 THÊM STYLE CHO IGNORED PREVIEW
  ignorePreview: {
    backgroundColor: "#FEF2F2",
  },
  answerText: { fontSize: 13, color: "#15803D", flex: 1 },
  // 👈 THÊM STYLE CHO IGNORED TEXT
  ignoreText: {
    color: "#DC2626",
  },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 16,
    left: 16,
    backgroundColor: "#EA580C",
    borderRadius: 50,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: "white", fontSize: 16, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    color: "#0F172A",
  },
  textArea: { height: 120 },
  submitBtn: {
    backgroundColor: "#EA580C",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
});
