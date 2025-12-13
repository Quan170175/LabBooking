import { useRouter } from "expo-router"; // 🟢 1. Dùng useRouter thay vì Link
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FeatureTileProps {
  to: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress?: () => void; // 🟢 2. Thêm prop onPress (không bắt buộc)
}

export default function FeatureTile({
  to,
  title,
  description,
  icon: Icon,
  onPress, // 🟢 3. Nhận prop onPress
}: FeatureTileProps) {
  const router = useRouter(); // 🟢 4. Khởi tạo router

  // 🟢 5. Hàm xử lý logic khi bấm
  const handlePress = () => {
    if (onPress) {
      // Nếu có hàm onPress được truyền vào (VD: Alert), thì chạy nó
      onPress();
    } else {
      // Nếu không, thực hiện chuyển trang bình thường
      router.push(to as any);
    }
  };

  return (
    // 🔴 Đã xóa thẻ <Link href={...} asChild> bao quanh
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={handlePress} // 🟢 Gắn hàm xử lý vào đây
    >
      <View style={styles.iconBox}>
        <Icon size={24} color="#EA580C" />
      </View>

      <View>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    shadowColor: "#96a3b6",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    height: 140,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  iconBox: {
    backgroundColor: "#FFEDD5",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  description: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});
