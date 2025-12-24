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

// Import apiClient
import apiClient from "../../utils/api";

export default function SecurityLoginScreen() {
  const router = useRouter();

  // State cho form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // --- MỚI: State cho checkbox ---
  const [rememberMe, setRememberMe] = useState(false);

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

    // Logic tải lại thông tin đã lưu (nếu có)
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync("savedEmail");
        const savedPassword = await SecureStore.getItemAsync("savedPassword");
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Không tải được thông tin lưu trữ");
      }
    };
    loadSavedCredentials();
  }, []);

  const handleSecurityLogin = async () => {
    // 1. Validate nhanh
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setLoading(true);
    let errorMessage: string | null = null;
    let loginSuccess = false;

    try {
      // Gọi API
      const response = await apiClient.post("/api/auth/login", {
        email: email,
        password: password,
      });

      const data = response.data;

      if (data && data.accessToken) {
        // --- THÀNH CÔNG ---
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        if (data.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        }

        if (rememberMe) {
          await SecureStore.setItemAsync("savedEmail", email);
          await SecureStore.setItemAsync("savedPassword", password);
        } else {
          await SecureStore.deleteItemAsync("savedEmail");
          await SecureStore.deleteItemAsync("savedPassword");
        }

        loginSuccess = true;
      } else {
        errorMessage = "Phản hồi từ máy chủ không hợp lệ.";
      }
    } catch (error: any) {
      // --- XỬ LÝ LỖI & VIỆT HÓA ---
      // Đã bỏ console.error theo yêu cầu của bạn

      if (error.response) {
        // Lấy message gốc từ BE (thường là tiếng Anh)
        const serverMsg = (error.response.data?.message || "").toLowerCase();
        const statusCode = error.response.status;

        // Mapping lỗi sang tiếng Việt
        if (
          statusCode === 401 ||
          serverMsg.includes("invalid") ||
          serverMsg.includes("unauthorized")
        ) {
          errorMessage = "Tài khoản hoặc mật khẩu không chính xác.";
        } else if (statusCode === 404 || serverMsg.includes("not found")) {
          errorMessage = "Tài khoản này không tồn tại trên hệ thống.";
        } else if (statusCode === 403 || serverMsg.includes("forbidden")) {
          errorMessage = "Bạn không có quyền truy cập vào cổng bảo vệ này.";
        } else if (statusCode >= 500) {
          errorMessage = "Máy chủ đang gặp sự cố, vui lòng thử lại sau.";
        } else {
          errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
        }
      } else if (error.request) {
        // Lỗi không kết nối được (mất mạng, server die)
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra internet.";
      } else {
        errorMessage = "Đã xảy ra lỗi không xác định.";
      }
    } finally {
      // Tắt loading trước
      setLoading(false);

      if (loginSuccess) {
        // Nếu thành công thì chuyển trang
        router.replace("/(tabs)/home");
      } else if (errorMessage) {
        // Nếu thất bại thì hiện thông báo tiếng Việt đã map
        setTimeout(() => {
          Alert.alert("Đăng nhập thất bại", errorMessage || "");
        }, 100);
      }
    }
  };

  return (
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
                  value={email}
                  onChangeText={setEmail}
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

              {/* --- MỚI: Checkbox UI --- */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                activeOpacity={0.8}
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
              {/* ------------------------- */}
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
    // --- THAY ĐỔI: Dùng flex-start để dồn nội dung lên trên ---
    justifyContent: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40, // Tạo khoảng cách để form không dính sát header
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
  // --- CSS MỚI CHO CHECKBOX ---
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    alignSelf: "flex-start", // Căn trái
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
  checkboxChecked: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: "white",
    borderRadius: 2,
  },
  checkboxLabel: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  // -----------------------------
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
    marginTop: "auto", // --- Đẩy footer xuống đáy ---
    marginBottom: 10,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
  },
});
