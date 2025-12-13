import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Stack } from "expo-router";
import {
  MapPin,
  Clock,
  User,
  CheckCircle,
  LogOut,
  LogIn,
  X,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  Check,
} from "lucide-react-native";

// --- TYPES ---
type SlotStatus = "Pending" | "CheckedIn" | "CheckedOut";

interface BookingSlot {
  id: string;
  timeRange: string;
  slotName: string;
  bookerName: string;
  status: SlotStatus;
}

interface LabSchedule {
  id: string;
  labName: string;
  location: string;
  slots: BookingSlot[];
}

interface Equipment {
  id: string;
  name: string;
  quantity: number;
  status: "Good" | "Broken";
}

// --- MOCK DATA ---
const MOCK_TODAY_SCHEDULE: LabSchedule[] = [
  {
    id: "lab-01",
    labName: "Lab A101 - IoT System",
    location: "Tòa A, Tầng 1",
    slots: [
      {
        id: "slot-01",
        slotName: "Slot 1",
        timeRange: "07:00 - 09:15",
        bookerName: "Nguyễn Văn A (GV)",
        status: "CheckedIn",
      },
      {
        id: "slot-02",
        slotName: "Slot 2",
        timeRange: "09:30 - 11:45",
        bookerName: "Trần Thị B (SV)",
        status: "Pending",
      },
    ],
  },
  {
    id: "lab-02",
    labName: "Lab B202 - AI Research",
    location: "Tòa B, Tầng 2",
    slots: [
      {
        id: "slot-03",
        slotName: "Slot 3",
        timeRange: "12:30 - 14:45",
        bookerName: "Lê Văn C (CLB)",
        status: "Pending",
      },
    ],
  },
  {
    id: "lab-03",
    labName: "Lab C305 - Network",
    location: "Tòa C, Tầng 3",
    slots: [
      {
        id: "slot-04",
        slotName: "Slot 4",
        timeRange: "15:00 - 17:15",
        bookerName: "Phạm Văn D",
        status: "Pending",
      },
    ],
  },
];

const MOCK_EQUIPMENT: Equipment[] = [
  { id: "eq-1", name: "Máy tính Dell Optiplex", quantity: 30, status: "Good" },
  { id: "eq-2", name: "Máy chiếu Panasonic", quantity: 1, status: "Good" },
  { id: "eq-3", name: "Điều hòa Daikin", quantity: 2, status: "Good" },
];

// --- COMPONENT: BOTTOM SHEET DROPDOWN ---
const BottomSheetSelect = ({
  label,
  data,
  value,
  onSelect,
}: {
  label: string;
  data: string[];
  value: string;
  onSelect: (val: string) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>

      {/* Nút kích hoạt */}
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.dropdownValue} numberOfLines={1}>
          {value === "All" ? "Tất cả" : value}
        </Text>
        <ChevronDown size={16} color="#64748B" />
      </TouchableOpacity>

      {/* Modal Bottom Sheet */}
      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sheetContent}>
                {/* Header của Sheet */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Chọn {label}</Text>
                  <TouchableOpacity
                    onPress={() => setVisible(false)}
                    style={styles.closeBtn}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Danh sách lựa chọn */}
                <ScrollView
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                >
                  {data.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.sheetItem,
                        value === item && styles.sheetItemActive,
                      ]}
                      onPress={() => {
                        onSelect(item);
                        setVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sheetItemText,
                          value === item && styles.sheetItemTextActive,
                        ]}
                      >
                        {item === "All" ? "Tất cả" : item}
                      </Text>
                      {value === item && <Check size={18} color="#EA580C" />}
                    </TouchableOpacity>
                  ))}
                  {/* Khoảng trống dưới cùng để không bị sát mép màn hình */}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default function SecurityTodayScheduleScreen() {
  const [schedule, setSchedule] = useState<LabSchedule[]>(MOCK_TODAY_SCHEDULE);

  // Filter State
  const [selectedLab, setSelectedLab] = useState<string>("All");
  const [selectedSlot, setSelectedSlot] = useState<string>("All");

  // Check-in/Check-out Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState<BookingSlot | null>(
    null
  );
  const [selectedLabNameData, setSelectedLabNameData] = useState("");
  const [actionType, setActionType] = useState<"CheckIn" | "CheckOut">(
    "CheckIn"
  );
  const [note, setNote] = useState("");

  // --- LOGIC ---
  const labNames = useMemo(
    () => ["All", ...Array.from(new Set(schedule.map((s) => s.labName)))],
    [schedule]
  );
  const slotNames = useMemo(() => {
    const slots = new Set<string>();
    schedule.forEach((lab) => lab.slots.forEach((s) => slots.add(s.slotName)));
    return ["All", ...Array.from(slots).sort()];
  }, [schedule]);

  const filteredSchedule = useMemo(() => {
    return schedule
      .map((lab) => ({
        ...lab,
        slots: lab.slots.filter(
          (slot) => selectedSlot === "All" || slot.slotName === selectedSlot
        ),
      }))
      .filter(
        (lab) =>
          (selectedLab === "All" || lab.labName === selectedLab) &&
          lab.slots.length > 0
      );
  }, [schedule, selectedLab, selectedSlot]);

  // --- HANDLERS ---
  const handleOpenModal = (
    labName: string,
    slot: BookingSlot,
    type: "CheckIn" | "CheckOut"
  ) => {
    setSelectedLabNameData(labName);
    setSelectedSlotData(slot);
    setActionType(type);
    setNote("");
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!selectedSlotData) return;
    const newStatus = actionType === "CheckIn" ? "CheckedIn" : "CheckedOut";
    setSchedule((prev) =>
      prev.map((lab) => ({
        ...lab,
        slots: lab.slots.map((s) =>
          s.id === selectedSlotData.id ? { ...s, status: newStatus } : s
        ),
      }))
    );
    Alert.alert(
      "Thành công",
      `Đã ${actionType === "CheckIn" ? "bàn giao" : "nhận lại"} phòng!`
    );
    setModalVisible(false);
  };

  // --- RENDER CARD ---
  const renderLabCard = ({ item }: { item: LabSchedule }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labInfo}>
          <Text style={styles.labName}>{item.labName}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.slotList}>
        {item.slots.map((slot) => {
          const isCheckedIn = slot.status === "CheckedIn";
          const isCheckedOut = slot.status === "CheckedOut";
          return (
            <View style={styles.slotContainer} key={slot.id}>
              <View style={styles.slotInfo}>
                <View style={styles.slotRow}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.timeText}>
                    {slot.slotName} ({slot.timeRange})
                  </Text>
                </View>
                <View style={styles.slotRow}>
                  <User size={14} color="#64748B" />
                  <Text style={styles.bookerText}>{slot.bookerName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnCheckIn,
                    (isCheckedIn || isCheckedOut) && styles.btnDisabled,
                  ]}
                  onPress={() => handleOpenModal(item.labName, slot, "CheckIn")}
                  disabled={isCheckedIn || isCheckedOut}
                >
                  <LogIn
                    size={16}
                    color={isCheckedIn || isCheckedOut ? "#94A3B8" : "#16A34A"}
                  />
                  <Text
                    style={[
                      styles.btnText,
                      (isCheckedIn || isCheckedOut) && styles.textDisabled,
                    ]}
                  >
                    Check In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnCheckOut,
                    (!isCheckedIn || isCheckedOut) && styles.btnDisabled,
                  ]}
                  onPress={() =>
                    handleOpenModal(item.labName, slot, "CheckOut")
                  }
                  disabled={!isCheckedIn || isCheckedOut}
                >
                  <LogOut
                    size={16}
                    color={!isCheckedIn || isCheckedOut ? "#94A3B8" : "#EA580C"}
                  />
                  <Text
                    style={[
                      styles.btnText,
                      (!isCheckedIn || isCheckedOut) && styles.textDisabled,
                    ]}
                  >
                    Check Out
                  </Text>
                </TouchableOpacity>
              </View>
              {isCheckedOut && (
                <View style={styles.statusBadge}>
                  <CheckCircle size={12} color="#16A34A" />
                  <Text style={styles.statusText}>Đã hoàn tất</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  // --- RENDER ACTION MODAL (Check Form) ---
  const renderCheckModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.actionModalOverlay}
      >
        <View style={styles.actionModalContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {actionType === "CheckIn" ? "Bàn giao phòng" : "Nhận lại phòng"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalSubtitle}>
              {selectedLabNameData} - {selectedSlotData?.timeRange}
            </Text>
            <View style={styles.sectionHeader}>
              <ClipboardList size={16} color="#EA580C" />
              <Text style={styles.sectionTitle}>Danh sách thiết bị</Text>
            </View>
            <View style={styles.equipmentList}>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                {MOCK_EQUIPMENT.map((eq) => (
                  <View key={eq.id} style={styles.eqItem}>
                    <Text style={styles.eqName}>{eq.name}</Text>
                    <Text style={styles.eqQty}>SL: {eq.quantity}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <AlertTriangle size={16} color="#EA580C" />
              <Text style={styles.sectionTitle}>Ghi chú / Báo cáo sự cố</Text>
            </View>
            <TextInput
              style={styles.inputArea}
              placeholder="Nhập ghi chú..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Lịch trình hôm nay",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FFF7ED" },
        }}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.dateText}>Thứ 7, 15/12/2025</Text>
        <Text style={styles.subText}>
          Danh sách các phòng có lịch hoạt động
        </Text>
      </View>

      {/* --- BOTTOM SHEET FILTERS --- */}
      <View style={styles.filterContainer}>
        <BottomSheetSelect
          label="Phòng Lab"
          data={labNames}
          value={selectedLab}
          onSelect={setSelectedLab}
        />
        <BottomSheetSelect
          label="Slot (Ca)"
          data={slotNames}
          value={selectedSlot}
          onSelect={setSelectedSlot}
        />
      </View>

      <FlatList
        data={filteredSchedule}
        keyExtractor={(item) => item.id}
        renderItem={renderLabCard}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 40 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Không tìm thấy lịch phù hợp.</Text>
          </View>
        }
      />
      {renderCheckModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  headerContainer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
  dateText: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  subText: { fontSize: 14, color: "#64748B", marginTop: 4 },

  // --- FILTER & DROPDOWN STYLES ---
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
    zIndex: 10,
  },
  dropdownContainer: { flex: 1 },
  dropdownLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12, // Tăng nhẹ để bấm dễ hơn
  },
  dropdownValue: { fontSize: 14, color: "#1E293B", fontWeight: "500", flex: 1 },

  // --- BOTTOM SHEET STYLES ---
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)", // Nền tối
    justifyContent: "flex-end", // Đẩy nội dung xuống đáy
  },
  sheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: "60%", // Chiều cao tối đa của sheet
    paddingBottom: 30, // Chừa chỗ cho thanh home indicator của iPhone
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  closeBtn: { padding: 4 },

  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  sheetItemActive: {
    backgroundColor: "#FFF7ED",
    marginHorizontal: -10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomColor: "transparent",
  },
  sheetItemText: { fontSize: 16, color: "#334155" },
  sheetItemTextActive: { color: "#EA580C", fontWeight: "600" },

  // --- LIST & CARD (Giữ nguyên) ---
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labInfo: { flex: 1 },
  labName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: { fontSize: 12, color: "#64748B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  slotList: { gap: 12 },
  slotContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  slotInfo: { marginBottom: 10 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timeText: { fontSize: 14, fontWeight: "600", color: "#334155" },
  bookerText: { fontSize: 13, color: "#64748B" },
  actionButtons: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
  },
  btnCheckIn: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  btnCheckOut: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  btnDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  btnText: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
  textDisabled: { color: "#94A3B8" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    justifyContent: "flex-end",
  },
  statusText: { fontSize: 12, color: "#16A34A", fontWeight: "500" },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94A3B8" },

  // --- ACTION MODAL STYLES (Check-in Form) ---
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  actionModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "70%",
  },
  modalSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  equipmentList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  eqItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  eqName: { fontSize: 13, color: "#334155" },
  eqQty: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  inputArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#0F172A",
  },
  confirmButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  confirmButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
