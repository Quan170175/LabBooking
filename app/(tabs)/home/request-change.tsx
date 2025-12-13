import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Send,
  AlertCircle,
  Calendar,
  ChevronDown,
  Check,
  MapPin,
  Layers,
} from "lucide-react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- MOCK DATA ---
const MOCK_MY_BOOKINGS = [
  {
    id: "bk_001",
    labName: "Lab A101 (IoT Research)",
    date: "2025-12-10",
    slots: ["Slot 2 (09:15 - 11:30)"],
    status: "Approved",
  },
  {
    id: "bk_002",
    labName: "Lab B202 (Network)",
    date: "2025-12-15",
    slots: [
      "Slot 1 (07:00 - 09:15)",
      "Slot 2 (09:15 - 11:30)",
      "Slot 3 (12:30 - 14:45)",
      "Slot 4 (15:00 - 17:15)",
      "Slot 5 (17:30 - 19:45)",
    ],
    status: "Approved",
  },
  {
    id: "bk_003",
    labName: "Lab C303 (AI)",
    date: "2025-12-18",
    slots: ["Slot 1 (07:00 - 09:15)", "Slot 2 (09:15 - 11:30)"],
    status: "Approved",
  },
];

export default function RequestChangeScreen() {
  const router = useRouter();

  // State
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSlotsExpanded, setIsSlotsExpanded] = useState(false);

  // 1. Load data
  useEffect(() => {
    const fetchMyBookings = async () => {
      setIsLoadingList(true);
      try {
        setTimeout(() => {
          setMyBookings(MOCK_MY_BOOKINGS);
          setIsLoadingList(false);
        }, 800);
      } catch (error) {
        console.error("Lỗi:", error);
        setIsLoadingList(false);
      }
    };
    fetchMyBookings();
  }, []);

  const toggleSlots = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSlotsExpanded(!isSlotsExpanded);
  };

  const handleSubmit = async () => {
    if (!selectedBooking || !reason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Thành công", "Đã gửi yêu cầu.", [
        { text: "OK", onPress: () => router.push("/(tabs)/home" as any) },
      ]);
    }, 1500);
  };

  const renderSlots = (slots: string[]) => {
    if (slots.length <= 2) {
      return (
        <View style={{ flex: 1 }}>
          {slots.map((s, i) => (
            <Text key={i} style={styles.infoValue}>
              {s}
            </Text>
          ))}
        </View>
      );
    }
    const displaySlots = isSlotsExpanded ? slots : slots.slice(0, 2);
    const remaining = slots.length - 2;
    return (
      <View style={{ flex: 1 }}>
        {displaySlots.map((s, i) => (
          <Text key={i} style={styles.infoValue}>
            {s}
          </Text>
        ))}
        <TouchableOpacity
          onPress={toggleSlots}
          activeOpacity={0.7}
          style={{ marginTop: 4 }}
        >
          <Text style={styles.moreSlotsText}>
            {isSlotsExpanded ? "Thu gọn" : `+ ${remaining} slot khác...`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.modalItem,
        selectedBooking?.id === item.id && styles.modalItemSelected,
      ]}
      onPress={() => {
        setSelectedBooking(item);
        setIsSlotsExpanded(false);
        setModalVisible(false);
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.labName}</Text>
        <Text style={styles.itemSub}>
          {item.date} • {item.slots.length} slot
        </Text>
      </View>
      {selectedBooking?.id === item.id && <Check size={20} color="#EA580C" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Để ngoài KeyboardAvoidingView */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu đổi lịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 🔥 FIX LAYOUT: KeyboardAvoidingView bọc toàn bộ nội dung còn lại.
         - iOS: behavior="padding" (đẩy lên bằng padding)
         - Android: behavior="height" (thu nhỏ chiều cao view lại)
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.flexContainer}>
          {/* ScrollView chiếm phần trên */}
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Chọn Lịch */}
            <Text style={styles.sectionLabel}>1. Chọn lịch cần đổi</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setModalVisible(true)}
              disabled={isLoadingList}
            >
              {isLoadingList ? (
                <ActivityIndicator size="small" color="#EA580C" />
              ) : selectedBooking ? (
                <View>
                  <Text style={styles.selectedTextMain}>
                    {selectedBooking.labName}
                  </Text>
                  <Text style={styles.selectedTextSub}>
                    {selectedBooking.date} • {selectedBooking.slots.length} slot
                  </Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>
                  -- Nhấn để chọn lịch --
                </Text>
              )}
              <ChevronDown size={20} color="#64748B" />
            </TouchableOpacity>

            {/* 2. Thông tin & 3. Lý do */}
            {selectedBooking && (
              <>
                <View style={styles.infoCard}>
                  <View style={styles.infoRowHeader}>
                    <AlertCircle size={18} color="#C2410C" />
                    <Text style={styles.infoTitle}>Thông tin chi tiết</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.infoLabel}>Phòng:</Text>
                    <Text style={styles.infoValue}>
                      {selectedBooking.labName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.infoLabel}>Ngày:</Text>
                    <Text style={styles.infoValue}>{selectedBooking.date}</Text>
                  </View>
                  <View
                    style={[styles.detailRow, { alignItems: "flex-start" }]}
                  >
                    <Layers
                      size={16}
                      color="#64748B"
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.infoLabel}>Các Slot:</Text>
                    {renderSlots(selectedBooking.slots)}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>
                    2. Lý do thay đổi <Text style={{ color: "red" }}>*</Text>
                  </Text>
                  <Text style={styles.subLabel}>
                    Giải thích lý do và ghi chú khung giờ mong muốn đổi sang.
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Ví dụ: Xin dời sang Slot 4 ngày mai..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={reason}
                    onChangeText={setReason}
                  />
                </View>
              </>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Button - Luôn nằm đáy View này */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!selectedBooking || !reason.trim()) && styles.disabledBtn,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedBooking || !reason.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send size={18} color="white" />
                  <Text style={styles.submitText}>Gửi yêu cầu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn lịch cần đổi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#EA580C", fontWeight: "600" }}>
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={myBookings}
              keyExtractor={(item) => item.id}
              renderItem={renderBookingItem}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    marginTop: 20,
                  }}
                >
                  Bạn không có lịch đặt nào khả dụng.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  // Flex container để chia layout: ScrollView (trên) và Footer (dưới)
  flexContainer: { flex: 1, justifyContent: "space-between" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  backBtn: { padding: 4 },

  content: { padding: 16 },

  // Selector
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 24,
  },
  placeholderText: { fontSize: 15, color: "#94A3B8" },
  selectedTextMain: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  selectedTextSub: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // Info Card
  infoCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    marginBottom: 24,
  },
  infoRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#C2410C" },
  divider: { height: 1, backgroundColor: "#FED7AA", marginVertical: 12 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  infoLabel: { fontSize: 14, color: "#64748B", width: 65, marginLeft: 8 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#334155", flex: 1 },
  moreSlotsText: {
    fontSize: 13,
    color: "#EA580C",
    fontWeight: "600",
    fontStyle: "italic",
  },

  // Form
  formSection: { gap: 8 },
  subLabel: { fontSize: 13, color: "#64748B", marginBottom: 8, lineHeight: 18 },
  textArea: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    color: "#0F172A",
    textAlignVertical: "top",
  },

  // Footer Button Container
  footerContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    // Padding bottom an toàn cho các dòng máy
    paddingBottom: Platform.OS === "ios" ? 20 : 100,
  },
  submitBtn: {
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: { backgroundColor: "#94A3B8", shadowOpacity: 0, elevation: 0 },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },

  // Modal Styles (Giữ nguyên)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
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
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemSelected: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  itemSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
});
