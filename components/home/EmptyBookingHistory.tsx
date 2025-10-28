import { Link } from "expo-router";
import { CalendarCheck } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function EmptyBookingHistory() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.title}>Lịch sử đặt</Text>
      <Text style={styles.subtitle}>Bạn chưa có lịch đặt nào.</Text>
      <Link href="/book/choose-type" asChild>
        <TouchableOpacity style={styles.ctaButton}>
          <CalendarCheck size={16} color="white" />
          <Text style={styles.ctaButtonText}>Bắt đầu đặt phòng</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF7ED",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 24,
  },
  ctaButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
