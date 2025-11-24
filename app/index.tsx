import { LinearGradient } from "expo-linear-gradient";
import { useRouter, Stack } from "expo-router"; // Đã thêm Stack vào đây
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

// Đảm bảo đường dẫn ảnh đúng (từ thư mục app ra assets)
const LOGO_IMAGE = require("../assets/images/flms.png");

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();

  // --- 1. KHỞI TẠO VỊ TRÍ ANIMATION ---
  // Logo: Bắt đầu từ trên trời (-500)
  const logoTranslateY = useSharedValue(-SCREEN_HEIGHT / 2 - 200);

  // Text: Bắt đầu từ dưới đất (+500)
  const textTranslateY = useSharedValue(SCREEN_HEIGHT / 2 + 200);

  // --- 2. STYLE ANIMATION ---
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
  }));

  // --- 3. LOGIC CHẠY ---
  useEffect(() => {
    // Tắt màn hình chờ mặc định của Expo
    SplashScreen.hideAsync();

    // Cấu hình độ nảy
    const springConfig = { damping: 12, stiffness: 90, mass: 1 };

    // Bắt đầu chạy Animation
    logoTranslateY.value = withDelay(100, withSpring(0, springConfig));
    textTranslateY.value = withDelay(100, withSpring(0, springConfig));

    // Đợi 2.5 giây (để người dùng ngắm Logo) rồi chuyển trang sang Login
    const timer = setTimeout(() => {
      // Dùng replace để người dùng không bấm nút Back quay lại màn hình chờ được
      router.replace("/(user)/login");
    }, 2500);

    return () => clearTimeout(timer); // Dọn dẹp nếu người dùng thoát app sớm
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- DÒNG QUAN TRỌNG ĐỂ ẨN HEADER "index" --- */}
      <Stack.Screen options={{ headerShown: false }} />

      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFF7ED", "#FFFFFF", "#FFEDD5"]}
        style={styles.container}
      >
        {/* Trang trí nền (Blobs) */}
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <View style={styles.centerContent}>
          {/* Logo FLMS */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={LOGO_IMAGE}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Text FPT UNIVERSITY */}
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <Text style={styles.universityName}>FPT UNIVERSITY</Text>
            <Text style={styles.systemName}>Lab Management System</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Style nền đốm sáng
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },
  glowTop: { top: -50, left: -50, backgroundColor: "#FED7AA" },
  glowBottom: { bottom: -50, right: -50, backgroundColor: "#FDBA74" },

  // Style nội dung chính
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: { width: 150, height: 150 }, // Kích thước logo
  textContainer: { alignItems: "center" },
  universityName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#EA580C",
    letterSpacing: 1,
    marginBottom: 5,
  },
  systemName: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
});
