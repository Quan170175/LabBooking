import { useRouter } from "expo-router";
import {
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  Clock3,
  LifeBuoy,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Kiểu dữ liệu cho mỗi chức năng
type FunctionItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
};

// Danh sách các chức năng
const functions: FunctionItem[] = [
  {
    icon: CalendarCheck2,
    title: "Đặt Lab",
    description: "Chọn phòng, ngày, giờ cho buổi thực hành",
    to: "/book/choose-type",
  },
  {
    icon: Clock3,
    title: "Lịch sử đặt",
    description: "Theo dõi các yêu cầu đã gửi và trạng thái phê duyệt",
    to: "/my-bookings",
  },
  {
    icon: ClipboardList,
    title: "Tình trạng phòng",
    description: "Kiểm tra lab còn trống theo ngày/ca",
    to: "/availability",
  },
  {
    icon: LifeBuoy,
    title: "Hỗ trợ",
    description: "Gửi yêu cầu trợ giúp tới ban quản lý lab",
    to: "/support",
  },
];

export default function Settings() {
  const router = useRouter();

  // Hàm xử lý khi nhấn vào một chức năng
  const handleNavigation = (path: string) => {
    // Chỉ điều hướng đến luồng đặt lab đã được triển khai
    if (path === "/book/choose-type") {
      router.push(path as any);
    } else {
      Alert.alert(
        "Chức năng đang phát triển",
        "Chức năng này sẽ sớm được cập nhật."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chức năng</Text>
        <Text style={styles.headerSubtitle}>
          Truy cập nhanh các thao tác thường dùng cho việc đặt phòng lab.
        </Text>
      </View>

      <View style={styles.listContainer}>
        {functions.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.title}
              style={styles.listItem}
              onPress={() => handleNavigation(item.to)}
            >
              <View style={styles.listItemContent}>
                <View style={styles.iconContainer}>
                  <Icon size={20} color="#EA580C" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#FDBA74" />
            </TouchableOpacity>
          );
        })}
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  listContainer: {
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF7ED",
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  itemDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
});
