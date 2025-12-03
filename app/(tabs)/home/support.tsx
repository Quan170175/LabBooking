import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  MessageSquarePlus,
  Plus,
  Send,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Types ---
type FAQItem = {
  id: string | number;
  question: string;
  answer: string;
};

type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  createdAt: string;
  status: "pending" | "resolved";
};

export default function SupportScreen() {
  const router = useRouter();

  // --- States ---
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  async function loadTickets() {
    try {
      const s = await AsyncStorage.getItem("supportTickets");
      const data = JSON.parse(s || "[]");
      setTickets(Array.isArray(data) ? data.reverse() : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchFAQs() {
    await new Promise((r) => setTimeout(r, 500));
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

  async function submitTicket() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ tiêu đề và nội dung."
      );
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const newTicket: SupportTicket = {
      id: Date.now(),
      subject,
      message,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      const current = [...tickets];
      const updatedList = [newTicket, ...current];
      await AsyncStorage.setItem("supportTickets", JSON.stringify(updatedList));

      setTickets(updatedList);
      setSubject("");
      setMessage("");
      setIsFormVisible(false);
      Alert.alert("Thành công", "Yêu cầu của bạn đã được gửi!");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleFaq = (id: string | number) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
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
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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

          {tickets.length === 0 ? (
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
              {tickets.map((t) => (
                <View key={t.id} style={styles.ticketItem}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>
                      {t.subject}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Đang xử lý</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage} numberOfLines={2}>
                    {t.message}
                  </Text>
                  <View style={styles.ticketFooter}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.ticketDate}>
                      {new Date(t.createdAt).toLocaleDateString("vi-VN")} •{" "}
                      {new Date(t.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Padding bottom để list không bị FAB che khi cuộn hết */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB - ĐÃ ĐẨY CAO LÊN TRÁNH BOTNAV */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF7ED",
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
  faqRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
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
  faqAnswer: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

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
  ticketSubject: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 11, fontWeight: "600", color: "#D97706" },
  ticketMessage: { fontSize: 14, color: "#475569", marginBottom: 8 },
  ticketFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketDate: { fontSize: 12, color: "#94A3B8" },

  // 🔥 FAB ĐÃ ĐƯỢC KÉO LÊN
  fab: {
    position: "absolute",
    bottom: 110, // Kéo lên cao để tránh BotNav (thường BotNav ~60-80px)
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
