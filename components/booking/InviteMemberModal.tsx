import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BookingButton from "./BookingButton";

// Định nghĩa cấu trúc cho "Khách mời"
export type GuestInvite = {
  email: string;
  name: string;
  purpose: string;
};

type InviteGuestModalProps = {
  open: boolean;
  onClose: () => void;
  onInvite: (guest: GuestInvite) => void;
};

export default function InviteMemberModal({
  open,
  onClose,
  onInvite,
}: InviteGuestModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");

  // Reset form khi modal mở
  useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
      setPurpose("");
      setError("");
    }
  }, [open]);

  const handleInvitePress = () => {
    setError("");
    // Validate
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập một email hợp lệ.");
      return;
    }
    if (!name.trim()) {
      setError("Vui lòng nhập tên khách mời.");
      return;
    }
    if (!purpose.trim()) {
      setError("Vui lòng nhập mục đích.");
      return;
    }

    // Gửi object GuestInvite về
    onInvite({ email, name, purpose });
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={open}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
        <Pressable style={styles.container}>
          <Text style={styles.title}>Mời khách mời</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* --- TRƯỜNG MỚI --- */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email khách mời *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vidu@fpt.edu.vn"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên khách mời *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nguyễn Văn A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mục đích *</Text>
            <TextInput
              style={[styles.input, styles.textArea]} // Style cho ô lớn
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Vd: Tham gia thuyết trình dự án..."
              multiline
            />
          </View>
          {/* ----------------- */}

          <View style={styles.buttonContainer}>
            <BookingButton
              label="Hủy"
              variant="secondary"
              onPress={onClose}
              style={styles.button}
            />
            <BookingButton
              label="Thêm khách"
              variant="primary"
              onPress={handleInvitePress}
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
    gap: 16,
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
  textArea: {
    height: 80, // Cao hơn
    textAlignVertical: "top", // Bắt đầu gõ từ trên xuống
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
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    fontSize: 13,
  },
});
