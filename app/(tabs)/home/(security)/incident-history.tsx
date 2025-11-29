import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar as CalendarIcon,
  Flame,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Clock,
  HelpCircle,
} from "lucide-react-native";

// --- 1. ĐỊNH NGHĨA TYPES ---
export type IncidentType =
  | "Fire"
  | "PowerOutage"
  | "EquipmentFailure"
  | "SecurityIssue"
  | "Opened"
  | "Closed"
  | "Other";

export type LevelOfImportance = "Low" | "Medium" | "High";

export interface Incident {
  id: string;
  labRoomId: string;
  labRoomName: string;
  reportedById: string;
  reportedByName: string;
  slotId: string;
  type: IncidentType;
  description: string;
  isResolved: boolean;
  createdAt: string;
  importanceLevel: LevelOfImportance;
}

// --- 2. MOCK DATA ---
const ROOMS = [
  { id: "all", name: "Tất cả" },
  { id: "lab1", name: "Lab A101" },
  { id: "lab2", name: "Lab B202" },
  { id: "lab3", name: "Lab C303" },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "1",
    labRoomId: "lab1",
    labRoomName: "Lab A101",
    reportedById: "user1",
    reportedByName: "Nguyễn Văn Bảo vệ",
    slotId: "slot-guid-1",
    type: "PowerOutage",
    description: "Mất điện toàn bộ dãy bàn số 3.",
    isResolved: false,
    createdAt: new Date().toISOString(),
    importanceLevel: "High",
  },
  {
    id: "2",
    labRoomId: "lab2",
    labRoomName: "Lab B202",
    reportedById: "user2",
    reportedByName: "Trần Văn An",
    slotId: "slot-guid-2",
    type: "EquipmentFailure",
    description: "Chuột máy tính số 15 bị hỏng.",
    isResolved: true,
    createdAt: new Date().toISOString(),
    importanceLevel: "Low",
  },
  {
    id: "3",
    labRoomId: "lab1",
    labRoomName: "Lab A101",
    reportedById: "user1",
    reportedByName: "Nguyễn Văn Bảo vệ",
    slotId: "slot-guid-3",
    type: "SecurityIssue",
    description: "Phát hiện cửa sổ chưa khóa sau giờ học.",
    isResolved: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    importanceLevel: "Medium",
  },
];

// --- 3. HELPER FUNCTIONS ---
const getTypeConfig = (type: IncidentType) => {
  switch (type) {
    case "Fire":
      return {
        label: "Cháy nổ",
        icon: <Flame size={18} color="#DC2626" />,
        color: "#FEE2E2",
      };
    case "PowerOutage":
      return {
        label: "Cúp điện",
        icon: <Zap size={18} color="#D97706" />,
        color: "#FEF3C7",
      };
    case "EquipmentFailure":
      return {
        label: "Hỏng thiết bị",
        icon: <AlertTriangle size={18} color="#EA580C" />,
        color: "#FFEDD5",
      };
    case "SecurityIssue":
      return {
        label: "An ninh",
        icon: <ShieldAlert size={18} color="#7C3AED" />,
        color: "#EDE9FE",
      };
    case "Opened":
      return {
        label: "Mở cửa",
        icon: <CheckCircle2 size={18} color="#16A34A" />,
        color: "#DCFCE7",
      };
    case "Closed":
      return {
        label: "Đóng cửa",
        icon: <XCircle size={18} color="#475569" />,
        color: "#F1F5F9",
      };
    default:
      return {
        label: "Khác",
        icon: <HelpCircle size={18} color="#64748B" />,
        color: "#F1F5F9",
      };
  }
};

const getImportanceColor = (level: LevelOfImportance) => {
  switch (level) {
    case "High":
      return { bg: "#FEE2E2", text: "#DC2626" };
    case "Medium":
      return { bg: "#FEF9C3", text: "#CA8A04" };
    case "Low":
      return { bg: "#F1F5F9", text: "#475569" };
    default:
      return { bg: "#F1F5F9", text: "#475569" };
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// --- 4. COMPONENT CHÍNH ---
export default function IncidentHistoryScreen() {
  const router = useRouter();

  // State Filter
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState("all");

  // State Data
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);

  // State Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  // Logic Filter
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const isSameDate =
        itemDate.getDate() === selectedDate.getDate() &&
        itemDate.getMonth() === selectedDate.getMonth() &&
        itemDate.getFullYear() === selectedDate.getFullYear();

      const isSameRoom =
        selectedRoomId === "all" || item.labRoomId === selectedRoomId;

      return isSameDate && isSameRoom;
    });
  }, [incidents, selectedDate, selectedRoomId]);

  // Logic Date Navigation
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Logic Edit
  const openDetail = (incident: Incident) => {
    setEditingIncident({ ...incident });
    setModalVisible(true);
  };

  const saveChanges = () => {
    if (!editingIncident) return;

    const updatedList = incidents.map((i) =>
      i.id === editingIncident.id ? editingIncident : i
    );
    setIncidents(updatedList);
    setModalVisible(false);
    Alert.alert("Thành công", "Đã cập nhật thông tin sự cố.");
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Incident }) => {
    const typeConf = getTypeConfig(item.type);
    const impConf = getImportanceColor(item.importanceLevel);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
            {typeConf.icon}
            <Text style={styles.typeText}>{typeConf.label}</Text>
          </View>
          <View style={[styles.impBadge, { backgroundColor: impConf.bg }]}>
            <Text style={[styles.impText, { color: impConf.text }]}>
              {item.importanceLevel}
            </Text>
          </View>
        </View>

        <Text style={styles.roomName} numberOfLines={1}>
          {item.labRoomName}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.infoText}>{formatTime(item.createdAt)}</Text>
          </View>
          {item.isResolved ? (
            <View style={styles.statusResolved}>
              <CheckCircle2 size={14} color="#16A34A" />
              <Text style={styles.statusTextResolved}>Đã xử lý</Text>
            </View>
          ) : (
            <View style={styles.statusPending}>
              <AlertTriangle size={14} color="#B45309" />
              <Text style={styles.statusTextPending}>Chưa xử lý</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử sự cố</Text>
        <Text style={styles.headerSub}>
          Theo dõi và cập nhật các vấn đề an ninh
        </Text>
      </View>

      {/* FILTERS */}
      <View style={styles.filterSection}>
        {/* Date Picker Simulator */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDate(-1)}
            style={styles.iconButton}
          >
            <ChevronLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <CalendarIcon size={16} color="#EA580C" />
            <Text style={styles.dateText}>
              {formatDate(selectedDate.toISOString())}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => changeDate(1)}
            style={styles.iconButton}
          >
            <ChevronRight size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Room Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomFilterList}
        >
          {ROOMS.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomChip,
                selectedRoomId === room.id && styles.roomChipActive,
              ]}
              onPress={() => setSelectedRoomId(room.id)}
            >
              <Text
                style={[
                  styles.roomChipText,
                  selectedRoomId === room.id && styles.roomChipTextActive,
                ]}
              >
                {room.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredIncidents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CheckCircle2 size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              Không có sự cố nào trong ngày này.
            </Text>
          </View>
        }
      />

      {/* MODAL EDIT/DETAIL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết sự cố</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {editingIncident && (
              <ScrollView style={styles.modalBody}>
                {/* Read-only Info */}
                <View style={styles.readOnlyBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.label}>Phòng:</Text>
                    <Text style={styles.value}>
                      {editingIncident.labRoomName}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.label}>Người báo:</Text>
                    <Text style={styles.value}>
                      {editingIncident.reportedByName}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.label}>Thời gian:</Text>
                    <Text style={styles.value}>
                      {formatTime(editingIncident.createdAt)} -{" "}
                      {formatDate(editingIncident.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Editable Fields */}
                <Text style={styles.inputLabel}>Mô tả sự cố</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  value={editingIncident.description}
                  onChangeText={(text) =>
                    setEditingIncident({
                      ...editingIncident,
                      description: text,
                    })
                  }
                />

                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Đã giải quyết?</Text>
                  <Switch
                    value={editingIncident.isResolved}
                    onValueChange={(val) =>
                      setEditingIncident({
                        ...editingIncident,
                        isResolved: val,
                      })
                    }
                    trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }}
                    thumbColor={
                      editingIncident.isResolved ? "#16A34A" : "#94A3B8"
                    }
                  />
                </View>

                <Text style={styles.inputLabel}>Mức độ quan trọng</Text>
                <View style={styles.impSelector}>
                  {(["Low", "Medium", "High"] as LevelOfImportance[]).map(
                    (level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.impOption,
                          editingIncident.importanceLevel === level &&
                            styles.impOptionSelected,
                          editingIncident.importanceLevel === level && {
                            borderColor: getImportanceColor(level).text,
                          },
                        ]}
                        onPress={() =>
                          setEditingIncident({
                            ...editingIncident,
                            importanceLevel: level,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.impOptionText,
                            editingIncident.importanceLevel === level && {
                              color: getImportanceColor(level).text,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveChanges}
                >
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  // 🔥 MÀU NỀN CHÍNH
  container: { flex: 1, backgroundColor: "#FFF7ED" },

  // 🔥 HEADER MỚI
  header: {
    padding: 16,
    backgroundColor: "#FFF7ED", // Cùng màu nền
    // Bỏ border
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },

  // Filters (Nổi bật trên nền kem)
  filterSection: { backgroundColor: "#FFF7ED", paddingBottom: 12 },

  // Date Nav (Nút trắng nổi lên)
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "white", // Nền trắng
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateDisplay: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  // Room Chips
  roomFilterList: { paddingHorizontal: 16, gap: 8 },
  roomChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "white", // Nền trắng khi chưa chọn
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roomChipActive: {
    backgroundColor: "#FFF7ED", // Hoặc #FFEDD5 để đậm hơn
    borderColor: "#EA580C",
  },
  roomChipText: { fontSize: 13, color: "#64748B" },
  roomChipTextActive: { color: "#EA580C", fontWeight: "600" },

  // List
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 14 },

  // Card Item (Giữ nền trắng)
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  impBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  impText: { fontSize: 11, fontWeight: "700" },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  desc: { fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 12, color: "#64748B" },
  statusResolved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTextResolved: { fontSize: 11, color: "#16A34A", fontWeight: "600" },
  statusPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTextPending: { fontSize: 11, color: "#B45309", fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  modalBody: { marginBottom: 20 },
  readOnlyBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, color: "#64748B" },
  value: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    fontSize: 14,
    backgroundColor: "white",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  impSelector: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  impOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "white",
  },
  impOptionSelected: { backgroundColor: "#F8FAFC", borderWidth: 2 },
  impOptionText: { fontSize: 13, color: "#64748B" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    padding: 14,
    borderRadius: 12,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
