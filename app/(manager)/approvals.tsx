import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ManagerApprovalCard from "../../components/manager/ManagerApprovalCard";
import ManagerChangeCard from "../../components/manager/ManagerChangeCard";
import ManagerPriorityCard from "../../components/manager/ManagerPriorityCard";
import { Booking } from "../../utils/bookingTypes";

type ActiveTab = "standard" | "priority" | "change";

export default function ManagerApprovalsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("standard");

  // 1. Tải tất cả booking một lần
  const loadData = async () => {
    setIsLoading(true);
    try {
      const b = await AsyncStorage.getItem("bookings");
      const all = JSON.parse(b || "[]");
      setAllBookings(all);
    } catch (e) {
      console.error("Failed to load bookings", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Phân loại booking vào 3 danh sách
  const standardBookings = useMemo(
    () => allBookings.filter((b) => b.status === "pending"),
    [allBookings]
  );
  const priorityBookings = useMemo(
    () => allBookings.filter((b) => b.status === "pending_priority"),
    [allBookings]
  );
  const changeBookings = useMemo(
    () =>
      allBookings.filter(
        (b) => b.status === "pending_change" || b.type === "reschedule_request"
      ),
    [allBookings]
  );

  // 3. Hàm xử lý (Duyệt / Từ chối)
  const handleApproval = async (bookingId: number, approve: boolean) => {
    try {
      let bookingsToUpdate = [...allBookings];
      const targetBooking = bookingsToUpdate.find((b) => b.id === bookingId);
      if (!targetBooking) return;

      const newStatus = approve ? "approved" : "rejected";

      // Logic cho từng loại
      if (targetBooking.status === "pending_priority" && approve) {
        // DUYỆT ƯU TIÊN:
        targetBooking.status = "approved";

        // Tìm và "hủy" các booking bị ảnh hưởng
        const prioritySlotKeys = new Set(
          targetBooking.slots.map((s: any) => `${s.date}::${s.slotId}`)
        );

        bookingsToUpdate = bookingsToUpdate.map((b) => {
          if (b.id === targetBooking.id || b.status !== "approved") return b;

          const hasConflict = b.slots.some((s: any) =>
            prioritySlotKeys.has(`${s.date}::${s.slotId}`)
          );

          if (hasConflict) {
            // TODO: Gửi thông báo cho user (b.id)
            return { ...b, status: "needs_reschedule" };
          }
          return b;
        });
      } else if (targetBooking.status === "pending_change" && approve) {
        // DUYỆT THAY ĐỔI:
        targetBooking.status = "approved";
        targetBooking.type = targetBooking.type?.replace("_request", "");
        // Xóa thông tin 'changeInfo' sau khi đã duyệt
        delete targetBooking.changeInfo;
      } else if (targetBooking.type === "reschedule_request" && approve) {
        // DUYỆT ĐỔI LỊCH (BỊ BUỘC):
        // (Logic này có thể phức tạp, ví dụ: xóa booking gốc)
        targetBooking.status = "approved";
        targetBooking.type = "project"; // Hoặc type gốc
      } else {
        // DUYỆT THƯỜNG / TỪ CHỐI TẤT CẢ:
        targetBooking.status = newStatus;
      }

      await AsyncStorage.setItem("bookings", JSON.stringify(bookingsToUpdate));
      loadData(); // Tải lại toàn bộ
    } catch (e) {
      console.error("Failed to approve/reject", e);
    }
  };

  // 4. Render danh sách dựa trên Tab
  const renderList = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          style={styles.centered}
          size="large"
          color="#EA580C"
        />
      );
    }

    if (activeTab === "standard") {
      return (
        <FlatList
          data={standardBookings}
          renderItem={({ item }) => (
            <ManagerApprovalCard
              booking={item}
              onApprove={() => handleApproval(item.id, true)}
              onReject={() => handleApproval(item.id, false)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có yêu cầu đặt mới.</Text>
          }
        />
      );
    }

    if (activeTab === "priority") {
      return (
        <FlatList
          data={priorityBookings}
          renderItem={({ item }) => (
            <ManagerPriorityCard
              booking={item}
              allBookings={allBookings} // Gửi tất cả booking để card tự tìm xung đột
              onApprove={() => handleApproval(item.id, true)}
              onReject={() => handleApproval(item.id, false)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có yêu cầu ưu tiên.</Text>
          }
        />
      );
    }

    if (activeTab === "change") {
      return (
        <FlatList
          data={changeBookings}
          renderItem={({ item }) => (
            <ManagerChangeCard
              booking={item}
              onApprove={() => handleApproval(item.id, true)}
              onReject={() => handleApproval(item.id, false)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có yêu cầu thay đổi.</Text>
          }
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duyệt yêu cầu</Text>
      </View>

      {/* --- THANH TABS --- */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Lịch mới"
          count={standardBookings.length}
          isActive={activeTab === "standard"}
          onPress={() => setActiveTab("standard")}
        />
        <TabButton
          title="Ưu tiên"
          count={priorityBookings.length}
          isActive={activeTab === "priority"}
          onPress={() => setActiveTab("priority")}
          isPriority // Thêm style
        />
        <TabButton
          title="Thay đổi"
          count={changeBookings.length}
          isActive={activeTab === "change"}
          onPress={() => setActiveTab("change")}
        />
      </View>

      <View style={styles.listContainer}>{renderList()}</View>
    </View>
  );
}

// Component TabButton
const TabButton = ({
  title,
  count,
  isActive,
  onPress,
  isPriority = false,
}: any) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabText,
        isActive && styles.tabTextActive,
        isPriority && !isActive && styles.tabTextPriority,
      ]}
    >
      {title}
    </Text>
    {count > 0 && (
      <View
        style={[
          styles.badge,
          isPriority ? styles.badgePriority : styles.badgeDefault,
        ]}
      >
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  tabActive: {
    borderBottomColor: "#EA580C",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#EA580C",
  },
  tabTextPriority: {
    color: "#D97706",
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeDefault: {
    backgroundColor: "#E0F2FE",
  },
  badgePriority: {
    backgroundColor: "#FEF9C3",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0369A1",
  },
  listContainer: {
    flex: 1, // Đảm bảo list chiếm hết phần còn lại
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 40,
  },
});
