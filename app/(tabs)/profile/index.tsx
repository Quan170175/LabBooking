// (profile)/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";

import apiClient from "../../../utils/api";

type Setting = {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
};
const settings: Setting[] = [
  {
    icon: UserRound,
    title: "Thông tin cá nhân",
    description: "Cập nhật hồ sơ sinh viên và tài khoản FPT",
    to: "/profile/details",
  },
  {
    icon: ClipboardList,
    title: "Điều khoản dịch vụ",
    description: "Các quy định sử dụng hệ thống đặt lab",
    to: "/profile/terms",
  },
  {
    icon: ShieldCheck,
    title: "Chính sách bảo mật",
    description: "Thông tin bảo vệ dữ liệu và quyền riêng tư",
    to: "/profile/privacy",
  },
  {
    icon: FileText,
    title: "Quy định sử dụng",
    description: "Nội quy phòng lab theo từng cơ sở",
    to: "/profile/rules",
  },
];

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
}

export default function Profile() {
  const router = useRouter();

  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ["profile", "email"],
      });
    } catch (error) {
      console.error("Lỗi khi cấu hình Google Sign-In ở Profile:", error);
    }

    const fetchProfileName = async () => {
      try {
        const response = await apiClient.get<UserProfile>("/api/Auth/profile");
        if (response.data) {
          if (response.data.fullName) setUserName(response.data.fullName);
          if (response.data.avatarUrl) setUserAvatar(response.data.avatarUrl);
        }
      } catch (error) {
        console.log("Không thể tải thông tin người dùng:", error);
      }
    };

    fetchProfileName();
  }, []);

  const handleNavigation = (path: string) => {
    if (path === "/profile/details") {
      router.push(path as any);
    } else {
      Alert.alert(
        "Chức năng đang phát triển",
        `Chức năng này sẽ sớm được cập nhật.`
      );
    }
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const onConfirmLogout = async () => {
    setLogoutModalOpen(false);
    console.log("Bắt đầu quá trình đăng xuất...");

    try {
      await GoogleSignin.signOut();
      console.log("Đã đăng xuất khỏi Google SDK");
    } catch (error) {
      console.log("Lỗi Google SignOut (có thể bỏ qua nếu là Security):", error);
    }

    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      console.log("Đã xóa token cục bộ");
    } catch (error) {
      console.error("Lỗi khi xóa token:", error);
    }

    router.replace("/login" as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#FDBA74", "#F97316", "#EA580C"]}
        style={styles.profileHeader}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarFallback}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.alertCard}>
        <View style={styles.alertIconContainer}>
          <AlertCircle size={20} color="#EA580C" />
        </View>
        <View style={styles.alertTextContainer}>
          <Text style={styles.alertTitle}>Bảo vệ tài khoản</Text>
          <Text style={styles.alertDescription}>
            Hệ thống sẽ yêu cầu thay đổi mật khẩu định kỳ 90 ngày để đảm bảo an
            toàn.
          </Text>
        </View>
      </View>

      <View style={styles.settingsGroup}>
        {settings.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.settingItem,
                index > 0 && styles.settingItemBorder,
              ]}
              onPress={() => handleNavigation(item.to)}
            >
              <View style={styles.settingItemContent}>
                <View style={styles.settingIconContainer}>
                  <Icon size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#FDBA74" />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.logoutButtonContent}>
          <LogOut size={16} color="white" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </View>
        <Text style={styles.logoutButtonSubText}>An toàn tài khoản</Text>
      </TouchableOpacity>

      <ConfirmationModal
        visible={isLogoutModalOpen}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
        confirmText="Đăng xuất"
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={onConfirmLogout}
      />
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
  profileHeader: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    color: "#EA580C",
    fontSize: 24,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    letterSpacing: -0.5,
  },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    backgroundColor: "white",
    padding: 16,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    marginTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  alertDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 18,
  },
  settingsGroup: {
    borderRadius: 24,
    backgroundColor: "white",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#FFF7ED",
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  settingDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 24,
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 24,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  logoutButtonSubText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
