import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AvailabilityFilters from "../../../components/home/AvailabilityFilters";

// --- Types ---
interface Equipment {
  id: string;
  equipmentName: string;
  description: string | null;
  isAvailable: boolean;
  labRoomId: string;
  status: string;
}

interface LabRoom {
  id: string;
  labName: string;
  location: string;
  maximumLimit: number | null;
  mainManagerId: string;
  createdById: string;
  createdDate: string;
  isActive: boolean;
  equipments: Equipment[];
}

interface ApiResponse {
  items: LabRoom[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AvailabilityScreen() {
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("slot-1");

  // State Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabRoom | null>(null);

  // --- Mock Data ---
  useEffect(() => {
    async function loadLabs() {
      setIsLoading(true);
      try {
        const responseMock: ApiResponse = {
          items: [
            {
              id: "a4b1c2d3-e5f6-4789-a0b1-c2d3e4f5a6b7",
              labName: "Lab 1 - AI Research",
              location: "Tầng 1 - Khu A",
              maximumLimit: 30,
              mainManagerId: "f1e2d3c4-b5a6-c7d8-e9f0-a1b2c3d4e5f6",
              createdById: "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
              createdDate: "2023-10-01T08:00:00",
              isActive: true,
              equipments: [
                {
                  id: "9f8e7d6c-1",
                  equipmentName: "Máy chiếu Sony 4K",
                  description: "Dùng cho thuyết trình",
                  isAvailable: true,
                  labRoomId: "a4b1c2d3",
                  status: "Good",
                },
                {
                  id: "9f8e7d6c-2",
                  equipmentName: "PC High Performance",
                  description: "RTX 4090",
                  isAvailable: false,
                  labRoomId: "a4b1c2d3",
                  status: "Maintain",
                },
                {
                  id: "9f8e7d6c-3",
                  equipmentName: "Oscilloscope",
                  description: "Đo dao động",
                  isAvailable: true,
                  labRoomId: "a4b1c2d3",
                  status: "Good",
                },
              ],
            },
            {
              id: "b2b1c2d3-xxx",
              labName: "Lab 2 - Network",
              location: "Tầng 2",
              maximumLimit: null,
              mainManagerId: "manager-2",
              createdById: "creator-2",
              createdDate: "0001-01-01T00:00:00",
              isActive: false,
              equipments: [],
            },
          ],
        };
        setTimeout(() => {
          setLabs(responseMock.items);
          setIsLoading(false);
        }, 500);
      } catch (e) {
        console.error("Failed to load labs", e);
        setIsLoading(false);
      }
    }
    loadLabs();
  }, []);

  // --- Logic Modal ---
  const openDetail = (lab: LabRoom) => {
    setSelectedLab(lab);
    setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedLab(null);
  };

  // --- Render Functions ---
  const renderLabCard = ({ item }: { item: LabRoom }) => {
    const statusColor = item.isActive ? "#16A34A" : "#DC2626";
    const statusBg = item.isActive ? "#DCFCE7" : "#FEE2E2";
    const statusText = item.isActive ? "Hoạt động" : "Bảo trì";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.labName}</Text>
            <Text style={styles.cardLocation}>📍 {item.location}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardFooter}>
          <Text style={styles.cardInfo}>
            Thiết bị: {item.equipments.length}
          </Text>
          <TouchableOpacity
            style={styles.btnDetail}
            onPress={() => openDetail(item)}
          >
            <Text style={styles.btnDetailText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- POPUP CONTENT ---
  const renderPopupContent = () => {
    if (!selectedLab) return null;

    return (
      <View style={styles.popupContainer}>
        {/* Header Popup */}
        <View style={styles.popupHeader}>
          <Text style={styles.popupTitle}>Thông tin phòng</Text>
          <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.popupScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Box Thông tin chính */}
          <View style={styles.infoBox}>
            <Text style={styles.bigName}>{selectedLab.labName}</Text>
            <Text style={styles.detailRow}>
              📍 Vị trí: <Text style={styles.bold}>{selectedLab.location}</Text>
            </Text>
            <Text style={styles.detailRow}>
              👥 Sức chứa:{" "}
              <Text style={styles.bold}>
                {selectedLab.maximumLimit || "Không giới hạn"}
              </Text>
            </Text>
            <Text style={styles.detailRow}>
              📅 Ngày tạo:{" "}
              <Text style={styles.bold}>
                {selectedLab.createdDate === "0001-01-01T00:00:00"
                  ? "N/A"
                  : new Date(selectedLab.createdDate).toLocaleDateString()}
              </Text>
            </Text>
            <Text style={styles.detailRow} numberOfLines={1}>
              🔑 Quản lý ID:{" "}
              <Text style={styles.idText}>
                {selectedLab.mainManagerId.substring(0, 20)}...
              </Text>
            </Text>
          </View>

          {/* Danh sách thiết bị */}
          <Text style={styles.sectionHeader}>
            Danh sách thiết bị ({selectedLab.equipments.length})
          </Text>

          {selectedLab.equipments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có thiết bị nào.</Text>
            </View>
          ) : (
            selectedLab.equipments.map((eq) => (
              <View key={eq.id} style={styles.eqCard}>
                <View style={styles.eqRow}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={24}
                    color="#EA580C"
                    style={styles.eqIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eqName}>{eq.equipmentName}</Text>
                    <Text style={styles.eqId}>ID: {eq.id}</Text>
                    {eq.description && (
                      <Text style={styles.eqDesc}>Mô tả: {eq.description}</Text>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.eqStatus,
                        {
                          color:
                            eq.status === "Maintain" ? "#EA580C" : "#16A34A",
                        },
                      ]}
                    >
                      {eq.status}
                    </Text>
                    {!eq.isAvailable && (
                      <Text style={styles.notReady}>Không sẵn sàng</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  };

  if (isLoading)
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách Phòng Lab</Text>
        <Text style={styles.subtitle}>Quản lý trạng thái và thiết bị</Text>
      </View>

      <AvailabilityFilters
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        setSelectedDate={setSelectedDate}
        setSelectedSlot={setSelectedSlot}
      />

      <FlatList
        data={labs}
        renderItem={renderLabCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* --- MODAL POPUP --- */}
      <Modal
        animationType="fade" // Hiệu ứng mờ dần
        transparent={true} // QUAN TRỌNG: Cho phép nhìn xuyên thấu nền
        visible={modalVisible}
        onRequestClose={closeDetail}
      >
        {/* Lớp phủ mờ (Bấm ra ngoài thì đóng) */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetail}
        >
          {/* Chặn sự kiện bấm vào nội dung popup để không bị đóng */}
          <TouchableWithoutFeedback>
            {renderPopupContent()}
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED", paddingTop: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card List Style
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  cardLocation: { fontSize: 13, color: "#64748B", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: { color: "#64748B", fontSize: 14 },
  btnDetail: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnDetailText: { color: "white", fontWeight: "600", fontSize: 13 },

  // --- POPUP STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Màu đen mờ 50%
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    width: "90%", // Chiếm 90% chiều ngang màn hình
    maxHeight: "80%", // Chiếm tối đa 80% chiều dọc (để tránh bị dài quá)
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 0, // Để scroll full chiều ngang
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  popupTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  closeBtn: { padding: 4 },

  popupScroll: { paddingHorizontal: 20 }, // Nội dung bên trong mới padding

  // Styles Content bên trong Popup
  infoBox: {
    backgroundColor: "#FFFAF5", // Nền cam nhạt cho box thông tin
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  bigName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#EA580C",
    marginBottom: 12,
  },
  detailRow: { fontSize: 14, color: "#475569", marginBottom: 8 },
  bold: { fontWeight: "700", color: "#1E293B" },
  idText: { fontSize: 12, color: "#94A3B8" },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },

  // Equipment Card Mini
  eqCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // Border bên trái màu cam
    borderLeftWidth: 4,
    borderLeftColor: "#EA580C",
  },
  eqRow: { flexDirection: "row", alignItems: "flex-start" },
  eqIcon: { marginRight: 12, marginTop: 2 },
  eqName: { fontSize: 14, fontWeight: "700", color: "#334155" },
  eqId: { fontSize: 11, color: "#94A3B8", marginBottom: 4 },
  eqDesc: { fontSize: 12, color: "#64748B", fontStyle: "italic" },
  eqStatus: { fontSize: 12, fontWeight: "700" },
  notReady: { fontSize: 10, color: "#EF4444" },

  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },
});
