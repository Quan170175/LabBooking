import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";

import apiClient from "../../../utils/api";

// 1. Cập nhật Interface để nhận phoneNumber từ API
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  phoneNumber: string; // Thêm trường này
}

export default function ProfileDetails() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get<UserProfile>("/api/Auth/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin cá nhân:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin cá nhân.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      {/* Profile Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <UserRound size={32} color="#EA580C" />
        </View>
        <View>
          <Text style={styles.summaryName}>
            {user?.fullName || "Người dùng"}
          </Text>
          <Text style={styles.summaryPhone}>
            {user?.roles && user.roles.length > 0
              ? user.roles.join(", ")
              : "Member"}
          </Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        {/* --- Họ và tên --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            value={user?.fullName}
            editable={false}
            style={[styles.input, styles.readOnlyInput]}
          />
        </View>

        {/* --- Số điện thoại (Thay thế cho Ngày sinh/Giới tính) --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            value={user?.phoneNumber || "Chưa cập nhật"} // Data từ API
            editable={false}
            style={[styles.input, styles.readOnlyInput]}
          />
        </View>

        {/* --- Email --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={user?.email}
            editable={false}
            style={[styles.input, styles.readOnlyInput]}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFEDD5",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryPhone: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    gap: 20,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 14,
    borderColor: "#FFEDD5",
    borderWidth: 1,
    color: "#1E293B",
  },
  readOnlyInput: {
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
});
