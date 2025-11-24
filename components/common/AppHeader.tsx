import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from "react-native";

export default function AppHeader() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* StatusBar chữ trắng trên nền cam */}
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#f97316", "#ea580c"]} // Gradient Cam chủ đạo
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.container}>
            {/* --- Cụm Logo + Text (Căn giữa hoặc trái tùy thích, ở đây để căn giữa cho cân đối vì ko có nút phải) --- */}
            <TouchableOpacity
              style={styles.contentWrapper}
              onPress={() => router.push("/(tabs)/home")}
              activeOpacity={0.85}
            >
              {/* Logo Box: Nền trắng để nổi bật */}
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>F</Text>
              </View>

              {/* Text Info: Chữ trắng */}
              <View style={styles.textContainer}>
                <Text style={styles.uniText}>FPT UNIVERSITY</Text>
                <Text style={styles.subText}>Lab Booking Platform</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#ea580c", // Fallback color
    zIndex: 10,
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  gradient: {
    paddingTop: Platform.OS === "android" ? 10 : 0, // Padding cho Android statusbar
    paddingBottom: 12,
    paddingHorizontal: 16,
    // Shadow nhẹ
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  container: {
    height: 50, // Chiều cao nội dung header
    justifyContent: "center", // Căn giữa theo chiều dọc
    alignItems: "center", // Căn giữa theo chiều ngang (vì không còn nút bên phải)
  },

  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // Logo Box (Nền trắng)
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // Shadow nhỏ cho logo
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoText: {
    color: "#ea580c", // Chữ F màu cam
    fontWeight: "900",
    fontSize: 22,
  },

  // Text Container
  textContainer: {
    justifyContent: "center",
  },
  uniText: {
    fontSize: 16,
    fontWeight: "800",
    color: "white", // Chữ trắng
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)", // Chữ trắng mờ nhẹ
    marginTop: 2,
  },
});
