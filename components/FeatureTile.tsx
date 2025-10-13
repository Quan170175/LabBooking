import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FeatureTileProps {
  to: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export default function FeatureTile({
  to,
  title,
  description,
  icon: Icon,
}: FeatureTileProps) {
  return (
    <Link href={to as any} asChild>
      <TouchableOpacity activeOpacity={0.85} style={styles.card}>
        {/* Không cần View topRow nữa, card sẽ là container chính */}
        <View style={styles.iconBox}>
          <Icon size={24} color="#EA580C" />
        </View>

        {/* Bọc text vào một View để dễ quản lý */}
        <View>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>

        {/* Đã xóa bottomLine để giống với ảnh mẫu */}
      </TouchableOpacity>
    </Link>
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
