import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AvailabilityFilters from "../../../components/home/AvailabilityFilters";
import apiClient from "../../../utils/api";

export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  label: string;
}

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
  status?: string;
  equipments: Equipment[];
}

interface ApiResponse {
  items: LabRoom[];
  totalPages: number;
  totalItemsCount: number;
}

export default function AvailabilityScreen() {
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE SLOT & FILTER ---
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // --- MODAL STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabRoom | null>(null);

  // 1. GỌI API LẤY DANH SÁCH SLOT
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await apiClient.get("/api/Slot");
        const data = response.data;
        let slotList: Slot[] = [];

        // Xử lý dữ liệu trả về (mảng hoặc object chứa items)
        if (Array.isArray(data)) {
          slotList = data;
        } else if (data && Array.isArray(data.items)) {
          slotList = data.items;
        }

        // 🟢 SẮP XẾP THEO SLOT INDEX (1 -> 4)
        slotList.sort((a, b) => a.slotIndex - b.slotIndex);

        setSlots(slotList);

        // 🟢 AUTO CHỌN SLOT ĐẦU TIÊN (Slot 1)
        if (slotList.length > 0) {
          setSelectedSlot(slotList[0].id);
        }
      } catch (error) {
        console.error("❌ Lỗi lấy danh sách Slot:", error);
      }
    };
    fetchSlots();
  }, []);

  // 2. GỌI API TÌM PHÒNG
  const fetchLabs = useCallback(async () => {
    // Chỉ gọi khi đã có Slot ID (để tránh gọi API thừa lúc chưa load xong slot)
    if (!selectedSlot) return;

    setIsLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0];

      const params: any = {
        PageNumber: 1,
        PageSize: 10,
        FilterDate: formattedDate,
        FilterSlotId: selectedSlot, // Luôn gửi Slot ID
      };

      console.log("🚀 Tìm phòng với params:", params);

      const response = await apiClient.get<ApiResponse>("/api/LabRooms", {
        params: params,
      });

      if (response.data && response.data.items) {
        setLabs(response.data.items);
      } else {
        setLabs([]);
      }
    } catch (error: any) {
      console.error("❌ Lỗi API LabRooms:", error);
      setLabs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedSlot]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  // --- LOGIC MODAL ---
  const openDetail = (lab: LabRoom) => {
    setSelectedLab(lab);
    setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedLab(null);
  };

  // --- RENDER ITEMS ---
  const renderLabCard = ({ item }: { item: LabRoom }) => {
    const isAvailable = item.status === "Available";
    const statusColor = isAvailable ? "#16A34A" : "#DC2626";
    const statusBg = isAvailable ? "#DCFCE7" : "#FEE2E2";
    const statusText = isAvailable ? "Còn trống" : "Đã được đặt";

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
            Thiết bị: {item.equipments ? item.equipments.length : 0}
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

  // ... (Phần renderPopupContent giữ nguyên như cũ)
  const renderPopupContent = () => {
    if (!selectedLab) return null;
    const dateCreated = selectedLab.createdDate
      ? new Date(selectedLab.createdDate).toLocaleDateString("vi-VN")
      : "N/A";

    return (
      <View style={styles.popupContainer}>
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
          <View style={styles.infoBox}>
            <Text style={styles.bigName}>{selectedLab.labName}</Text>
            <Text style={styles.detailRow}>
              📍 Vị trí: <Text style={styles.bold}>{selectedLab.location}</Text>
            </Text>
            <Text style={styles.detailRow}>
              👥 Sức chứa:{" "}
              <Text style={styles.bold}>
                {selectedLab.maximumLimit || "Vô hạn"}
              </Text>
            </Text>
            <Text style={styles.detailRow}>
              📅 Ngày tạo: <Text style={styles.bold}>{dateCreated}</Text>
            </Text>
          </View>

          <Text style={styles.sectionHeader}>
            Danh sách thiết bị ({selectedLab.equipments?.length || 0})
          </Text>

          {!selectedLab.equipments || selectedLab.equipments.length === 0 ? (
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
                    {eq.description && (
                      <Text style={styles.eqDesc}>{eq.description}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.eqStatus,
                      {
                        color: eq.status === "Maintain" ? "#EA580C" : "#16A34A",
                      },
                    ]}
                  >
                    {eq.status}
                  </Text>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  };

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
        slots={slots}
      />

      {isLoading && labs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={labs}
          renderItem={renderLabCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchLabs}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Không tìm thấy phòng nào phù hợp.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeDetail}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetail}
        >
          <TouchableWithoutFeedback>
            {renderPopupContent()}
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF7ED", paddingTop: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 16,
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
  popupScroll: { paddingHorizontal: 20 },
  infoBox: {
    backgroundColor: "#FFFAF5",
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  eqCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    borderLeftColor: "#EA580C",
  },
  eqRow: { flexDirection: "row", alignItems: "flex-start" },
  eqIcon: { marginRight: 12, marginTop: 2 },
  eqName: { fontSize: 14, fontWeight: "700", color: "#334155" },
  eqDesc: { fontSize: 12, color: "#64748B", fontStyle: "italic" },
  eqStatus: { fontSize: 12, fontWeight: "700" },
  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },
});
