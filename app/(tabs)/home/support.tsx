import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { CheckCircle2, Send } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Kiểu dữ liệu cho Ticket
type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  createdAt: string;
};

export default function SupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. Tải ticket từ AsyncStorage
  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      try {
        const s = await AsyncStorage.getItem("supportTickets");
        const ticketsData = JSON.parse(s || "[]");
        setTickets(Array.isArray(ticketsData) ? ticketsData.reverse() : []);
      } catch (e) {
        console.error("Failed to load support tickets", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadTickets();
  }, []);

  // 2. Hàm submit (đã bỏ name, email và dùng async)
  async function submit() {
    if (!subject || !message) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung yêu cầu.");
      return;
    }

    const newTicket: SupportTicket = {
      id: Date.now(),
      subject,
      message,
      createdAt: new Date().toISOString(),
    };

    try {
      const all = await AsyncStorage.getItem("supportTickets");
      const allData = JSON.parse(all || "[]");
      allData.push(newTicket);
      await AsyncStorage.setItem("supportTickets", JSON.stringify(allData));

      setTickets([newTicket, ...tickets]); // Cập nhật UI
      setSubject("");
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000); // Tự động ẩn thông báo
    } catch (e) {
      console.error("Failed to save support ticket", e);
      Alert.alert("Lỗi", "Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  }

  // Dữ liệu FAQ
  const faqs = [
    {
      q: "Làm sao để đặt phòng?",
      a: "Vào mục 'Đặt Lab' và làm theo các bước.",
    },
    {
      q: "Muốn mượn thiết bị thì sao?",
      a: "Chọn thiết bị trong bước 'Thiết bị' khi đặt phòng.",
    },
    {
      q: "Làm sao hủy lịch?",
      a: "Vào 'Lịch sử đặt' và xóa lịch bạn muốn hủy.",
    },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hỗ trợ</Text>
        <Text style={styles.subtitle}>
          Gửi yêu cầu hoặc tìm trợ giúp nhanh cho hệ thống Lab Booking.
        </Text>
      </View>

      {/* Card FAQ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Câu hỏi thường gặp</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>• {faq.q}</Text>
            <Text style={styles.faqAnswer}>— {faq.a}</Text>
          </View>
        ))}
      </View>

      {/* Card Form Gửi Yêu Cầu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gửi yêu cầu hỗ trợ</Text>

        {/* Tiêu đề */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Ví dụ: Lỗi không đặt được phòng"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Nội dung */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nội dung</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={4}
          />
        </View>

        {/* Nút bấm */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={submit}>
            <Send size={16} color="white" />
            <Text style={styles.buttonText}>Gửi yêu cầu</Text>
          </TouchableOpacity>

          {/* Thông báo đã gửi */}
          {sent && (
            <View style={styles.sentContainer}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.sentText}>Yêu cầu đã gửi!</Text>
            </View>
          )}

          {/* Nút quay lại */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  // FAQ Card
  faqItem: {
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  faqAnswer: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 8,
    marginTop: 2,
  },
  // Form Card
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "white",
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top", // Căn chữ lên trên cho Android
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EA580C",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  sentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },
  sentText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  backButton: {
    marginLeft: "auto", // Đẩy sang phải
  },
  backButtonText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "600",
  },
  // History Card
  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
  ticketList: {
    gap: 8,
  },
  ticketItem: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  ticketDate: {
    fontSize: 12,
    color: "#64748B",
    marginVertical: 4,
  },
  ticketMessage: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
});
