import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BookingButton from "./BookingButton";

// Kiểu dữ liệu cho Khách mời (Đã sửa key)
export type Guest = {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  purposeOfVisit: string; // <--- ĐÃ ĐỔI TÊN
};

type AddGuestModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Guest, "id">) => void;
  initialData: Omit<Guest, "id"> | null;
};

export default function AddGuestModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: AddGuestModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  // [ĐÃ ĐỔI TÊN STATE]
  const [purposeOfVisit, setPurposeOfVisit] = useState("");

  const isEditing = initialData !== null;

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || "");
      setEmail(initialData.email || "");
      setOrganization(initialData.organization || "");
      setPurposeOfVisit(initialData.purposeOfVisit || ""); // <--- Map đúng key
    } else {
      setFullName("");
      setEmail("");
      setOrganization("");
      setPurposeOfVisit("");
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!fullName.trim()) {
      alert("Vui lòng nhập họ tên khách mời");
      return;
    }

    onSubmit({
      fullName,
      email,
      organization,
      purposeOfVisit, // <--- Trả về đúng key Backend cần
    });
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
        <Pressable style={styles.container}>
          <Text style={styles.title}>
            {isEditing ? "Cập nhật khách mời" : "Thêm khách mời"}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 16 }}
          >
            {/* 1. Họ tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="VD: Nguyễn Văn A"
              />
            </View>

            {/* 2. Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email liên hệ</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="VD: email@domain.com"
              />
            </View>

            {/* 3. Tổ chức */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Đơn vị / Tổ chức</Text>
              <TextInput
                style={styles.input}
                value={organization}
                onChangeText={setOrganization}
                placeholder="VD: Đại học FPT, Doanh nghiệp..."
              />
            </View>

            {/* 4. Mục đích */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mục đích tham dự</Text>
              <TextInput
                style={styles.input}
                value={purposeOfVisit} // <--- Dùng state mới
                onChangeText={setPurposeOfVisit}
                placeholder="VD: Tham quan, Dự thính, Diễn giả..."
              />
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <BookingButton
              label="Hủy"
              variant="secondary"
              onPress={onClose}
              style={styles.button}
            />
            <BookingButton
              label={isEditing ? "Cập nhật" : "Thêm"}
              variant="primary"
              onPress={handleSubmit}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
