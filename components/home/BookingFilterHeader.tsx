import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type StatusFilter = "all" | "approved" | "pending";
type Props = {
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "approved", label: "Đã duyệt" },
  { id: "pending", label: "Chưa duyệt" },
];

export default function BookingFilterHeader({
  statusFilter,
  onFilterChange,
}: Props) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử đặt</Text>
        <Text style={styles.subtitle}>
          Quản lý các yêu cầu bạn đã gửi trước đây
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Lọc:</Text>

        {/* --- THAY ĐỔI: Thêm 1 View bao bọc các nút --- */}
        <View style={styles.buttonGroup}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                statusFilter === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => onFilterChange(filter.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === filter.id && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* ------------------------------------------- */}
      </View>
    </>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    marginTop: 16,
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
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    // --- THAY ĐỔI: Bỏ gap ở đây ---
    // gap: 10,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: "#475569",
    marginRight: 8, // --- THAY ĐỔI: Tăng margin ---
  },

  // --- THAY ĐỔI: Thêm nhóm nút ---
  buttonGroup: {
    flex: 1, // Chiếm hết phần còn lại
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Thêm gap giữa các nút
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FFE8DA",
    flex: 1, // --- THAY ĐỔI: Chia đều chiều rộng ---
  },
  filterButtonActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EA580C",
    textAlign: "center", // --- THAY ĐỔI: Căn giữa chữ ---
  },
  filterButtonTextActive: {
    color: "white",
  },
});
