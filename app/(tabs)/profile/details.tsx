import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";

import apiClient from "../../../utils/api";

interface UserProfile {
  id: string;
  email: string;
  userName: string;
  roles: string[];
}

export default function ProfileDetails() {
  const router = useRouter();

  // --- STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 3. GỌI API LẤY THÔNG TIN ---
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

  // --- RENDER LOADING ---
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
        {/* Nút back nếu cần (đã có trong code gốc của bạn nhưng chưa dùng) */}
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      {/* Profile Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <UserRound size={32} color="#EA580C" />
        </View>
        <View>
          <Text style={styles.summaryName}>
            {user?.userName || "Người dùng"}
          </Text>
          {/* Hiển thị Role (tuỳ chọn) */}
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
            value={user?.userName} // 🟢 Data từ API
            editable={false}
            style={[styles.input, styles.readOnlyInput]}
          />
        </View>

        <View style={styles.row}>
          {/* Ngày sinh (API chưa có, để placeholder) */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ngày sinh</Text>
            <View>
              <TextInput
                defaultValue="--/--/----" // Placeholder vì API không có
                editable={false}
                style={[styles.input, styles.readOnlyInput]}
              />
              <Calendar size={18} color="#94A3B8" style={styles.inputIcon} />
            </View>
          </View>

          {/* Giới tính (API chưa có, để placeholder) */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={[styles.picker, styles.readOnlyBackground]}>
              <Text style={[styles.pickerText, styles.readOnlyText]}>--</Text>
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={user?.email} // 🟢 Data từ API
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFEDD5",
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
  readOnlyBackground: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  readOnlyText: {
    color: "#64748B",
  },
  inputIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderColor: "#FFEDD5",
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 14,
    color: "#1E293B",
  },
});
