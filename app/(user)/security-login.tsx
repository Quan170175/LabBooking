// (user)/security-login.tsx

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Import apiClient (đảm bảo đường dẫn đúng với project của bạn)
import apiClient from "../../utils/api";

export default function SecurityLoginScreen() {
  const router = useRouter();

  // State cho form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation Values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const mainOpacity = useSharedValue(0);
  const mainTranslateY = useSharedValue(50);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const animatedMainStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [{ translateY: mainTranslateY.value }],
  }));

  useEffect(() => {
    const opacityConfig = { duration: 600 };
    const springConfig = { damping: 12, stiffness: 90 };

    headerOpacity.value = withTiming(1, opacityConfig);
    headerTranslateY.value = withSpring(0, springConfig);

    mainOpacity.value = withDelay(100, withTiming(1, opacityConfig));
    mainTranslateY.value = withDelay(100, withSpring(0, springConfig));
  }, []);

  const handleSecurityLogin = async () => {
    if (!username || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      console.log("Đang đăng nhập Security...");

      // GỌI API LOGIN THƯỜNG
      // Giả sử endpoint là /api/auth/login
      const response = await apiClient.post("/api/auth/login", {
        username: username,
        password: password,
        role: "security", // Tùy chọn: nếu backend cần phân biệt
      });

      const data = response.data;
      console.log("Login Success:", data);

      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;

      if (accessToken) {
        await SecureStore.setItemAsync("accessToken", accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }

        // Điều hướng vào trang Home hoặc trang dành riêng cho Security
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Lỗi", "Không nhận được token xác thực.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      const msg =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      Alert.alert("Đăng nhập thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFEDD5", "#FFFFFF", "#FEF3C7"]}
        style={styles.container}
      >
        {/* Background Glow Effect */}
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          {/* HEADER */}
          <Animated.View style={[styles.headerContainer, animatedHeaderStyle]}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>FPT UNIVERSITY</Text>
                <Text style={styles.headerSubtitle}>Security Portal</Text>
              </View>
            </View>
          </Animated.View>

          {/* MAIN FORM */}
          <Animated.View style={[styles.main, animatedMainStyle]}>
            <Text style={styles.welcomeText}>RESTRICTED ACCESS</Text>
            <Text style={styles.mainTitle}>Đăng nhập Bảo Vệ</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên tài khoản..."
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleSecurityLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Quay lại trang chính</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* FOOTER */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} FPT University · Security Dept
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "150%",
    height: "60%",
    borderRadius: 999,
    opacity: 0.25,
  },
  glowTop: {
    top: "-30%",
    left: "-25%",
    backgroundColor: "#FDBA74",
  },
  glowBottom: {
    bottom: "-25%",
    right: "-25%",
    backgroundColor: "#FB923C",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "space-between", // Phân bố header, form, footer
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#334155", // Màu tối hơn cho Security
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  main: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  welcomeText: {
    color: "#EF4444", // Màu đỏ cảnh báo/security
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  mainTitle: {
    color: "#1E293B",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
    color: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#F97316", // Màu cam chủ đạo
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  footerContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
  },
});
