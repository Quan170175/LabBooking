import { useFocusEffect, useRouter } from "expo-router";
import { AlertTriangle, Bell, Check, Clock4 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import apiClient from "@/utils/api";

const API_ENDPOINT = "/api/Notifications";

interface NotificationPayload {
  type: string;
  consentRequestId?: string;
  bookingTitle?: string;
  action?: string;
  consentStatus?: string;
}

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  dataPayload: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: string;
  dataPayload?: string;
  actionData?: {
    consentId: string;
    bookingTitle: string;
  };
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } catch (e) {
    return dateString || "";
  }
};

function NotificationCard({
  notification,
  onCancel,
  onReschedule,
  onMarkRead,
}: {
  notification: NotificationItem;
  onCancel: (id: string, consentId?: string) => void;
  onReschedule: (id: string, consentId?: string) => void;
  onMarkRead: (id: string) => void;
}) {
  let consentStatus = "Pending";
  try {
    if (notification.dataPayload) {
      const parsed = JSON.parse(notification.dataPayload);
      if (parsed.consentStatus) {
        consentStatus = parsed.consentStatus;
      }
    }
  } catch (e) {}

  // 2. Logic hiển thị
  const isRead = notification.read;

  const showActions =
    consentStatus === "Pending" &&
    notification.type === "actionable_reschedule";

  const showWaiting = consentStatus === "Rescheduled";

  return (
    <TouchableOpacity
      style={[styles.card, isRead && styles.cardRead]}
      onPress={() => {
        if (!showActions && !showWaiting) {
          onMarkRead(notification.id);
        }
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          isRead && styles.iconContainerRead,
          (showActions || showWaiting) && styles.iconContainerActionable,
        ]}
      >
        {showActions ? (
          <AlertTriangle size={20} color="#EA580C" />
        ) : showWaiting ? (
          <Clock4 size={20} color="#D97706" />
        ) : isRead ? (
          <Check size={20} color="#94a3b8" />
        ) : (
          <Bell size={20} color="#ea580c" />
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isRead && styles.cardTitleRead]}>
            {notification.title}
          </Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={[styles.cardDescription, isRead && styles.cardDescRead]}>
          {notification.description}
        </Text>

        {/* --- NÚT BẤM (Pending / Rejected) --- */}
        {showActions && notification.actionData && (
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              onPress={() =>
                onCancel(notification.id, notification.actionData?.consentId)
              }
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Hủy slot cũ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onReschedule(
                  notification.id,
                  notification.actionData?.consentId
                )
              }
              style={[styles.actionButton, styles.rescheduleButton]}
            >
              <Text
                style={[styles.actionButtonText, styles.rescheduleButtonText]}
              >
                Chọn lại lịch
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- THÔNG BÁO CHỜ (Rescheduled) --- */}
        {showWaiting && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>
              ⏳ Đã gửi yêu cầu đổi. Vui lòng chờ duyệt.
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Clock4 size={12} color="#94a3b8" />
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get(API_ENDPOINT, {
        params: { PageNumber: 1, PageSize: 10 },
      });

      const responseData = response.data;
      const items = responseData?.data?.items || responseData?.items || [];

      console.log("📥 Loaded notifications:", items.length);

      if (Array.isArray(items)) {
        const mappedData: NotificationItem[] = items.map(
          (item: ApiNotification) => {
            let payloadObj: NotificationPayload | null = null;
            let uiType: "info" | "actionable_reschedule" = "info";

            try {
              if (item.dataPayload) {
                payloadObj = JSON.parse(item.dataPayload);
                if (payloadObj?.type === "OVERRIDE_CONSENT") {
                  uiType = "actionable_reschedule";
                }
              }
            } catch (e) {
              console.log("Payload parse error:", item.id);
            }

            return {
              id: item.id,
              title: item.title,
              description: item.message,
              time: formatDate(item.createdAt),
              read: item.isRead,
              type: uiType,
              dataPayload: item.dataPayload || undefined,
              actionData: payloadObj?.consentRequestId
                ? {
                    consentId: payloadObj.consentRequestId,
                    bookingTitle: payloadObj.bookingTitle || "",
                  }
                : undefined,
            };
          }
        );

        setNotifications(mappedData);
      }
    } catch (error: any) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // --- ACTIONS ---
  const handleMarkAsRead = async (id: string) => {
    const target = notifications.find((i) => i.id === id);
    if (target?.read) return;

    setNotifications((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i))
    );

    try {
      await apiClient.put(`${API_ENDPOINT}/${id}/read`);
    } catch (error) {
      console.error("Mark read failed:", error);
    }
  };

  const handleCancel = (notiId: string, consentId?: string) => {
    if (!consentId) return;

    Alert.alert(
      "Xác nhận hủy",
      "Bạn chấp nhận mất các slot bị trùng và không chọn lịch bù?",
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: "Đồng ý Hủy",
          style: "destructive",
          onPress: async () => {
            setNotifications((prev) =>
              prev.map((i) => (i.id === notiId ? { ...i, read: true } : i))
            );

            try {
              await Promise.all([
                apiClient.post("/api/BookingConsent/resolve", {
                  consentId: consentId,
                  action: "Cancel",
                }),
                apiClient.put(`${API_ENDPOINT}/${notiId}/read`),
              ]);

              Alert.alert("Thành công", "Đã xác nhận hủy lịch.");
              fetchNotifications();
            } catch (e: any) {
              // Rollback
              setNotifications((prev) =>
                prev.map((i) => (i.id === notiId ? { ...i, read: false } : i))
              );
              Alert.alert("Lỗi", "Không thể thực hiện tác vụ.");
            }
          },
        },
      ]
    );
  };

  const handleReschedule = (notiId: string, consentId?: string) => {
    if (!consentId) return;
    router.push({
      pathname: "/book/reschedule-slots",
      params: { consentId: consentId, notificationId: notiId },
    } as any);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const renderContent = () => {
    const list =
      activeTab === "all"
        ? notifications
        : notifications.filter((i) => !i.read);

    if (loading && !refreshing && list.length === 0)
      return (
        <ActivityIndicator
          size="large"
          color="#f97316"
          style={{ marginTop: 40 }}
        />
      );

    if (list.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có thông báo nào.</Text>
        </View>
      );
    }

    return list.map((item) => (
      <NotificationCard
        key={item.id}
        notification={item}
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
  contentContainer: { padding: 16, paddingBottom: 100 },
  header: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 99,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 99, alignItems: "center" },
  activeTab: { backgroundColor: "#f97316" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "white" },

  listContainer: { marginTop: 16, gap: 12 },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94a3b8", fontSize: 14 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffedd5",
    shadowColor: "#ea580c",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRead: {
    backgroundColor: "#f8fafc",
    borderColor: "#f1f5f9",
    shadowOpacity: 0,
  },

  iconContainer: {
    height: 40,
    width: 40,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerRead: { backgroundColor: "#f1f5f9" },
  iconContainerActionable: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },

  cardContent: { flex: 1, gap: 6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", flex: 1 },
  cardTitleRead: { color: "#64748b", fontWeight: "600" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ea580c",
    marginTop: 6,
  },

  cardDescription: { fontSize: 14, color: "#334155", lineHeight: 20 },
  cardDescRead: { color: "#94a3b8" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardTime: { fontSize: 12, color: "#94a3b8" },

  actionButtonContainer: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  cancelButtonText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  actionButtonText: { fontSize: 13, fontWeight: "600" },
  rescheduleButton: { backgroundColor: "#ea580c" },
  rescheduleButtonText: { color: "white", fontSize: 13, fontWeight: "600" },

  waitingContainer: {
    marginTop: 8,
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  waitingText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "500",
  },
});
