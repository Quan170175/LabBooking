import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { X, MessageSquare, User, Clock } from "lucide-react-native";

export interface SecurityMessage {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectMessage: (messageContent: string) => void;
}

export default function SecurityMessagesModal({
  visible,
  onClose,
  onSelectMessage,
}: Props) {
  const [messages, setMessages] = useState<SecurityMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchMessages();
    }
  }, [visible]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Mock Data
      setTimeout(() => {
        setMessages([
          {
            id: "1",
            senderName: "BV Nguyễn Văn A",
            content: "Máy lạnh phòng này bị chảy nước, sàn nhà rất trơn.",
            createdAt: "2025-11-28T08:30:00",
          },
          {
            id: "2",
            senderName: "BV Trần Văn B",
            content: "Cửa sổ bị kẹt chốt không khóa được.",
            createdAt: "2025-11-28T09:15:00",
          },
          {
            id: "3",
            senderName: "BV Lê Văn C",
            content: "Bóng đèn phía trên bảng bị nhấp nháy liên tục.",
            createdAt: "2025-11-27T16:00:00",
          },
          {
            id: "4",
            senderName: "BV Phạm Văn D",
            content: "Máy chiếu bị ám màu vàng, hình ảnh mờ.",
            createdAt: "2025-11-27T10:00:00",
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Lỗi lấy tin nhắn:", error);
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(
      2,
      "0"
    )} - ${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade" // 🟢 Đổi thành fade để hiện giữa
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <MessageSquare size={20} color="#EA580C" />
              <Text style={styles.title}>Tin nhắn từ Security</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#EA580C" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Không có báo cáo nào.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.msgItem}
                  onPress={() => onSelectMessage(item.content)}
                >
                  <View style={styles.msgHeader}>
                    <View style={styles.senderRow}>
                      <User size={14} color="#3B82F6" />
                      <Text style={styles.senderName}>{item.senderName}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={styles.timeText}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.content}>{item.content}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", // 🟢 Căn giữa dọc
    alignItems: "center", // 🟢 Căn giữa ngang
    padding: 20,
  },
  container: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20, // 🟢 Bo tròn đều
    width: "100%",
    maxHeight: "80%", // Giới hạn chiều cao
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 100,
  },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 20 },
  msgItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  senderName: { fontSize: 12, fontWeight: "600", color: "#3B82F6" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 12, color: "#94A3B8" },
  content: { fontSize: 14, color: "#334155", lineHeight: 20 },
});
