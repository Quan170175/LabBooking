import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Calendar,
  MapPin, // Icon cho Phòng / Địa điểm
  Monitor, // Icon cho Thiết bị
  FileText,
  History,
} from "lucide-react-native";

// 🟢 IMPORT API CLIENT
import apiClient from "../../../../utils/api";

// --- TYPES ---
type MaintenanceType = "room" | "equipment";

interface MaintenanceRecord {
  id: string;
  targetName: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  createdDate: string;
}

export default function MaintenanceHistoryScreen() {
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<MaintenanceType>("room");
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- API HANDLER ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 👇 DỮ LIỆU MOCK (Đã cập nhật Location)
      await new Promise((r) => setTimeout(r, 800));

      if (activeTab === "room") {
        setData([
          {
            id: "1",
            targetName: "Phòng Lab AI & IoT (A301)",
            location: "Tòa nhà Alpha - Tầng 3",
            startTime: "2025-10-25T08:00:00",
            endTime: "2025-10-25T12:00:00",
            description: "Bảo trì hệ thống điện định kỳ.",
            createdDate: "2025-10-24T10:00:00",
          },
          {
            id: "2",
            targetName: "Hội trường B",
            location: "Khu Giảng đường Beta",
            startTime: "2025-10-28T13:00:00",
            endTime: "2025-10-28T17:00:00",
            description: "Sửa chữa trần thạch cao bị thấm nước.",
            createdDate: "2025-10-26T09:30:00",
          },
        ]);
      } else {
        setData([
          {
            id: "101",
            targetName: "Máy chiếu Sony 4K",
            location: "Tại: Lab A301", // 🟢 Location của thiết bị
            startTime: "2025-11-01T09:00:00",
            endTime: "2025-11-01T11:00:00",
            description: "Thay bóng đèn máy chiếu do bị mờ.",
            createdDate: "2025-10-30T14:20:00",
          },
          {
            id: "102",
            targetName: "PC Giảng viên (Dell)",
            location: "Tại: Lab B202", // 🟢 Location của thiết bị
            startTime: "2025-11-02T08:00:00",
            endTime: "2025-11-02T10:00:00",
            description: "Cài đặt lại Windows và driver mạng.",
            createdDate: "2025-10-31T16:45:00",
          },
        ]);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // --- HELPER FORMAT DATE ---
  const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = `${s.getDate().toString().padStart(2, "0")}/${(
      s.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${s.getFullYear()}`;
    const timeStart = `${s.getHours()}:${s
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const timeEnd = `${e.getHours()}:${e
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${dateStr} • ${timeStart} - ${timeEnd}`;
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: MaintenanceRecord }) => {
    const isRoom = activeTab === "room";

    return (
      <View style={styles.card}>
        {/* HEADER CARD: Tên + Địa điểm */}
        <View style={styles.cardHeader}>
          <View
            style={[styles.iconBox, isRoom ? styles.bgOrange : styles.bgBlue]}
          >
            {isRoom ? (
              <MapPin size={20} color="#EA580C" />
            ) : (
              <Monitor size={20} color="#2563EB" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.targetName}>{item.targetName}</Text>

            {/* 🟢 HIỂN THỊ LOCATION CHO CẢ 2 LOẠI */}
            {item.location && (
              <View style={styles.locationRow}>
                <MapPin size={12} color="#64748B" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Nội dung */}
        <View style={styles.contentRow}>
          <FileText size={16} color="#64748B" style={{ marginTop: 2 }} />
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Thời gian */}
        <View style={[styles.contentRow, { marginTop: 8 }]}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.timeText}>
            {formatTimeRange(item.startTime, item.endTime)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SCREEN */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Bảo trì</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "room" && styles.activeTab]}
          onPress={() => setActiveTab("room")}
        >
          <MapPin
            size={16}
            color={activeTab === "room" ? "white" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "room" && styles.activeTabText,
            ]}
          >
            Phòng Lab
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "equipment" && styles.activeTab]}
          onPress={() => setActiveTab("equipment")}
        >
          <Monitor
            size={16}
            color={activeTab === "equipment" ? "white" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "equipment" && styles.activeTabText,
            ]}
          >
            Thiết bị
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <History size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>Chưa có lịch sử bảo trì nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // Header
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
  backButton: { padding: 4 },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  activeTab: { backgroundColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "white" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Card Style
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bgOrange: { backgroundColor: "#FFF7ED" },
  bgBlue: { backgroundColor: "#EFF6FF" },

  targetName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },

  // 🟢 LOCATION STYLES MỚI
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    flex: 1, // Để text tự xuống dòng nếu dài
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "500" },
});
