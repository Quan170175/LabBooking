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
import BookingButton from "../../components/booking/BookingButton";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";
import InviteMemberModal from "../../components/booking/InviteMemberModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";

// ... (Dữ liệu giả lập ROOMS giữ nguyên) ...
const ROOMS: any = {
  lab1: {
    id: "lab1",
    name: "Phòng Lab A101",
    devices: [
      { id: "d1", name: "Laptop", qty: 10, desc: "Laptop sinh viên (Windows)" },
      { id: "d2", name: "Máy chiếu", qty: 2, desc: "Máy chiếu HD" },
      { id: "d3", name: "Bộ kit IoT", qty: 5, desc: "Cảm biến và board" },
    ],
  },
  lab2: {
    id: "lab2",
    name: "Phòng Lab B202",
    devices: [
      { id: "d4", name: "PC", qty: 20, desc: "Máy trạm cài đặt sẵn" },
      { id: "d5", name: "Router", qty: 3, desc: "Thiết bị mạng" },
    ],
  },
};

export default function BookDevices() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [selectedDevices, setSelectedDevices] = useState<
    Record<string, number>
  >({});
  const [invited, setInvited] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 2. State cho loading khi submit và state mở/đóng modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  // (Đã loại bỏ isDelaying)

  // ... (useEffect loadBookingData giữ nguyên) ...
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

        if (Array.isArray(b.devices)) {
          const map: Record<string, number> = {};
          for (const item of b.devices) {
            if (typeof item === "string") map[item] = 1;
            else if (item && typeof item === "object")
              map[item.id] = item.qty || 1;
          }
          setSelectedDevices(map);
        } else if (b.devices && typeof b.devices === "object") {
          setSelectedDevices(b.devices);
        }

        if (b.invited && Array.isArray(b.invited)) {
          setInvited(b.invited);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu đặt phòng:", error);
        router.replace("/book" as any);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookingData();
  }, []);

  // (Đã loại bỏ useEffect 5s delay)

  // ... (Các hàm toggleDevice, setQty, handleInvite giữ nguyên) ...
  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) => {
      const next = { ...prev };
      if (typeof next[id] === "number") {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const setQty = (id: string, qty: number, maxQty: number) => {
    setSelectedDevices((prev) => {
      const newQty = Math.max(0, Math.min(qty, maxQty));
      if (newQty === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const handleInvite = (email: string) => {
    setInvited((prev) => (prev.includes(email) ? prev : [...prev, email]));
  };

  const confirmBooking = async () => {
    setIsSubmitting(true);
    try {
      // ... (logic confirmBooking giữ nguyên) ...
      const bookingsString = await AsyncStorage.getItem("bookings");
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];
      const devicesArray = Object.entries(selectedDevices).map(([id, qty]) => ({
        id,
        qty,
      }));

      bookings.push({
        id: Date.now(),
        ...booking,
        devices: devicesArray,
        invited,
        status: "pending",
      });
      await AsyncStorage.setItem("bookings", JSON.stringify(bookings));
      await AsyncStorage.removeItem("currentBooking");

      Alert.alert(
        "Đặt phòng thành công!",
        "Yêu cầu của bạn đã được gửi đi và đang chờ xác nhận.",
        [{ text: "OK", onPress: () => router.replace("/home" as any) }]
      );
    } catch (error) {
      console.error("Lỗi khi xác nhận đặt phòng:", error);
      Alert.alert("Lỗi", "Không thể hoàn tất đặt phòng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Cập nhật hàm xử lý Hủy và xác nhận Hủy
  const handleCancel = () => {
    setCancelModalOpen(true); // Chỉ cần mở modal
  };

  const onConfirmCancel = async () => {
    setCancelModalOpen(false); // Đóng modal
    await AsyncStorage.removeItem("currentBooking");
    router.replace("/(tabs)" as any);
  };
  // ----------------------------------------------

  // ... (Phần render loading, headerIcon, ...)
  if (isLoading || !booking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  const room = ROOMS[booking.roomId];

  const headerIcon = (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 .94l-.31 1.14a2 2 0 0 1-2 .14l-.13-.07a2 2 0 0 1-.8-1.9l.13-1.14a1.65 1.65 0 0 0-.6-1.22l-.9-.9a1.65 1.65 0 0 0-1.22-.6l-1.14.13a2 2 0 0 1-1.9-.8l-.07-.13a2 2 0 0 1 .14-2l1.14-.31a1.65 1.65 0 0 0 .94-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.45.45 1.2.57 1.82.33l1.14-.31a2 2 0 0 1 2 .14l.13.07a2 2 0 0 1 .8 1.9l-.13 1.14c-.09.38.02.79.33 1.1l.9.9c.31.31.72.42 1.1.33l1.14-.13a2 2 0 0 1 2 .8l.07.13a2 2 0 0 1-.14 2l-1.14.31c-.38.09-.7.33-1 .66z"
        stroke="#EA580C"
        strokeWidth="1.2"
      />
    </Svg>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={3} />
      <BookingPageHeader
        icon={headerIcon}
        title="Thiết bị có thể mượn"
        subtitle={`Chọn thiết bị cho ${room.name}`}
      />

      {/* ... (Phần Device List và Invite Section giữ nguyên) ... */}
      <View style={styles.deviceList}>
        {room.devices.map((d: any) => {
          const isSelected = typeof selectedDevices[d.id] === "number";
          return (
            <BookingCard key={d.id}>
              <View style={styles.deviceInfo}>
                <TouchableOpacity
                  onPress={() => toggleDevice(d.id)}
                  style={styles.checkboxBase}
                >
                  {isSelected && <View style={styles.checkboxChecked} />}
                </TouchableOpacity>
                <View>
                  <Text style={styles.deviceName}>{d.name}</Text>
                  <Text style={styles.deviceDesc}>
                    {d.desc} • SL: {d.qty}
                  </Text>
                </View>
              </View>
              {isSelected && (
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    onPress={() =>
                      setQty(d.id, (selectedDevices[d.id] || 1) - 1, d.qty)
                    }
                    style={styles.qtyButton}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{selectedDevices[d.id]}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setQty(d.id, (selectedDevices[d.id] || 1) + 1, d.qty)
                    }
                    style={[styles.qtyButton, styles.qtyButtonPlus]}
                  >
                    <Text style={[styles.qtyButtonText, { color: "white" }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </BookingCard>
          );
        })}
      </View>

      {booking?.type === "project" && (
        <View style={styles.inviteSection}>
          <Text style={styles.title}>Thêm thành viên</Text>
          <Text style={styles.subtitle}>
            Mời thành viên tham gia bằng email
          </Text>
          <TouchableOpacity
            onPress={() => setInviteOpen(true)}
            style={styles.inviteButton}
          >
            <View style={styles.plusIcon}>
              <Text style={styles.plusIconText}>+</Text>
            </View>
            <Text style={styles.inviteButtonText}>Thêm thành viên</Text>
          </TouchableOpacity>
          {invited.length > 0 && (
            <View style={styles.invitedList}>
              {invited.map((email) => (
                <View key={email} style={styles.invitedTag}>
                  <Text style={styles.invitedTagText}>{email}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <BookingButton
          label="Hủy"
          variant="secondary"
          onPress={handleCancel} // Mở modal
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

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
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

// ... (Styles giữ nguyên) ...
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
  deviceList: { gap: 12, marginBottom: 24 },
  deviceInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  deviceName: { fontWeight: "600", color: "#0F172A", fontSize: 16 },
  deviceDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    backgroundColor: "#EA580C",
    borderRadius: 4,
  },
  quantityControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonPlus: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  qtyButtonText: { fontSize: 18, fontWeight: "500" },
  qtyText: { width: 30, textAlign: "center", fontSize: 16, fontWeight: "600" },
  inviteSection: {
    marginTop: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
  },
  invitedTagText: { color: "#C2410C", fontSize: 12 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
});
