import { useRouter } from "expo-router";
import { Bell, Check, ChevronRight, Clock4 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Cập nhật interface
interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "actionable_reschedule";
  // Thông tin cho việc dời lịch
  affectedBooking?: {
    originalBookingId: string;
    roomId: string;
    roomName: string;
    slotsLostCount: number;
  };
}

// Dữ liệu giả định mới
const notificationsData: NotificationItem[] = [
  {
    id: "100",
    title: "Yêu cầu dời lịch của bạn!",
    description:
      "Lịch của bạn tại phòng Lab A101 (Slot 1, 04/10/2025) đã bị trùng với một sự kiện ưu tiên. Vui lòng chọn Hủy lịch hoặc Đổi sang một slot khác.",
    time: "03/10/2025 09:15",
    read: false,
    type: "actionable_reschedule",
    affectedBooking: {
      originalBookingId: "booking123", // ID của booking gốc
      roomId: "lab1",
      roomName: "Phòng Lab A101",
      slotsLostCount: 1, // Số slot đã bị lấy đi
    },
  },
  {
    id: "1",
    title: "Thông báo lịch bảo trì phòng Lab A501",
    description:
      "Chiều thứ 5 (02/10) phòng A501 sẽ tạm ngưng phục vụ để bảo trì hệ thống máy in 3D.",
    time: "02/10/2025 16:39",
    read: false,
    type: "info",
  },
  {
    id: "2",
    title: "Cập nhật lịch hoạt động Lab IoT",
    description:
      "Môn Internet of Things học phần 2 chuyển sang phòng B203 trong tuần này.",
    time: "23/09/2025 13:58",
    read: false,
    type: "info",
  },
  {
    id: "3",
    title: "Kết quả kiểm tra thiết bị tuần 37",
    description:
      "Thiết bị cảm biến trong Lab AI đã đạt chuẩn, có thể đặt vào các buổi tối.",
    time: "18/09/2025 15:19",
    read: true,
    type: "info",
  },
  {
    id: "4",
    title: "Tạm ngưng đăng ký Lab Robotics",
    description:
      "Lab Robotics sẽ đóng cửa ngày 17/09 để nâng cấp cánh tay robot công nghiệp.",
    time: "17/09/2025 09:31",
    read: true,
    type: "info",
  },
];

// Component Card (đã cập nhật)
function NotificationCard({
  notification,
  onCancel,
  onReschedule,
}: {
  notification: NotificationItem;
  onCancel: (id: string) => void;
  onReschedule: (id: string, booking: any) => void;
}) {
  const isActionable =
    notification.type === "actionable_reschedule" && !notification.read;

  return (
    <TouchableOpacity
      style={[styles.card, notification.read && styles.cardRead]}
      // Chỉ cho phép bấm vào card (để đổi lịch) nếu nó "actionable"
      disabled={!isActionable}
      onPress={
        isActionable
          ? () => onReschedule(notification.id, notification.affectedBooking)
          : undefined
      }
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

        {/* Nút hành động */}
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

// Component Screen
export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Quản lý danh sách bằng state
  const [notifications, setNotifications] = useState(notificationsData);

  const unread = notifications.filter((item) => !item.read);
  const list = activeTab === "all" ? notifications : unread;

  // Xử lý Hủy lịch
  const handleCancel = (id: string) => {
    Alert.alert(
      "Xác nhận Hủy lịch",
      "Bạn có chắc chắn muốn hủy lịch này không? Hành động này không thể hoàn tác.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Xác nhận Hủy",
          style: "destructive",
          onPress: () => {
            // Cập nhật state, đánh dấu là đã đọc
            setNotifications(
              notifications.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      read: true,
                      title: `(Đã hủy) ${item.title}`,
                      type: "info", // Chuyển về info, ẩn nút đi
                    }
                  : item
              )
            );
            // (Tại đây bạn có thể gọi API để xóa booking gốc)
          },
        },
      ]
    );
  };

  // Xử lý Đổi lịch
  const handleReschedule = (id: string, booking: any) => {
    // 1. Đánh dấu thông báo là đã đọc
    setNotifications(
      notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    // 2. Điều hướng người dùng về trang ĐỔI LỊCH MỚI
    router.push({
      pathname: "/book/reschedule-slots" as any, // Route mới
      params: {
        roomId: booking.roomId,
        roomName: booking.roomName,
        slotsToPick: booking.slotsLostCount || 1, // Truyền số slot cần chọn
        bookingId: booking.originalBookingId, // Truyền ID của booking gốc
      },
    });
  };

  const renderContent = () => {
    if (list.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Bạn đã đọc hết thông báo</Text>
          <Text style={styles.emptyStateSubtitle}>
            Đừng quên kiểm tra lại sau để cập nhật thông tin mới.
          </Text>
        </View>
      );
    }

    return list.map((notification) => (
      <NotificationCard
        key={notification.id}
        notification={notification}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />
    ));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
        <Text style={styles.subtitle}>
          Theo dõi mọi cập nhật về lịch và trạng thái phòng lab
        </Text>
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
  container: {
    flex: 1,
    backgroundColor: "#fff7ed",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
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
  activeTab: {
    backgroundColor: "#f97316",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  activeTabText: {
    color: "white",
  },
  listContainer: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  cardRead: {
    backgroundColor: "#f8fafc",
    borderColor: "#f1f5f9",
  },
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
  iconContainerRead: {
    backgroundColor: "#f1f5f9",
  },
  iconContainerActionable: {
    borderColor: "#ea580c",
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  cardTitleRead: {
    color: "#64748b",
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  cardDescRead: {
    color: "#94a3b8",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  actionButtonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    color: "#334155",
  },
  rescheduleButton: {
    backgroundColor: "#ea580c",
  },
  rescheduleButtonText: {
    color: "white",
  },
  emptyStateContainer: {
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c2410c",
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#ea580c",
  },
});
