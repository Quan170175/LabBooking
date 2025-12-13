import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  X,
  ArrowRight,
  Layers,
} from "lucide-react-native";

import ChangeRequestSummaryCard from "../../../../components/manager/ChangeRequestSummaryCard";

// --- MOCK DATA (Cập nhật oldSlots là MẢNG) ---
const INITIAL_DATA = [
  {
    id: "req_001",
    userName: "Nguyễn Văn Sinh Viên",
    labName: "Lab A101 (IoT Research)",
    oldDate: "2025-12-10",
    oldSlots: ["Slot 2 (09:15 - 11:30)"],
    reason:
      "Em bị sốt xuất huyết phải nhập viện, xin thầy cho em dời lịch sang tuần sau ạ.",
    createdAt: "2025-12-09T10:00:00Z",
    status: "Pending",
  },
  {
    id: "req_002",
    userName: "Trần Thị Giảng Viên",
    labName: "Lab B202 (Network)",
    oldDate: "2025-12-11",
    oldSlots: [
      "Slot 1 (07:00 - 09:15)",
      "Slot 2 (09:15 - 11:30)",
      "Slot 3 (12:30 - 14:45)",
      "Slot 4 (15:00 - 17:15)",
      "Slot 5 (17:30 - 19:45)",
    ],
    reason:
      "Phòng máy lạnh bị hỏng, tôi muốn đổi sang phòng Lab C303 nếu còn trống.",
    createdAt: "2025-12-09T14:30:00Z",
    status: "Pending",
  },
];

export default function ChangeRequestsScreen() {
  const router = useRouter();
  const [data, setData] = useState(INITIAL_DATA);

  // State Modal Chi tiết
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);

  // State Modal Từ chối
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  // --- ACTIONS ---

  // 1. Mở xem chi tiết
  const openDetail = (item: any) => {
    setSelectedReq(item);
    setModalVisible(true);
  };

  // 2. Chấp nhận
  const handleAccept = (id: string) => {
    Alert.alert("Xác nhận", "Bạn muốn chấp nhận yêu cầu này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          setData((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: "Accepted" } : item
            )
          );
          if (modalVisible) setModalVisible(false);
        },
      },
    ]);
  };

  // 3. Mở Modal Từ chối
  const handleRejectPress = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectVisible(true);
  };

  // 4. Xác nhận Từ chối
  const submitReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do từ chối.");
      return;
    }
    if (rejectId) {
      setData((prev) =>
        prev.map((item) =>
          item.id === rejectId
            ? { ...item, status: "Rejected", rejectReason: rejectReason }
            : item
        )
      );
      setRejectVisible(false);
      setRejectId(null);
      if (modalVisible) setModalVisible(false);
    }
  };

  // 5. Chuyển trang (Action trong detail modal)
  const handleProceed = () => {
    setModalVisible(false);
    Alert.alert("Chuyển hướng", "Đang chuyển sang màn hình xếp lịch...");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <Stack.Screen options={{ headerShown: false }} /> */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu đổi lịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChangeRequestSummaryCard
            request={item}
            onPress={() => openDetail(item)}
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleRejectPress(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có yêu cầu nào.</Text>
        }
      />

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeIcon}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedReq && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* User Info */}
                <View style={styles.infoRow}>
                  <User size={18} color="#EA580C" />
                  <Text style={styles.infoText}>
                    <Text style={styles.bold}>Người gửi:</Text>{" "}
                    {selectedReq.userName}
                  </Text>
                </View>

                {/* Room Info */}
                <View style={styles.infoRow}>
                  <MapPin size={18} color="#EA580C" />
                  <Text style={styles.infoText}>
                    <Text style={styles.bold}>Phòng:</Text>{" "}
                    {selectedReq.labName}
                  </Text>
                </View>

                {/* Date Info */}
                <View style={styles.infoRow}>
                  <Calendar size={18} color="#EA580C" />
                  <Text style={styles.infoText}>
                    <Text style={styles.bold}>Ngày cũ:</Text>{" "}
                    {selectedReq.oldDate}
                  </Text>
                </View>

                {/* Slots Info (Hiển thị FULL danh sách trong Modal) */}
                <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                  <Layers size={18} color="#EA580C" style={{ marginTop: 2 }} />
                  <View>
                    <Text style={[styles.infoText, styles.bold]}>
                      Các Slot cũ:
                    </Text>
                    {selectedReq.oldSlots.map((slot: string, idx: number) => (
                      <Text key={idx} style={styles.slotItemDetail}>
                        • {slot}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Reason */}
                <View style={styles.reasonBoxDetail}>
                  <Text style={styles.reasonTitle}>Lý do xin đổi:</Text>
                  <Text style={styles.reasonContent}>
                    "{selectedReq.reason}"
                  </Text>
                </View>

                {/* Nếu đã từ chối */}
                {selectedReq.status === "Rejected" &&
                  selectedReq.rejectReason && (
                    <View
                      style={[
                        styles.reasonBoxDetail,
                        { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                      ]}
                    >
                      <Text style={[styles.reasonTitle, { color: "#DC2626" }]}>
                        Lý do từ chối:
                      </Text>
                      <Text
                        style={[styles.reasonContent, { color: "#991B1B" }]}
                      >
                        "{selectedReq.rejectReason}"
                      </Text>
                    </View>
                  )}

                <View style={styles.metaRow}>
                  <Clock size={14} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    Gửi lúc: {new Date(selectedReq.createdAt).toLocaleString()}
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Nếu đang Pending thì hiện nút đi xử lý */}
            {selectedReq?.status === "Pending" && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleProceed}
                >
                  <Text style={styles.actionBtnText}>
                    Đi đến trang Xếp lịch
                  </Text>
                  <ArrowRight size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODAL TỪ CHỐI --- */}
      <Modal
        visible={rejectVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRejectVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[styles.modalContainer, { height: "auto", minHeight: 300 }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: "#DC2626" }]}>
                Từ chối yêu cầu
              </Text>
              <TouchableOpacity onPress={() => setRejectVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Vui lòng nhập lý do từ chối:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Lịch này đã có lớp khác đặt..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={rejectReason}
                onChangeText={setRejectReason}
                autoFocus
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btnRejectConfirm}
                onPress={submitReject}
              >
                <Text style={styles.btnTextWhite}>Xác nhận Từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  backBtn: { padding: 4 },
  listContent: { padding: 16 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#64748B" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  closeIcon: { padding: 4 },
  modalBody: { padding: 16 },

  // Detail Content Styles
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  infoText: { fontSize: 15, color: "#334155" },
  bold: { fontWeight: "700", color: "#0F172A" },
  slotItemDetail: { fontSize: 14, color: "#475569", marginTop: 2 }, // Style cho từng dòng slot trong modal

  reasonBoxDetail: {
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    marginTop: 8,
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 4,
  },
  reasonContent: { fontSize: 15, color: "#451A03", lineHeight: 22 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  metaText: { color: "#94A3B8", fontSize: 13 },

  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  actionBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { color: "white", fontSize: 16, fontWeight: "700" },

  // Reject Modal Specific
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    height: 120,
    backgroundColor: "#F8FAFC",
    textAlignVertical: "top",
  },
  btnRejectConfirm: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnTextWhite: { color: "white", fontWeight: "700", fontSize: 16 },
});
