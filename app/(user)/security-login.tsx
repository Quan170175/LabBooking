// (user)/security-login.tsx

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
// 1. Thêm import axios trực tiếp
import axios from "axios";
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

// Import apiClient để lấy cái Base URL thôi, không dùng để gọi API
import apiClient from "../../utils/api";

export default function SecurityLoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // ... (Giữ nguyên phần Animation Values và useEffect animation) ...
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
    // ... (Giữ nguyên code animation) ...
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0);
    mainOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    mainTranslateY.value = withDelay(100, withSpring(0));

    const loadSavedCredentials = async () => {
      // ... (Giữ nguyên logic load pass cũ) ...
      try {
        const savedEmail = await SecureStore.getItemAsync("savedEmail");
        const savedPassword = await SecureStore.getItemAsync("savedPassword");
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log(e);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleSecurityLogin = async () => {
    setErrorMessage("");

    if (!email || !password) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ tài khoản và mật khẩu."
      );
      return;
    }

    setLoading(true);
    try {
      // ... (Phần gọi API giữ nguyên)
      const baseURL = apiClient.defaults.baseURL;
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: email,
        password: password,
      });
      // ... (Phần xử lý thành công giữ nguyên)
    } catch (error: any) {
      // --- ĐÃ XÓA DÒNG console.error("Login Error Manual:", error); ---
      // Thay vào đó chỉ log nhẹ nhàng để mình biết ngầm thôi (không hiện UI)
      console.log("Lỗi đăng nhập:", error.message);

      let msg = "Đăng nhập thất bại. Vui lòng thử lại.";

      if (error.response) {
        if (error.response.status === 401) {
          msg = "Sai tài khoản hoặc mật khẩu! Vui lòng kiểm tra lại.";
        } else if (error.response.data && error.response.data.message) {
          msg = error.response.data.message;
        }
      } else if (error.message) {
        msg = error.message; // Lỗi mạng v.v
      }

      // Vẫn hiện Popup chuẩn của hệ thống
      Alert.alert("Đăng nhập thất bại", msg, [
        { text: "Đóng", style: "cancel" },
      ]);

      // Vẫn hiện viền đỏ
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (Phần Giao diện giữ nguyên y hệt như cũ) ...
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFEDD5", "#FFFFFF", "#FEF3C7"]}
        style={styles.container}
      >
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
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

          <Animated.View style={[styles.main, animatedMainStyle]}>
            <Text style={styles.welcomeText}>RESTRICTED ACCESS</Text>
            <Text style={styles.mainTitle}>Đăng nhập Bảo Vệ</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Tài khoản</Text>
                <TextInput
                  style={[
                    styles.input,
                    errorMessage
                      ? { borderColor: "#EF4444", borderWidth: 1 }
                      : null,
                  ]}
                  placeholder="Nhập tên tài khoản..."
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage("");
                  }}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={[
                    styles.input,
                    errorMessage
                      ? { borderColor: "#EF4444", borderWidth: 1 }
                      : null,
                  ]}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage("");
                  }}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkboxBase,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Lưu mật khẩu</Text>
              </TouchableOpacity>
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
  // ... (Copy lại y nguyên phần styles cũ của bạn) ...
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
  glowTop: { top: "-30%", left: "-25%", backgroundColor: "#FDBA74" },
  glowBottom: { bottom: "-25%", right: "-25%", backgroundColor: "#FB923C" },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
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
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "white", fontSize: 24, fontWeight: "bold" },
  headerTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerSubtitle: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  main: { width: "100%", alignItems: "center", gap: 24 },
  welcomeText: {
    color: "#EF4444",
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
  formContainer: { width: "100%", gap: 16 },
  inputWrapper: { gap: 6 },
  label: { color: "#475569", fontSize: 14, fontWeight: "600", marginLeft: 4 },
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "white",
  },
  checkboxChecked: { backgroundColor: "#F97316", borderColor: "#F97316" },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: "white",
    borderRadius: 2,
  },
  checkboxLabel: { color: "#475569", fontSize: 14, fontWeight: "500" },
  loginButton: {
    width: "100%",
    backgroundColor: "#F97316",
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
  loginButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  backButton: { padding: 8 },
  backButtonText: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  footerContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 10,
  },
  footerText: { color: "#94A3B8", fontSize: 12 },
});
