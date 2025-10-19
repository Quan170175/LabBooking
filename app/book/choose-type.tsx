import { useRouter } from "expo-router";
import { Book, Briefcase } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BookingCard from "../../components/booking/BookingCard";

export default function BookChooseType() {
  const router = useRouter();

  const handleSelectType = (type: "teaching" | "project") => {
    router.replace({
      pathname: "/book/rooms" as any,
      params: { type: type },
    });
  };

  return (
    <Pressable onPress={() => router.back()} style={styles.overlay}>
      <Pressable style={styles.container}>
        <Text style={styles.headerTitle}>Chọn loại đặt phòng</Text>

        <BookingCard
          layout="option"
          onPress={() => handleSelectType("teaching")}
        >
          <View style={styles.iconWrapper}>
            <Book size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch dạy học</Text>
            <Text style={styles.optionDesc}>Chọn phòng lab và nhiều slot</Text>
          </View>
        </BookingCard>

        <BookingCard
          layout="option"
          onPress={() => handleSelectType("project")}
        >
          <View style={styles.iconWrapper}>
            <Briefcase size={24} color="#C2410C" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Đặt lịch dự án</Text>
            <Text style={styles.optionDesc}>
              Chỉ chọn 1 slot, có thể mời thành viên
            </Text>
          </View>
        </BookingCard>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-start",
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    gap: 16,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { color: "#0F172A", fontWeight: "600", fontSize: 16 },
  optionDesc: { color: "#64748B", fontSize: 13, marginTop: 2 },
  closeButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 16,
  },
  closeButtonText: { fontSize: 18, color: "white" },
});
