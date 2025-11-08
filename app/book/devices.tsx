import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import AddDeviceModal, {
  CustomDevice,
} from "../../components/booking/AddDeviceModal";
import BookingButton from "../../components/booking/BookingButton";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";
import InviteMemberModal, {
  GuestInvite,
} from "../../components/booking/InviteMemberModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const DeviceIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"
      stroke="#C2410C"
      strokeWidth="1.5"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 .94l-.31 1.14a2 2 0 0 1-2 .14l-.13-.07a2 2 0 0 1-.8-1.9l.13-1.14a1.65 1.65 0 0 0-.6-1.22l-.9-.9a1.65 1.65 0 0 0-1.22-.6l-1.14.13a2 2 0 0 1-1.9-.8l-.07-.13a2 2 0 0 1 .14-2l1.14-.31a1.65 1.65 0 0 0 .94-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.45.45 1.2.57 1.82.33l1.14-.31a2 2 0 0 1 2 .14l.13.07a2 2 0 0 1 .8 1.9l-.13 1.14c-.09.38.02.79.33 1.1l.9.9c.31.31.72.42 1.1.33l1.14-.13a2 2 0 0 1 2 .8l.07.13a2 2 0 0 1-.14 2l-1.14.31c-.38.09-.7.33-1 .66z"
      stroke="#C2410C"
      strokeWidth="1.2"
    />
  </Svg>
);

export default function BookDevices() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<CustomDevice | null>(null);
  const [deviceToDeleteId, setDeviceToDeleteId] = useState<string | null>(null);
  const [invited, setInvited] = useState<GuestInvite[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const bString = await AsyncStorage.getItem("currentBooking");
        if (!bString) {
          router.replace("/book" as any);
          return;
        }
        const b = JSON.parse(bString);
        setBooking(b);

        if (b.devices && Array.isArray(b.devices)) {
          setCustomDevices(b.devices);
        }
        if (b.invited && Array.isArray(b.invited)) {
          const validGuests = b.invited.filter(
            (item: any) => typeof item === "object" && item.email
          );
          setInvited(validGuests);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu đặt phòng:", error);
        router.replace("/book" as any);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookingData();
  }, [router]);

  // (Các hàm CRUD thiết bị giữ nguyên)
  const handleOpenAddModal = () => {
    setDeviceToEdit(null);
    setDeviceModalOpen(true);
  };
  const handleOpenEditModal = (device: CustomDevice) => {
    setDeviceToEdit(device);
    setDeviceModalOpen(true);
  };
  const handleAddOrUpdateDevice = (data: Omit<CustomDevice, "id">) => {
    if (deviceToEdit) {
      setCustomDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === deviceToEdit.id ? { ...d, ...data } : d
        )
      );
    } else {
      const newDevice: CustomDevice = {
        id: Date.now().toString(),
        ...data,
      };
      setCustomDevices((prevDevices) => [...prevDevices, newDevice]);
    }
    setDeviceModalOpen(false);
  };
  const handleOpenDeleteConfirm = (id: string) => {
    setDeviceToDeleteId(id);
  };
  const handleConfirmDelete = () => {
    if (deviceToDeleteId) {
      setCustomDevices((prevDevices) =>
        prevDevices.filter((d) => d.id !== deviceToDeleteId)
      );
    }
    setDeviceToDeleteId(null);
  };

  const handleInvite = (guest: GuestInvite) => {
    setInvited((prev) =>
      prev.some((g) => g.email === guest.email) ? prev : [...prev, guest]
    );
  };

  const confirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const bookingsString = await AsyncStorage.getItem("bookings");
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];

      // Kiểm tra xem có slot nào bị xung đột không
      const hasConflicts = (booking?.slots || []).some(
        (s: any) => s.isConflict === true
      );

      // Đặt status dựa trên xung đột
      const newStatus = hasConflicts ? "pending_priority" : "pending";

      bookings.push({
        id: Date.now(),
        ...booking,
        devices: customDevices,
        invited: invited,
        status: newStatus, // Lưu status mới
      });

      await AsyncStorage.setItem("bookings", JSON.stringify(bookings));
      await AsyncStorage.removeItem("currentBooking");

      Alert.alert(
        hasConflicts ? "Gửi yêu cầu ưu tiên!" : "Đặt phòng thành công!",
        hasConflicts
          ? "Yêu cầu của bạn đã được gửi đến Quản lý. Lịch của người dùng cũ sẽ được xử lý sau khi được duyệt."
          : "Yêu cầu của bạn đã được gửi đi và đang chờ xác nhận.",
        [{ text: "OK", onPress: () => router.replace("/home" as any) }]
      );
    } catch (error) {
      console.error("Lỗi khi xác nhận đặt phòng:", error);
      Alert.alert("Lỗi", "Không thể hoàn tất đặt phòng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCancelModalOpen(true);
  };

  const onConfirmCancel = async () => {
    setCancelModalOpen(false);
    await AsyncStorage.removeItem("currentBooking");
    router.replace("/(tabs)" as any);
  };

  if (isLoading || !booking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={3} />
      <BookingPageHeader
        icon={<DeviceIcon />}
        title="Thiết bị mang vào"
        subtitle={`Khai báo thiết bị cho ${booking.roomName}`}
      />

      {/* (Phần Thêm/Danh sách thiết bị giữ nguyên) */}
      <TouchableOpacity onPress={handleOpenAddModal} style={styles.addButton}>
        <View style={styles.plusIcon}>
          <Text style={styles.plusIconText}>+</Text>
        </View>
        <Text style={styles.addButtonText}>Thêm thiết bị</Text>
      </TouchableOpacity>
      <View style={styles.deviceList}>
        {customDevices.length === 0 && (
          <Text style={styles.noDeviceText}>Bạn chưa thêm thiết bị nào.</Text>
        )}
        {customDevices.map((d) => (
          <BookingCard key={d.id} layout="default">
            <View style={styles.deviceInfoContainer}>
              <View style={styles.deviceIcon}>
                <DeviceIcon />
              </View>
              <View style={styles.deviceTextWrapper}>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Text style={styles.deviceDesc}>
                  {d.desc || "Không có mô tả"} • SL: {d.qty}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleOpenEditModal(d)}
                style={styles.cardButton}
              >
                <Text style={styles.cardButtonText}>Cập nhật</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleOpenDeleteConfirm(d.id)}
                style={styles.cardButton}
              >
                <Text style={[styles.cardButtonText, styles.deleteText]}>
                  Xóa
                </Text>
              </TouchableOpacity>
            </View>
          </BookingCard>
        ))}
      </View>

      {/* === PHẦN THAY ĐỔI (INVITE SECTION) === */}
      {/* --- THAY ĐỔI: Đã xóa điều kiện "booking?.type === 'project'" --- */}
      <View style={styles.inviteSection}>
        <Text style={styles.title}>Mời khách mời</Text>
        <Text style={styles.subtitle}>Thêm khách mời vào lịch</Text>

        <TouchableOpacity
          onPress={() => setInviteOpen(true)}
          style={styles.inviteButton}
        >
          <View style={styles.plusIcon}>
            <Text style={styles.plusIconText}>+</Text>
          </View>
          <Text style={styles.inviteButtonText}>Thêm khách mời</Text>
        </TouchableOpacity>

        {invited.length > 0 && (
          <View style={styles.invitedList}>
            {invited.map((guest) => (
              <View key={guest.email} style={styles.invitedTag}>
                <Text style={styles.invitedTagText}>{guest.name}</Text>
                <Text style={styles.invitedTagEmail}> ({guest.email})</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* === HẾT PHẦN THAY ĐỔI === */}

      {/* (Footer giữ nguyên) */}
      <View style={styles.footer}>
        <BookingButton
          label="Hủy"
          variant="secondary"
          onPress={handleCancel}
          disabled={isSubmitting}
        />
        <BookingButton
          label="Xác nhận"
          variant="primary"
          onPress={confirmBooking}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        />
      </View>

      {/* (Các modal khác giữ nguyên) */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      <AddDeviceModal
        visible={isDeviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onSubmit={handleAddOrUpdateDevice}
        initialData={deviceToEdit}
      />
      <ConfirmationModal
        visible={!!deviceToDeleteId}
        title="Xóa thiết bị"
        message="Bạn có chắc chắn muốn xóa thiết bị này khỏi danh sách?"
        confirmText="Xác nhận Xóa"
        cancelText="Không"
        onClose={() => setDeviceToDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
      <ConfirmationModal
        visible={isCancelModalOpen}
        title="Hủy đặt phòng"
        message="Bạn có chắc chắn muốn hủy toàn bộ quá trình đặt phòng này không?"
        confirmText="Xác nhận Hủy"
        cancelText="Không"
        onClose={() => setCancelModalOpen(false)}
        onConfirm={onConfirmCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },
  title: { fontSize: 22, fontWeight: "600", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#EA580C",
    fontWeight: "600",
    fontSize: 15,
  },
  deviceList: { gap: 12, marginBottom: 24 },
  noDeviceText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    paddingVertical: 20,
  },
  deviceInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceTextWrapper: {
    flex: 1,
  },
  deviceName: {
    fontWeight: "600",
    color: "#0F172A",
    fontSize: 16,
    marginBottom: 2,
  },
  deviceDesc: { fontSize: 13, color: "#64748B" },
  cardActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  cardButton: {},
  cardButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
  },
  deleteText: {
    color: "#DC2626",
  },
  inviteSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 24,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  plusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  plusIconText: { color: "#EA580C", fontWeight: "bold" },
  inviteButtonText: { color: "#EA580C", fontWeight: "600" },
  invitedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  invitedTag: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    alignItems: "baseline",
  },
  invitedTagText: {
    color: "#C2410C",
    fontSize: 13,
    fontWeight: "600",
  },
  invitedTagEmail: {
    color: "#EA580C",
    fontSize: 12,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
});
