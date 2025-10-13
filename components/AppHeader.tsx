import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Menu } from "lucide-react-native";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AppHeader() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#f97316", "#ea580c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => console.log("Open menu")}
            style={styles.menuButton}
            accessibilityLabel="Open menu"
          >
            <Menu size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.8}
          >
            <View style={styles.centerText}>
              <Text style={styles.eduText}>FPT Education</Text>
              <Text style={styles.uniText}>FPT UNIVERSITY</Text>
              <Text style={styles.labText}>Lab Booking</Text>
            </View>
          </TouchableOpacity>

          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#ea580c" },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 8,
    borderRadius: 999,
  },
  centerText: { alignItems: "center" },
  eduText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.9,
    color: "white",
    letterSpacing: 1,
  },
  uniText: { fontSize: 14, fontWeight: "800", color: "white" },
  labText: { fontSize: 10, fontWeight: "500", opacity: 0.9, color: "white" },
});
