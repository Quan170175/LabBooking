// (user)/login.tsx
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

// *** 1. IMPORT apiClient ***
// (Giả sử file api.ts nằm trong thư mục utils ở gốc)
import apiClient from "../../api/api";

// Component GoogleGlyph (giữ nguyên)
const GoogleGlyph = () => (
  <Svg height={20} width={20} viewBox="0 0 24 24">
    {/* ... (các thẻ Path) ... */}
    <Path
      d="M23.52 12.273c0-.851-.075-1.67-.216-2.455H12v4.64h6.484a5.54 5.54 0 0 1-2.405 3.635v3.02h3.89c2.276-2.096 3.58-5.186 3.58-8.84"
      fill="#4285F4"
    />
    <Path
      d="M12 24c3.24 0 5.957-1.073 7.943-2.887l-3.889-3.02c-1.082.726-2.468 1.152-4.054 1.152-3.116 0-5.756-2.104-6.703-4.946H1.307v3.11A11.996 11.996 0 0 0 12 24"
      fill="#34A853"
    />
    <Path
      d="M5.297 14.299A7.214 7.214 0 0 1 4.921 12c0-.798.137-1.571.376-2.299V6.591H1.307A11.996 11.996 0 0 0 0 12c0 1.913.458 3.72 1.307 5.409z"
      fill="#FBBC05"
    />
    <Path
      d="M12 4.75c1.768 0 3.354.608 4.602 1.802l3.452-3.452C17.95 1.177 15.233 0 12 0 7.307 0 3.266 2.69 1.307 6.591l3.99 3.11C6.244 6.854 8.884 4.75 12 4.75"
      fill="#EA4335"
    />
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();

  // (Giữ nguyên các giá trị Animated)
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-100);
  const mainOpacity = useSharedValue(0);
  const mainTranslateY = useSharedValue(100);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(100);
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const animatedMainStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [{ translateY: mainTranslateY.value }],
  }));
  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  // (Giữ nguyên useEffect)
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "317167237519-3bn2trq7crhc9sm57a9f695crc9idj8e.apps.googleusercontent.com",
      iosClientId:
        "317167237519-9e80jt1rdcqkdbane352msd5gfnpti95.apps.googleusercontent.com",
      scopes: ["profile", "email"],
    });

    const opacityConfig = { duration: 600 };
    const springConfig = { damping: 12, stiffness: 90 };
    headerOpacity.value = withTiming(1, opacityConfig);
    headerTranslateY.value = withSpring(0, springConfig);
    mainOpacity.value = withDelay(100, withTiming(1, opacityConfig));
    mainTranslateY.value = withDelay(100, withSpring(0, springConfig));
    footerOpacity.value = withDelay(200, withTiming(1, opacityConfig));
    footerTranslateY.value = withDelay(200, withSpring(0, springConfig));
  }, []);

  // *** 2. CẬP NHẬT HÀM signIn ***
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("User Info Object:", JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.data ? userInfo.data.idToken : null;

      if (idToken) {
        console.log("Đang gửi idToken đến backend (sử dụng apiClient)...");

        // *** THAY THẾ FETCH BẰNG apiClient.post ***
        // axios tự động stringify body và parse JSON response
        const response = await apiClient.post("/api/GoogleLoign/google", {
          idToken: idToken,
        });

        // Nếu thành công (status 2xx), data nằm trong response.data
        const data = response.data;
        console.log(
          "Backend response data (đã parse):",
          JSON.stringify(data, null, 2)
        );

        // (Phần lưu token giữ nguyên)
        const accessToken = data.accessToken;
        const refreshToken = data.refreshToken;

        if (accessToken) {
          await SecureStore.setItemAsync("accessToken", accessToken);
          console.log("Đã lưu accessToken");
        } else {
          console.warn("CẢNH BÁO: Backend không trả về 'accessToken'");
        }

        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
          console.log("Đã lưu refreshToken");
        } else {
          console.warn("CẢNH BÁO: Backend không trả về 'refreshToken'");
        }

        // (Phần điều hướng giữ nguyên)
        if (accessToken) {
          router.replace("/(tabs)/home");
        } else {
          Alert.alert(
            "Lỗi Đăng Nhập",
            "Đăng nhập thành công nhưng không nhận được accessToken từ server."
          );
        }
      } else {
        Alert.alert("Lỗi", "Không lấy được idToken từ Google.");
      }
    } catch (error: any) {
      // Thêm 'any' cho TypeScript
      console.error("Lỗi trong quá trình đăng nhập hoặc gọi API:", error);

      // *** 3. CẬP NHẬT XỬ LÝ LỖI CHO AXIOS ***
      if (error.response) {
        // Lỗi đến từ server (e.g., 400, 403, 500)
        const errorMessage =
          error.response.data?.message || "Có lỗi xảy ra từ server.";
        Alert.alert(`Lỗi từ Server (${error.response.status})`, errorMessage);
      } else if (isErrorWithCode(error)) {
        // Xử lý lỗi của Google Sign-In (GIỮ NGUYÊN)
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("Người dùng đã hủy đăng nhập");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("Đăng nhập đang được xử lý");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Lỗi", "Dịch vụ Google Play không khả dụng.");
            break;
          default:
            Alert.alert("Lỗi đăng nhập Google", `Code: ${error.code}`);
        }
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được phản hồi (lỗi mạng)
        Alert.alert(
          "Lỗi Mạng",
          "Không thể kết nối đến server. Vui lòng kiểm tra lại mạng."
        );
      } else {
        // Lỗi khác
        Alert.alert(
          "Lỗi không xác định",
          (error as Error).message || "Vui lòng thử lại."
        );
      }
    }
  };

  // (Phần return giao diện giữ nguyên)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFEDD5", "#FFFFFF", "#FEF3C7"]}
        style={styles.container}
      >
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <View style={styles.content}>
          <Animated.View style={[styles.headerContainer, animatedHeaderStyle]}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>F</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>FPT UNIVERSITY</Text>
                <Text style={styles.headerSubtitle}>Lab Booking Platform</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.main, animatedMainStyle]}>
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <Text style={styles.mainTitle}>
              Chào mừng đến hệ thống Lab Booking
            </Text>
            <Text style={styles.description}>
              Đăng nhập để đặt phòng thực hành, theo dõi lịch và quản lý hoạt
              động học tập của bạn.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.footerContainer, animatedFooterStyle]}>
            <View style={styles.actionArea}>
              <TouchableOpacity style={styles.button} onPress={signIn}>
                <GoogleGlyph />
                <Text style={styles.buttonText}>Đăng nhập bằng Google</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Việc đăng nhập đồng nghĩa bạn đồng ý với Điều khoản sử dụng và
                Chính sách bảo mật của FPT University.
              </Text>
            </View>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} FPT University · Lab Booking
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// (Phần styles giữ nguyên)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    paddingVertical: 40,
  },
  headerContainer: {
    width: "100%",
    alignItems: "center",
  },
  footerContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
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
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  main: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  welcomeText: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  mainTitle: {
    color: "#1E293B",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: "#475569",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  actionArea: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 20,
    borderRadius: 12,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 16,
  },
});
