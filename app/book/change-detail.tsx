import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

// --- COMPONENTS ---
import AddDeviceModal, {
  CustomDevice,
} from "../../components/booking/AddDeviceModal";
import AddGuestModal, { Guest } from "../../components/booking/AddGuestModal";
import BookingButton from "../../components/booking/BookingButton";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import ConfirmationModal from "../../components/common/ConfirmationModal";

// --- API CLIENT ---
import apiClient from "../../utils/api";

// --- ICONS ---
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
const LockIcon = () => (
  <Svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#64748B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M19 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm-7-7a4 4 0 0 0-4 4v3h8V8a4 4 0 0 0-4-4z" />
  </Svg>
);
const MonitorIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 17h20M12 17v5M8 22h8M3 3h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"
      stroke="#64748B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const UserIcon = () => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#64748B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// API Get Room
const api_getRoomDetails = async (roomId: string) => {
  try {
    const response = await apiClient.get(`/api/LabRooms/${roomId}`);
    return response.data;
  } catch (e) {
    console.error("API Room Details Error:", e);
    return null;
  }
};

export default function ChangeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  const desiredSlots = params.currentSlots
    ? JSON.parse(params.currentSlots as string)
    : [];

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Info
  const [roomName, setRoomName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState("");
  const [originalType, setOriginalType] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(0);

  // Type Data
  const [courseData, setCourseData] = useState<any>(null);
  const [priorityData, setPriorityData] = useState<any>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  // Devices & Guests
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [existingDevices, setExistingDevices] = useState<any[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);

  // Modals Device
  const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<CustomDevice | null>(null);
  const [deviceToDeleteId, setDeviceToDeleteId] = useState<string | null>(null);

  // Modals Guest
  const [isGuestModalOpen, setGuestModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [guestToDeleteId, setGuestToDeleteId] = useState<string | null>(null);

  // Slot Changes
  const [addedSlots, setAddedSlots] = useState<any[]>([]);
  const [removedSlots, setRemovedSlots] = useState<any[]>([]);
  const getSlotKey = (date: string, slotId: string) =>
    `${date.split("T")[0]}_${slotId}`;

  // --- LOAD DATA ---
  useEffect(() => {
    if (!bookingId) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/api/Bookings/${bookingId}`);
        const data = res.data;

        setTitle(data.title || "");
        setDescription(data.description || "");
        setParticipants(
          data.numberOfParticipants ? String(data.numberOfParticipants) : "0"
        );
        setOriginalType(data.type);

        // Calculate Slot Changes
        if (data.slots) {
          const originalSlots = data.slots;
          const originalKeys = new Set(
            originalSlots.map((s: any) => getSlotKey(s.date, s.slotId))
          );
          const newKeys = new Set(
            desiredSlots.map((s: any) => getSlotKey(s.date, s.slotId))
          );

          const added = desiredSlots.filter(
            (s: any) => !originalKeys.has(getSlotKey(s.date, s.slotId))
          );
          const removed = originalSlots.filter(
            (s: any) => !newKeys.has(getSlotKey(s.date, s.slotId))
          );

          setAddedSlots(added);
          setRemovedSlots(removed);
        }

        // Room Info
        const roomId = data.labRoomResponse?.id || data.labRoomId;
        if (data.labRoomResponse) {
          setRoomName(data.labRoomResponse.labName);
          setMaxCapacity(data.labRoomResponse.maximumLimit || 0);
        }

        // Room Devices
        let roomEquipments = [];
        if (data.labRoomResponse?.equipments?.length > 0) {
          roomEquipments = data.labRoomResponse.equipments;
        } else if (roomId) {
          const roomData = await api_getRoomDetails(roomId);
          if (roomData) {
            setRoomName(roomData.labName);
            setMaxCapacity(roomData.maximumLimit || 0);
            roomEquipments = roomData.equipments || [];
          }
        }
        setExistingDevices(roomEquipments);

        // Type Data
        if (data.type === "Teaching" && data.courseResponse)
          setCourseData(data.courseResponse);
        else if (data.type === "Project" && data.projectResponse) {
          setProjectName(data.projectResponse.projectName || "");
          setProjectDesc(data.projectResponse.description || "");
        } else if (data.type === "UniversityEvent" && data.priorityDetail)
          setPriorityData(data.priorityDetail);

        // Custom Devices
        if (data.externalEquipments?.length > 0) {
          setCustomDevices(
            data.externalEquipments.map((e: any) => ({
              id: Math.random().toString(),
              name: e.equipmentName || e.name,
              desc: e.description || "",
              qty: e.quantity || 1,
            }))
          );
        }

        // [MỚI] Guests (Đã map purposeOfVisit)
        if (data.outSideGuests?.length > 0) {
          setGuests(
            data.outSideGuests.map((g: any) => ({
              id: Math.random().toString(),
              fullName: g.fullName,
              email: g.email,
              organization: g.organization || "",

              // 👇 QUAN TRỌNG: Dùng purposeOfVisit
              purposeOfVisit: g.purposeOfVisit || "",
            }))
          );
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Lỗi", "Không tải được dữ liệu.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [bookingId]);

  // --- HANDLERS DEVICE ---
  const handleOpenAddModal = () => {
    setDeviceToEdit(null);
    setDeviceModalOpen(true);
  };
  const handleOpenEditModal = (d: CustomDevice) => {
    setDeviceToEdit(d);
    setDeviceModalOpen(true);
  };
  const handleAddOrUpdateDevice = (data: Omit<CustomDevice, "id">) => {
    setDeviceModalOpen(false);
    if (deviceToEdit)
      setCustomDevices((prev) =>
        prev.map((d) => (d.id === deviceToEdit.id ? { ...d, ...data } : d))
      );
    else
      setCustomDevices((prev) => [
        ...prev,
        { id: Date.now().toString(), ...data },
      ]);
  };
  const handleConfirmDeleteDevice = () => {
    setCustomDevices((prev) => prev.filter((d) => d.id !== deviceToDeleteId));
    setDeviceToDeleteId(null);
  };

  // --- [MỚI] HANDLERS GUEST ---
  const handleOpenAddGuest = () => {
    setGuestToEdit(null);
    setGuestModalOpen(true);
  };
  const handleOpenEditGuest = (g: Guest) => {
    setGuestToEdit(g);
    setGuestModalOpen(true);
  };
  const handleAddOrUpdateGuest = (data: Omit<Guest, "id">) => {
    setGuestModalOpen(false);
    if (guestToEdit)
      setGuests((prev) =>
        prev.map((g) => (g.id === guestToEdit.id ? { ...g, ...data } : g))
      );
    else setGuests((prev) => [...prev, { id: Date.now().toString(), ...data }]);
  };
  const handleConfirmDeleteGuest = () => {
    setGuests((prev) => prev.filter((g) => g.id !== guestToDeleteId));
    setGuestToDeleteId(null);
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Lỗi", "Nhập tiêu đề.");
    const num = parseInt(participants) || 0;
    if (num <= 0) return Alert.alert("Lỗi", "Số người > 0.");
    if (maxCapacity > 0 && num > maxCapacity)
      return Alert.alert("Quá tải", `Phòng chứa tối đa ${maxCapacity} người.`);

    setIsSubmitting(true);
    try {
      let payload: any = {
        bookingId: bookingId,
        newTitle: title,
        newDescription: description,
        newNumberOfParticipants: num,
        desiredSlots: desiredSlots.map((s: any) => ({
          date: s.date,
          slotId: s.slotId,
        })),
        newExternalEquipments: customDevices.map((d) => ({
          name: d.name,
          description: d.desc,
          quantity: d.qty,
        })),

        // 👇 QUAN TRỌNG: Dùng purposeOfVisit
        newOutSideGuests: guests.map((g) => ({
          fullName: g.fullName,
          email: g.email,
          organization: g.organization,
          purposeOfVisit: g.purposeOfVisit,
        })),
      };

      if (originalType === "Project") {
        payload.newProject = {
          projectName: projectName,
          description: projectDesc,
          projectType: 5,
        };
      }

      // 👇 Gọi API chuẩn với /api/ và tên controller số nhiều
      const response = await apiClient.post(
        "/api/BookingChangeRequest",
        payload
      );

      router.replace({
        pathname: "/book/request-success",
        params: {
          result: JSON.stringify(response.data),
          addedSlots: JSON.stringify(addedSlots),
          removedSlots: JSON.stringify(removedSlots),
        },
      } as any);
    } catch (error: any) {
      console.error("Submit Error:", error);
      console.log("Failed URL:", error.config?.baseURL + error.config?.url);
      Alert.alert("Thất bại", error.response?.data?.title || "Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingPageHeader
        icon={<DeviceIcon />}
        title="Cập nhật thông tin"
        subtitle={`Yêu cầu đổi lịch cho phòng ${roomName}`}
      />

      {/* ... RENDER TYPES ... */}
      {originalType === "Teaching" && (
        <View style={styles.formSection}>
          <Text style={styles.sectionHeaderTitle}>Thông tin Lớp học</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.inputLabel}>Môn học</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText}>
                {courseData
                  ? `${courseData.courseCode} - ${courseData.courseName}`
                  : "Không có thông tin"}
              </Text>
              <LockIcon />
            </View>
          </View>
        </View>
      )}

      {originalType === "UniversityEvent" && (
        <View style={styles.formSection}>
          <Text style={styles.sectionHeaderTitle}>Thông tin Sự kiện</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.inputLabel}>Lý do ưu tiên</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText}>
                {priorityData?.justification || "Không có nội dung"}
              </Text>
              <LockIcon />
            </View>
          </View>
        </View>
      )}

      {originalType === "Project" && (
        <View style={styles.formSection}>
          <Text style={styles.sectionHeaderTitle}>Thông tin Dự án</Text>
          <Text style={styles.inputLabel}>
            Tên dự án <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
          />
          <Text style={styles.inputLabel}>Mô tả dự án</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={projectDesc}
            onChangeText={setProjectDesc}
          />
        </View>
      )}

      {/* COMMON INFO */}
      <View style={styles.formSection}>
        <Text style={styles.sectionHeaderTitle}>Thông tin chung</Text>
        <Text style={styles.inputLabel}>Tiêu đề *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.inputLabel}>Mô tả</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.inputLabel}>
          Số người * {maxCapacity > 0 && `(Max: ${maxCapacity})`}
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={participants}
          onChangeText={setParticipants}
        />
      </View>

      {/* EXISTING DEVICES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleMain}>Có sẵn tại phòng</Text>
        {existingDevices.length === 0 ? (
          <Text style={styles.emptyText}>Phòng này chưa có thiết bị nào.</Text>
        ) : (
          <View style={styles.deviceList}>
            {existingDevices.map((d: any, idx: number) => (
              <BookingCard key={idx} layout="default">
                <View style={styles.deviceInfoContainer}>
                  <View style={[styles.deviceIcon, styles.monitorIconBg]}>
                    <MonitorIcon />
                  </View>
                  <View style={styles.deviceTextWrapper}>
                    <Text style={styles.deviceName}>
                      {d.equipmentName || d.name}
                    </Text>
                    <Text style={styles.deviceDesc}>
                      {d.description || "Thiết bị chuẩn"} •{" "}
                      {d.status || "Hoạt động"}
                    </Text>
                  </View>
                </View>
              </BookingCard>
            ))}
          </View>
        )}
      </View>

      {/* [MỚI] SECTION KHÁCH MỜI */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleMain}>Khách mời bên ngoài</Text>
          <TouchableOpacity
            onPress={handleOpenAddGuest}
            style={styles.addButtonSmall}
          >
            <Text style={styles.addButtonTextSmall}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.deviceList}>
          {guests.length === 0 && (
            <Text style={styles.emptyText}>Chưa có khách mời nào.</Text>
          )}
          {guests.map((g) => (
            <BookingCard key={g.id} layout="default">
              <View style={styles.deviceInfoContainer}>
                <View
                  style={[styles.deviceIcon, { backgroundColor: "#F1F5F9" }]}
                >
                  <UserIcon />
                </View>
                <View style={styles.deviceTextWrapper}>
                  <Text style={styles.deviceName}>{g.fullName}</Text>
                  <Text style={styles.deviceDesc}>
                    {g.organization}{" "}
                    {g.purposeOfVisit ? `• ${g.purposeOfVisit}` : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleOpenEditGuest(g)}
                  style={styles.cardButton}
                >
                  <Text style={styles.cardButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setGuestToDeleteId(g.id)}
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
      </View>

      {/* CUSTOM DEVICES */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleMain}>Thiết bị mang vào</Text>
          <TouchableOpacity
            onPress={handleOpenAddModal}
            style={styles.addButtonSmall}
          >
            <Text style={styles.addButtonTextSmall}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.deviceList}>
          {customDevices.length === 0 && (
            <Text style={styles.emptyText}>Chưa khai báo thiết bị.</Text>
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
                  <Text style={styles.cardButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDeviceToDeleteId(d.id)}
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
      </View>

      <View style={styles.footer}>
        <BookingButton
          label="Gửi yêu cầu thay đổi"
          onPress={handleSubmit}
          isLoading={isSubmitting}
        />
      </View>

      {/* MODALS */}
      <AddDeviceModal
        visible={isDeviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onSubmit={handleAddOrUpdateDevice}
        initialData={deviceToEdit}
      />
      <ConfirmationModal
        visible={!!deviceToDeleteId}
        title="Xóa thiết bị"
        message="Xóa thiết bị này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={() => setDeviceToDeleteId(null)}
        onConfirm={handleConfirmDeleteDevice}
      />

      <AddGuestModal
        visible={isGuestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={handleAddOrUpdateGuest}
        initialData={guestToEdit}
      />
      <ConfirmationModal
        visible={!!guestToDeleteId}
        title="Xóa khách"
        message="Xóa khách mời này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={() => setGuestToDeleteId(null)}
        onConfirm={handleConfirmDeleteGuest}
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
  formSection: {
    marginBottom: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EA580C",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
    marginBottom: 8,
    marginTop: 4,
  },
  required: { color: "#DC2626" },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  readOnlyBox: { marginBottom: 12 },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readOnlyText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  section: { marginTop: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleMain: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  deviceList: { gap: 12 },
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
  monitorIconBg: { backgroundColor: "#F1F5F9" },
  deviceTextWrapper: { flex: 1 },
  deviceName: {
    fontWeight: "600",
    color: "#0F172A",
    fontSize: 16,
    marginBottom: 2,
  },
  deviceDesc: { fontSize: 13, color: "#64748B" },
  cardActions: { flexDirection: "column", alignItems: "flex-end", gap: 8 },
  cardButton: {},
  cardButtonText: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  deleteText: { color: "#DC2626" },
  emptyText: {
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  addButtonSmall: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#EA580C",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonTextSmall: { color: "#EA580C", fontSize: 13, fontWeight: "600" },
  footer: { marginTop: 32 },
});
