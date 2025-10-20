import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string) => void;
};

export default function InviteMemberModal({ open, onClose, onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setError("");
    }
  }, [open]);

  const submit = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Email không hợp lệ");
    }
    onInvite(email.trim());
    onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <Text style={styles.title}>Mời thành viên</Text>
          <Text style={styles.subtitle}>
            Nhập email để gửi lời mời tham gia đặt phòng.
          </Text>
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="user@example.com"
            style={[styles.input, error ? { borderColor: "red" } : {}]}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={{ fontWeight: "600" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              style={[styles.button, styles.inviteButton]}
            >
              <Text style={styles.inviteButtonText}>Gửi mời</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  errorText: { color: "red", fontSize: 12 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  cancelButton: { backgroundColor: "#F1F5F9" },
  inviteButton: { backgroundColor: "#EA580C" },
  inviteButtonText: { color: "white", fontWeight: "bold" },
});
