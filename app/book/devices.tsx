import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// --- QUAN TRỌNG: Thêm Circle vào import ---
import Svg, { Circle, Path } from "react-native-svg";

// --- COMPONENTS ---
// (Giữ nguyên đường dẫn import của bạn)
import AddDeviceModal, {
  CustomDevice,
} from "../../components/booking/AddDeviceModal";
import BookingButton from "../../components/booking/BookingButton";
import BookingCard from "../../components/booking/BookingCard";
import BookingPageHeader from "../../components/booking/BookingPageHeader";
import BookingProgress from "../../components/booking/BookingProgress";
import ConfirmationModal from "../../components/common/ConfirmationModal";

// ====================================================================
// --- TYPES ---
// ====================================================================
export type OutsideGuest = {
  id: string; // Dùng cho FE quản lý list
  fullName: string;
  email: string;
  organization: string;
  purpose: string;
};

// ====================================================================
// --- ICONS ---
// ====================================================================
const MonitorIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M2 17h20M12 17v5M8 22h8M3 3h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
const DeviceIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="#C2410C" strokeWidth="1.5" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 .94l-.31 1.14a2 2 0 0 1-2 .14l-.13-.07a2 2 0 0 1-.8-1.9l.13-1.14a1.65 1.65 0 0 0-.6-1.22l-.9-.9a1.65 1.65 0 0 0-1.22-.6l-1.14.13a2 2 0 0 1-1.9-.8l-.07-.13a2 2 0 0 1 .14-2l1.14-.31a1.65 1.65 0 0 0 .94-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.45.45 1.2.57 1.82.33l1.14-.31a2 2 0 0 1 2 .14l.13.07a2 2 0 0 1 .8 1.9l-.13 1.14c-.09.38.02.79.33 1.1l.9.9c.31.31.72.42 1.1.33l1.14-.13a2 2 0 0 1 2 .8l.07.13a2 2 0 0 1-.14 2l-1.14.31c-.38.09-.7.33-1 .66z" stroke="#C2410C" strokeWidth="1.2" /></Svg>);
const ChevronDown = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m6 9 6 6 6-6"/></Svg>);
// Icon Guest mới
const GuestIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="12" cy="7" r="4" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>);

// ====================================================================
// --- COMPONENT: ADD GUEST MODAL ---
// ====================================================================
const AddGuestModal = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<OutsideGuest, "id">) => void;
  initialData?: OutsideGuest | null;
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    if (visible) {
      setFullName(initialData?.fullName || "");
      setEmail(initialData?.email || "");
      setOrg(initialData?.organization || "");
      setPurpose(initialData?.purpose || "");
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !org.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên, Email và Tổ chức.");
      return;
    }
    onSubmit({ fullName, email, organization: org, purpose });
    // Reset form
    if (!initialData) {
        setFullName(""); setEmail(""); setOrg(""); setPurpose("");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {initialData ? "Sửa thông tin khách" : "Thêm khách mời"}
          </Text>

          <Text style={styles.inputLabel}>Họ và tên <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Nguyễn Văn A" value={fullName} onChangeText={setFullName} />

          <Text style={styles.inputLabel}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.inputLabel}>Tổ chức / Công ty</Text>
          <TextInput style={styles.input} placeholder="FPT Software, Đại học..." value={org} onChangeText={setOrg} />

          <Text style={styles.inputLabel}>Mục đích tham gia</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Tham quan lab..." multiline numberOfLines={2} value={purpose} onChangeText={setPurpose} />

          <View style={[styles.footer, { marginTop: 20 }]}>
            <TouchableOpacity onPress={onClose} style={[styles.addButtonSmall, { borderColor: "#CBD5E1", backgroundColor: "white" }]}>
              <Text style={{ color: "#64748B", fontWeight: "600" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.addButtonSmall, { backgroundColor: "#EA580C", borderColor: "#EA580C" }]}>
              <Text style={{ color: "white", fontWeight: "600" }}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ====================================================================
// --- API CLIENT ---
// ====================================================================
const apiClient = axios.create({
  baseURL: "https://localhost:7089/api", 
});

const api_getCourses = async (pageNumber: number, pageSize: number) => {
  try {
    const response = await apiClient.get("/Course", {
        params: { PageNumber: pageNumber, PageSize: pageSize }
    });
    return response.data;
  } catch (e) {
    console.error("Load courses failed", e);
    return null;
  }
};

// ====================================================================
// --- MAIN COMPONENT ---
// ====================================================================
export default function BookDevices() {
  const router = useRouter();

  // --- CORE DATA ---
  const [booking, setBooking] = useState<any>(null);
  const [existingDevices, setExistingDevices] = useState<any[]>([]);
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [maxCapacity, setMaxCapacity] = useState(0);

  // --- GUESTS STATE (MỚI) ---
  const [guests, setGuests] = useState<OutsideGuest[]>([]);
  const [isGuestModalOpen, setGuestModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<OutsideGuest | null>(null);
  const [guestToDeleteId, setGuestToDeleteId] = useState<string | null>(null);

  // --- FORM DATA ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isMajorOnly, setIsMajorOnly] = useState(false);

  // --- Teaching & Infinite Scroll ---
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [coursePage, setCoursePage] = useState(1);
  const [totalCoursePages, setTotalCoursePages] = useState(1);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // --- Project ---
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  // --- Priority ---
  const [justification, setJustification] = useState("");
  const [evidence, setEvidence] = useState("");

  // --- UI STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<CustomDevice | null>(null);
  const [deviceToDeleteId, setDeviceToDeleteId] = useState<string | null>(null);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  // --- HELPER: FETCH COURSES ---
  const fetchCourses = async (page: number) => {
    if (isLoadingCourses) return;
    setIsLoadingCourses(true);
    const data = await api_getCourses(page, 10);
    setIsLoadingCourses(false);
    if (data && data.items) {
        if (page === 1) setCourses(data.items);
        else setCourses(prev => [...prev, ...data.items]);
        setTotalCoursePages(data.totalPages);
        setCoursePage(page);
    }
  };

  // --- INIT ---
  useEffect(() => {
    const init = async () => {
      try {
        const bString = await AsyncStorage.getItem("currentBooking");
        if (!bString) { router.replace("/book" as any); return; }
        const b = JSON.parse(bString);
        setBooking(b);
        
        if (b.existingDevices) setExistingDevices(b.existingDevices);
        if (b.devices) setCustomDevices(b.devices);

        // Cấu hình mặc định
        if (b.type && b.type.includes("teaching")) {
          setIsPublic(false); 
          fetchCourses(1);
        } else if (b.type === "project") {
          setIsPublic(true);
        }

        if (b.maximumLimit) {
            setMaxCapacity(b.maximumLimit);
        }

      } catch (error) {
        console.error("Init failed:", error);
        router.replace("/book" as any);
      } finally { setIsLoading(false); }
    };
    init();
  }, [router]);

  // --- HANDLER: LOAD MORE COURSES ---
  const handleLoadMoreCourses = () => {
      if (coursePage < totalCoursePages && !isLoadingCourses) {
          fetchCourses(coursePage + 1);
      }
  };

  // --- HANDLERS: GUEST ---
  const handleOpenAddGuest = () => { setGuestToEdit(null); setGuestModalOpen(true); };
  const handleOpenEditGuest = (g: OutsideGuest) => { setGuestToEdit(g); setGuestModalOpen(true); };
  
  const handleAddOrUpdateGuest = (data: Omit<OutsideGuest, "id">) => {
    if (guestToEdit) {
      setGuests(prev => prev.map(g => g.id === guestToEdit.id ? { ...g, ...data } : g));
    } else {
      setGuests(prev => [...prev, { id: Date.now().toString(), ...data }]);
    }
    setGuestModalOpen(false);
  };

  const handleOpenDeleteGuest = (id: string) => { setGuestToDeleteId(id); };
  const handleConfirmDeleteGuest = () => { 
    setGuests(prev => prev.filter(g => g.id !== guestToDeleteId)); 
    setGuestToDeleteId(null); 
  };

  // --- HANDLERS: DEVICES & COMMON ---
  const handleOpenAddModal = () => { setDeviceToEdit(null); setDeviceModalOpen(true); };
  const handleOpenEditModal = (device: CustomDevice) => { setDeviceToEdit(device); setDeviceModalOpen(true); };
  const handleAddOrUpdateDevice = (data: Omit<CustomDevice, "id">) => { 
    setDeviceModalOpen(false); 
    if(deviceToEdit) setCustomDevices(prev => prev.map(d => d.id === deviceToEdit.id ? {...d, ...data} : d));
    else setCustomDevices(prev => [...prev, {id: Date.now().toString(), ...data}]);
  };
  const handleOpenDeleteConfirm = (id: string) => { setDeviceToDeleteId(id); };
  const handleConfirmDelete = () => { setCustomDevices(prev => prev.filter(d => d.id !== deviceToDeleteId)); setDeviceToDeleteId(null); };
  const handleCancel = () => { setCancelModalOpen(true); };
  const onConfirmCancel = async () => { await AsyncStorage.removeItem("currentBooking"); router.replace("/(tabs)" as any); };


  // --- VALIDATION ---
  const isFormValid = () => {
    if (!title.trim() || !participants.trim()) return false;
    const num = parseInt(participants);
    if (isNaN(num) || num <= 0) return false;

    if (booking?.type?.includes("teaching") && !selectedCourse) return false;
    if (booking?.type === "project" && !projectName.trim()) return false;
    if (booking?.type === "priority" && !justification.trim()) return false;
    
    return true;
  };

  // --- SUBMIT ---
  const confirmBooking = async () => {
    if (!isFormValid()) {
        Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc.");
        return;
    }

    const num = parseInt(participants);
    if (maxCapacity > 0 && num > maxCapacity) {
        Alert.alert("Quá tải", `Phòng này chỉ chứa tối đa ${maxCapacity} người.\nVui lòng giảm số lượng.`);
        return;
    }

    setIsSubmitting(true);
    try {
      let apiType = "Teaching"; 
      if (booking.type === "project") apiType = "Project";
      else if (booking.type === "priority") apiType = "UniversityEvent";

      let payload: any = {
        labRoomId: booking.roomId,
        createdById: "c2f3a4d8-9b7e-43c1-8c4f-2e7a0f4c12ab", // TODO: Auth ID
        title: title,
        description: description,
        numberOfParticipants: parseInt(participants),
        isPublic: isPublic,
        isMajorOnly: isMajorOnly,
        type: apiType,
        
        slots: booking.slots.map((s: any) => ({
            date: s.date, slotId: s.slotId
        })),
        
        externalEquipments: customDevices.map(d => ({
            name: d.name, description: d.desc || "", quantity: d.qty
        })),

        // --- MAP OUTSIDE GUESTS ---
        outSideGuests: guests.map(g => ({
             fullName: g.fullName,
             email: g.email,
             organization: g.organization,
             purpose: g.purpose
        })),

        courseId: null, project: null, priorityDetail: null
      };

      if (booking.type.includes("teaching")) {
          payload.courseId = selectedCourse.id;
      } else if (booking.type === "project") {
          payload.project = {
              projectName: projectName, description: projectDesc, projectType: "Research"
          };
      } else if (booking.type === "priority") {
          payload.priorityDetail = {
              justification: justification, evidenceFilePath: evidence 
          };
      }

      console.log("🚀 Payload:", JSON.stringify(payload, null, 2));
      const response = await apiClient.post("/Bookings", payload);
      
      await AsyncStorage.removeItem("currentBooking");
      router.replace({
        pathname: "/book/success",
        params: { result: JSON.stringify(response.data) }
      } as any);

    } catch (error: any) {
      console.error("❌ Error:", error);
      let errorMsg = "Không thể gửi yêu cầu.";
      if (error.response?.data?.title) errorMsg = `Lỗi: ${error.response.data.title}`;
      Alert.alert("Thất bại", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !booking) return <View style={styles.centered}><ActivityIndicator size="large" color="#EA580C" /></View>;

  // --- RENDER SECTIONS ---
  const renderCommonFields = () => (
    <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Tiêu đề sự kiện <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="VD: Lớp SE1701..." value={title} onChangeText={setTitle} />
        <Text style={styles.inputLabel}>Mô tả chi tiết</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Nội dung..." multiline numberOfLines={3} value={description} onChangeText={setDescription} />
        <Text style={styles.inputLabel}>Số lượng người tham gia <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="VD: 30" keyboardType="numeric" value={participants} onChangeText={setParticipants} />
        <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Chỉ dành cho chuyên ngành</Text>
            <Switch value={isMajorOnly} onValueChange={setIsMajorOnly} trackColor={{ false: "#E2E8F0", true: "#FFEDD5" }} thumbColor={isMajorOnly ? "#EA580C" : "#94A3B8"} />
        </View>
        {!booking.type.includes("teaching") && (
            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Công khai lịch này (Public)</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: "#E2E8F0", true: "#FFEDD5" }} thumbColor={isPublic ? "#EA580C" : "#94A3B8"} />
            </View>
        )}
    </View>
  );

  const renderTeachingFields = () => (
    <View style={styles.formSection}>
        <Text style={styles.sectionHeaderTitle}>Thông tin Lớp học</Text>
        <Text style={styles.inputLabel}>Môn học <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setCourseModalOpen(true)}>
            <Text style={[styles.dropdownText, !selectedCourse && { color: "#94A3B8" }]}>{selectedCourse ? `${selectedCourse.courseCode} - ${selectedCourse.courseName}` : "Chọn môn học"}</Text>
            <ChevronDown />
        </TouchableOpacity>
    </View>
  );

  const renderProjectFields = () => (
    <View style={styles.formSection}>
        <Text style={styles.sectionHeaderTitle}>Thông tin Dự án</Text>
        <Text style={styles.inputLabel}>Tên dự án mới <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="Nhập tên dự án..." value={projectName} onChangeText={setProjectName} />
        <Text style={styles.inputLabel}>Mô tả dự án</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Mô tả ngắn gọn..." multiline numberOfLines={2} value={projectDesc} onChangeText={setProjectDesc} />
    </View>
  );

  const renderPriorityFields = () => (
    <View style={styles.formSection}>
        <Text style={styles.sectionHeaderTitle}>Yêu cầu Ưu tiên</Text>
        <View style={styles.warningBox}><Text style={styles.warningText}>Lịch này sẽ được gửi đến Quản lý để xét duyệt ghi đè.</Text></View>
        <Text style={styles.inputLabel}>Lý do ưu tiên <Text style={styles.required}>*</Text></Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Giải trình..." multiline numberOfLines={3} value={justification} onChangeText={setJustification} />
        <Text style={styles.inputLabel}>Link minh chứng (nếu có)</Text>
        <TextInput style={styles.input} placeholder="Google Drive..." value={evidence} onChangeText={setEvidence} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingProgress step={3} />
      <BookingPageHeader icon={<DeviceIcon />} title="Hoàn tất thông tin" subtitle={`Khai báo thông tin cho ${booking.roomName}`} />

      {booking.type.includes("teaching") && renderTeachingFields()}
      {booking.type === "project" && renderProjectFields()}
      {booking.type === "priority" && renderPriorityFields()}
      {renderCommonFields()}

      {/* --- EXISTING DEVICES --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Có sẵn tại phòng</Text>
        {existingDevices.length === 0 ? <Text style={styles.emptyText}>Phòng này chưa có thiết bị nào.</Text> : (
          <View style={styles.deviceList}>
            {existingDevices.map((d: any) => (
              <BookingCard key={d.id} layout="default">
                <View style={styles.deviceInfoContainer}>
                  <View style={[styles.deviceIcon, styles.monitorIconBg]}><MonitorIcon /></View>
                  <View style={styles.deviceTextWrapper}><Text style={styles.deviceName}>{d.equipmentName}</Text><Text style={styles.deviceDesc}>{d.description || "Mặc định"} • {d.status}</Text></View>
                </View>
              </BookingCard>
            ))}
          </View>
        )}
      </View>

      {/* --- CUSTOM DEVICES --- */}
      <View style={[styles.section, { marginTop: 24 }]}>
         <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thiết bị mang vào</Text>
            <TouchableOpacity onPress={handleOpenAddModal} style={styles.addButtonSmall}><Text style={styles.addButtonTextSmall}>+ Thêm</Text></TouchableOpacity>
         </View>
        <View style={styles.deviceList}>
          {customDevices.length === 0 && <Text style={styles.emptyText}>Chưa khai báo thiết bị nào.</Text>}
          {customDevices.map((d) => (
            <BookingCard key={d.id} layout="default">
              <View style={styles.deviceInfoContainer}>
                <View style={styles.deviceIcon}><DeviceIcon /></View>
                <View style={styles.deviceTextWrapper}><Text style={styles.deviceName}>{d.name}</Text><Text style={styles.deviceDesc}>{d.desc || "Không có mô tả"} • SL: {d.qty}</Text></View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleOpenEditModal(d)} style={styles.cardButton}><Text style={styles.cardButtonText}>Sửa</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenDeleteConfirm(d.id)} style={styles.cardButton}><Text style={[styles.cardButtonText, styles.deleteText]}>Xóa</Text></TouchableOpacity>
              </View>
            </BookingCard>
          ))}
        </View>
      </View>

      {/* --- OUTSIDE GUESTS (MỚI) --- */}
      <View style={[styles.section, { marginTop: 24 }]}>
         <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khách mời bên ngoài</Text>
            <TouchableOpacity onPress={handleOpenAddGuest} style={styles.addButtonSmall}><Text style={styles.addButtonTextSmall}>+ Thêm</Text></TouchableOpacity>
         </View>
        <View style={styles.deviceList}>
          {guests.length === 0 && <Text style={styles.emptyText}>Chưa có khách mời nào.</Text>}
          {guests.map((g) => (
            <BookingCard key={g.id} layout="default">
              <View style={styles.deviceInfoContainer}>
                <View style={[styles.deviceIcon, { backgroundColor: "#FFEDD5" }]}><GuestIcon /></View>
                <View style={styles.deviceTextWrapper}><Text style={styles.deviceName}>{g.fullName}</Text><Text style={styles.deviceDesc}>{g.organization} • {g.email}</Text></View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleOpenEditGuest(g)} style={styles.cardButton}><Text style={styles.cardButtonText}>Sửa</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenDeleteGuest(g.id)} style={styles.cardButton}><Text style={[styles.cardButtonText, styles.deleteText]}>Xóa</Text></TouchableOpacity>
              </View>
            </BookingCard>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <BookingButton label="Hủy" variant="secondary" onPress={handleCancel} disabled={isSubmitting} />
        <BookingButton label="Hoàn tất" variant="primary" onPress={confirmBooking} disabled={isSubmitting} isLoading={isSubmitting} />
      </View>

      {/* --- MODALS --- */}
      <Modal visible={isCourseModalOpen} animationType="slide" transparent={true}>
         <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn môn học</Text>
                <FlatList 
                    data={courses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.courseItem} onPress={() => { setSelectedCourse(item); setCourseModalOpen(false); }}>
                            <Text style={styles.courseItemText}><Text style={{fontWeight: 'bold'}}>{item.courseCode}</Text> - {item.courseName}</Text>
                        </TouchableOpacity>
                    )}
                    onEndReached={handleLoadMoreCourses}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={(isLoadingCourses && coursePage > 1) ? <ActivityIndicator size="small" color="#EA580C" style={{padding: 10}}/> : null}
                    ListEmptyComponent={!isLoadingCourses ? <Text style={{textAlign:'center', padding: 20, color: '#94A3B8'}}>Không có dữ liệu</Text> : null}
                    style={{ maxHeight: 400, width: '100%' }}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setCourseModalOpen(false)}><Text style={styles.closeButtonText}>Đóng</Text></TouchableOpacity>
            </View>
         </View>
      </Modal>

      <AddDeviceModal visible={isDeviceModalOpen} onClose={() => setDeviceModalOpen(false)} onSubmit={handleAddOrUpdateDevice} initialData={deviceToEdit} />
      
      {/* Guest Modals */}
      <AddGuestModal visible={isGuestModalOpen} onClose={() => setGuestModalOpen(false)} onSubmit={handleAddOrUpdateGuest} initialData={guestToEdit} />
      <ConfirmationModal visible={!!guestToDeleteId} title="Xóa khách mời" message="Bạn có chắc muốn xóa khách mời này?" confirmText="Xóa" cancelText="Hủy" onClose={() => setGuestToDeleteId(null)} onConfirm={handleConfirmDeleteGuest} />
      
      <ConfirmationModal visible={!!deviceToDeleteId} title="Xóa thiết bị" message="Xóa thiết bị này?" confirmText="Xóa" cancelText="Hủy" onClose={() => setDeviceToDeleteId(null)} onConfirm={handleConfirmDelete} />
      <ConfirmationModal visible={isCancelModalOpen} title="Hủy đặt phòng" message="Bạn muốn hủy toàn bộ?" confirmText="Hủy" cancelText="Không" onClose={() => setCancelModalOpen(false)} onConfirm={onConfirmCancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF7ED" },
  formSection: { marginBottom: 24, backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#FFE8DA" },
  sectionHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#EA580C", marginBottom: 12, textTransform: "uppercase" },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#0F172A", marginBottom: 8, marginTop: 12 },
  required: { color: "#DC2626" },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 12, fontSize: 14, color: "#0F172A" },
  textArea: { height: 80, textAlignVertical: "top" },
  dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 12 },
  dropdownText: { fontSize: 14, color: "#0F172A" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  switchLabel: { fontSize: 14, color: "#475569" },
  warningBox: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FCD34D", padding: 12, borderRadius: 8, marginBottom: 12 },
  warningText: { fontSize: 13, color: "#B45309", fontStyle: "italic" },
  section: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A", marginBottom: 12 },
  deviceList: { gap: 12 },
  deviceInfoContainer: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  deviceIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center" },
  monitorIconBg: { backgroundColor: "#F1F5F9" },
  deviceTextWrapper: { flex: 1 },
  deviceName: { fontWeight: "600", color: "#0F172A", fontSize: 16, marginBottom: 2 },
  deviceDesc: { fontSize: 13, color: "#64748B" },
  cardActions: { flexDirection: "column", alignItems: "flex-end", gap: 8 },
  cardButton: {},
  cardButtonText: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  deleteText: { color: "#DC2626" },
  emptyText: { color: "#94A3B8", fontStyle: "italic", textAlign: "center", marginVertical: 10 },
  addButtonSmall: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#EA580C", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
  addButtonTextSmall: { color: "#EA580C", fontSize: 13, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 32, gap: 8 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A", marginBottom: 16, textAlign: "center" },
  courseItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  courseItemText: { fontSize: 15, color: "#334155" },
  closeButton: { marginTop: 16, alignSelf: "center", padding: 10 },
  closeButtonText: { color: "#64748B", fontWeight: "600" },
});