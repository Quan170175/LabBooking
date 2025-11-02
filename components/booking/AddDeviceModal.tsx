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

// Kiểu dữ liệu cho thiết bị
export type CustomDevice = {
  id: string;
  name: string;
  desc: string;
  qty: number;
};

type AddDeviceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CustomDevice, "id">) => void;
  initialData: Omit<CustomDevice, "id"> | null; // Dùng để Cập nhật
};

export default function AddDeviceModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: AddDeviceModalProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");

  const isEditing = initialData !== null;

  // Load dữ liệu vào form nếu là "Chỉnh sửa"
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDesc(initialData.desc);
      setQty(String(initialData.qty));
    } else {
      // Reset form nếu là "Thêm mới"
      setName("");
      setDesc("");
      setQty("");
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    const quantity = parseInt(qty, 10);
    if (!name.trim()) {
      alert("Vui lòng nhập tên thiết bị");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ (lớn hơn 0)");
      return;
    }

    onSubmit({ name, desc, qty: quantity });
    onClose(); // Tự động đóng sau khi submit
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
            {isEditing ? "Cập nhật thiết bị" : "Thêm thiết bị mang vào"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên thiết bị *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: Laptop cá nhân"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả (Không bắt buộc)</Text>
            <TextInput
              style={styles.input}
              value={desc}
              onChangeText={setDesc}
              placeholder="VD: Dùng cho project AI"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số lượng *</Text>
            <TextInput
              style={styles.input}
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              placeholder="VD: 5"
            />
          </View>

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
