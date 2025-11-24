import { useRouter } from "expo-router";
import { Bell, Check, ChevronRight, Clock4 } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
// Không cần import SecureStore ở đây nữa vì api.ts đã lo
// import * as SecureStore from "expo-secure-store";

// 🟢 1. IMPORT API CLIENT (Đảm bảo đường dẫn đúng với file api.ts của bạn)
import apiClient from "../../../utils/api";

// --- CẤU HÌNH API ---
// Chỉ cần endpoint, Base URL đã có trong apiClient
const API_ENDPOINT = "/api/Notifications";

// --- INTERFACES (GIỮ NGUYÊN) ---
interface ApiNotification {
  id: string;
  title: string;
  message: string;
  dataPayload: string;
  isRead: boolean;
  createdAt?: string;
  createdDt?: string;
}

interface ApiResponse {
  items: ApiNotification[];
  totalItemsCount: number;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "actionable_reschedule";
  affectedBooking?: {
    originalBookingId: string;
    roomId: string;
    roomName: string;
    slotsLostCount: number;
  };
}

// --- DỮ LIỆU CỐ ĐỊNH (GIỮ NGUYÊN) ---
const ACTIONABLE_NOTIFICATION: NotificationItem = {
  id: "100",
  title: "Yêu cầu dời lịch của bạn!",
  description:
    "Lịch của bạn tại phòng Lab A101 (Slot 1, 04/10/2025) đã bị trùng với một sự kiện ưu tiên. Vui lòng chọn Hủy lịch hoặc Đổi sang một slot khác.",
  time: "03/10/2025 09:15",
  read: false,
  type: "actionable_reschedule",
  affectedBooking: {
    originalBookingId: "booking123",
    roomId: "lab1",
    roomName: "Phòng Lab A101",
    slotsLostCount: 1,
  },
};

// --- HELPER FORMAT DATE (GIỮ NGUYÊN) ---
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  } catch (e) {
    return dateString || "";
  }
};

// --- COMPONENT CARD (GIỮ NGUYÊN) ---
function NotificationCard({
  notification,
  onCancel,
  onReschedule,
  onMarkRead,
}: {
  notification: NotificationItem;
  onCancel: (id: string) => void;
  onReschedule: (id: string, booking: any) => void;
  onMarkRead: (id: string) => void;
}) {
  const isActionable =
    notification.type === "actionable_reschedule" && !notification.read;

  return (
    <TouchableOpacity
      style={[styles.card, notification.read && styles.cardRead]}
      onPress={() => {
        onMarkRead(notification.id);
        if (isActionable) {
          onReschedule(notification.id, notification.affectedBooking);
        }
      }}
    >
      <View
        style={[
          styles.iconContainer,
          notification.read && styles.iconContainerRead,
          isActionable && styles.iconContainerActionable,
        ]}
      >
        {notification.read ? (
          <Check size={20} color="#94a3b8" />
        ) : (
          <Bell size={20} color="#ea580c" />
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardTitle,
              notification.read && styles.cardTitleRead,
            ]}
          >
            {notification.title}
          </Text>
          <ChevronRight size={16} color="#94a3b8" />
        </View>
        <Text
          style={[
            styles.cardDescription,
            notification.read && styles.cardDescRead,
          ]}
        >
          {notification.description}
        </Text>

        {isActionable && (
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              onPress={() => onCancel(notification.id)}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Hủy lịch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                onReschedule(notification.id, notification.affectedBooking)
              }
              style={[styles.actionButton, styles.rescheduleButton]}
            >
              <Text
                style={[styles.actionButtonText, styles.rescheduleButtonText]}
              >
                Đổi lịch
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Clock4 size={14} color="#94a3b8" />
          <Text style={styles.cardTime}>{notification.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --- MAIN SCREEN ---
export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    ACTIONABLE_NOTIFICATION,
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. LẤY DANH SÁCH THÔNG BÁO (DÙNG API CLIENT) ---
  const fetchNotifications = async () => {
    try {
      // 🟢 KHÔNG CẦN: Lấy token thủ công. apiClient tự làm.

      // 🟢 THAY ĐỔI: Dùng apiClient.get
      // Axios cho phép truyền params dưới dạng object, sạch hơn query string
      const response = await apiClient.get<ApiResponse>(API_ENDPOINT, {
        params: {
          PageNumber: 1,
          PageSize: 5,
        },
      });

      // Axios trả về data nằm trong response.data
      const data = response.data;

      if (data && data.items) {
        const mappedData: NotificationItem[] = data.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.message,
          time: formatDate(item.createdAt || item.createdDt),
          read: item.isRead,
          type: "info",
        }));
        setNotifications([ACTIONABLE_NOTIFICATION, ...mappedData]);
      }
    } catch (error: any) {
      // Interceptor của apiClient sẽ lo việc refresh token hoặc logout nếu cần.
      // Ở đây ta chỉ log lỗi nếu nó không phải 401 (vì 401 interceptor xử lý rồi)
      console.error("Lỗi khi tải thông báo:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- 2. HÀM GỌI API ĐÁNH DẤU ĐÃ ĐỌC (DÙNG API CLIENT PUT) ---
  const handleMarkAsRead = async (id: string) => {
    const targetItem = notifications.find((i) => i.id === id);
    if (targetItem?.read) return;

    // 2.1. Optimistic Update (Cập nhật UI trước)
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    if (id === "100") return;

    // 2.2. Gọi API ngầm
    try {
      // 🟢 THAY ĐỔI: Dùng apiClient.put
      const url = `${API_ENDPOINT}/${id}/read`;
      console.log("Marking as read:", url);

      // apiClient tự động gắn Authorization Header
      await apiClient.put(url);

      console.log("Marked read success");
    } catch (error) {
      console.error("API Mark Read Error:", error);
      // Nếu cần, có thể revert UI lại ở đây
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const unread = notifications.filter((item) => !item.read);
  const list = activeTab === "all" ? notifications : unread;

  const handleCancel = (id: string) => {
    Alert.alert("Xác nhận", "Bạn muốn hủy lịch này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có",
        style: "destructive",
        onPress: () => handleMarkAsRead(id),
      },
    ]);
  };

  const handleReschedule = (id: string, booking: any) => {
    handleMarkAsRead(id);
    router.push({
      pathname: "/book/reschedule-slots" as any,
      params: {
        roomId: booking.roomId,
        roomName: booking.roomName,
        slotsToPick: booking.slotsLostCount || 1,
        bookingId: booking.originalBookingId,
      },
    });
  };

  const renderContent = () => {
    if (loading && !refreshing)
      return (
        <ActivityIndicator
          size="large"
          color="#f97316"
          style={{ marginTop: 40 }}
        />
      );
    if (list.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Không có thông báo</Text>
        </View>
      );
    }
    return list.map((notification) => (
      <NotificationCard
        key={notification.id}
        notification={notification}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
        onMarkRead={handleMarkAsRead}
      />
    ));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#f97316"]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
        <Text style={styles.subtitle}>Theo dõi mọi cập nhật về lịch</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("all")}
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("unread")}
          style={[styles.tab, activeTab === "unread" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "unread" && styles.activeTabText,
            ]}
          >
            Chưa đọc
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>{renderContent()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff7ed" },
  contentContainer: { padding: 16, paddingBottom: 120 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: { backgroundColor: "#f97316" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  activeTabText: { color: "white" },
  listContainer: { marginTop: 16, gap: 12 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  cardRead: { backgroundColor: "#f8fafc", borderColor: "#f1f5f9" },
  iconContainer: {
    height: 40,
    width: 40,
    flexShrink: 0,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  iconContainerRead: { backgroundColor: "#f1f5f9" },
  iconContainerActionable: { borderColor: "#ea580c", borderWidth: 1 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1e293b" },
  cardTitleRead: { color: "#64748b" },
  cardDescription: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  cardDescRead: { color: "#94a3b8" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardTime: { fontSize: 12, color: "#94a3b8" },
  actionButtonContainer: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: { fontSize: 14, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: { color: "#334155" },
  rescheduleButton: { backgroundColor: "#ea580c" },
  rescheduleButtonText: { color: "white" },
  emptyStateContainer: {
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  emptyStateTitle: { fontSize: 14, fontWeight: "600", color: "#c2410c" },
});
