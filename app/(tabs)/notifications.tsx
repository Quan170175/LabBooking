// app/(tabs)/notifications.tsx
import { Bell, Check, ChevronRight, Clock4 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const notifications: NotificationItem[] = [
  {
    id: "1",
    title: "Thông báo lịch bảo trì phòng Lab A501",
    description:
      "Chiều thứ 5 (02/10) phòng A501 sẽ tạm ngưng phục vụ để bảo trì hệ thống máy in 3D.",
    time: "02/10/2025 16:39",
    read: false,
  },
  {
    id: "2",
    title: "Cập nhật lịch hoạt động Lab IoT",
    description:
      "Môn Internet of Things học phần 2 chuyển sang phòng B203 trong tuần này.",
    time: "23/09/2025 13:58",
    read: false,
  },
  {
    id: "3",
    title: "Kết quả kiểm tra thiết bị tuần 37",
    description:
      "Thiết bị cảm biến trong Lab AI đã đạt chuẩn, có thể đặt vào các buổi tối.",
    time: "18/09/2025 15:19",
    read: true,
  },
  {
    id: "4",
    title: "Tạm ngưng đăng ký Lab Robotics",
    description:
      "Lab Robotics sẽ đóng cửa ngày 17/09 để nâng cấp cánh tay robot công nghiệp.",
    time: "17/09/2025 09:31",
    read: true,
  },
];

function NotificationCard({
  notification,
}: {
  notification: NotificationItem;
}) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconContainer}>
        {notification.read ? (
          <Check size={20} color="#ea580c" />
        ) : (
          <Bell size={20} color="#ea580c" />
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <ChevronRight size={16} color="#94a3b8" />
        </View>
        <Text style={styles.cardDescription}>{notification.description}</Text>
        <View style={styles.cardFooter}>
          <Clock4 size={14} color="#94a3b8" />
          <Text style={styles.cardTime}>{notification.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const unread = notifications.filter((item) => !item.read);

  const renderContent = () => {
    const list = activeTab === "all" ? notifications : unread;

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
      <NotificationCard key={notification.id} notification={notification} />
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
  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
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
