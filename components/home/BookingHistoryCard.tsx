import { Calendar, Tag, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  booking: any;
  slotTemplates: any[]; // [MỚI] Nhận danh sách slot từ cha
  onRemove: (id: string) => void;
};

export default function BookingHistoryCard({
  booking: b,
  slotTemplates,
  onRemove,
}: Props) {
  const status = b.status?.toLowerCase() || "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const [isExpanded, setIsExpanded] = useState(false);

  // --- LOGIC HIỂN THỊ SLOT XỊN XÒ ---
  const slotsDisplay = useMemo(() => {
    if (!b.slots || b.slots.length === 0) return ["Đang cập nhật lịch..."];

    // 1. Gom nhóm theo ngày (Group by Date)
    const grouped: Record<string, string[]> = {};

    b.slots.forEach((s: any) => {
      try {
        // Format ngày: "2025-11-22" -> "22/11"
        const dateObj = new Date(s.date);
        const dateStr = dateObj.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });

        // Tìm tên Slot: id -> "Ca 1"
        // (Giả sử API trả về field 'label' hoặc 'name', bạn check lại API /Slot nhé)
        const template = slotTemplates.find((t) => t.id === s.slotId);
        // Lấy tên ngắn gọn (bỏ phần giờ phía sau nếu có)
        const slotName = template
          ? template.label.split("(")[0].trim()
          : "Slot";

        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(slotName);
      } catch (e) {
        return;
      }
    });

    // 2. Format thành chuỗi: "Ngày 22/11: Ca 1, Ca 2"
    // Sắp xếp ngày tăng dần
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const [dA, mA] = a.split("/");
      const [dB, mB] = b.split("/");
      return (
        parseInt(mA) * 31 + parseInt(dA) - (parseInt(mB) * 31 + parseInt(dB))
      );
    });

    const lines = sortedDates.map((date) => {
      // Sắp xếp tên slot (Ca 1, Ca 2...)
      const slotNames = grouped[date].sort().join(", ");
      return `• Ngày ${date}: ${slotNames}`;
    });

    // 3. Xử lý Thu gọn / Mở rộng
    if (isExpanded) return lines;
    if (lines.length > 2) {
      return [lines[0], lines[1], `...và ${lines.length - 2} ngày khác.`];
    }
    return lines;
  }, [b.slots, slotTemplates, isExpanded]);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardIcon}>
          <Tag size={20} color="#EA580C" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              {/* Tên Phòng */}
              <Text style={styles.cardTitle} numberOfLines={1}>
                {b.labRoomResponse?.labName || "Phòng Lab"}
              </Text>

              {/* Tiêu đề Booking */}
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {b.title}
              </Text>

              {/* --- DANH SÁCH SLOT --- */}
              <View style={styles.slotContainer}>
                <Calendar size={12} color="#64748B" style={{ marginTop: 3 }} />
                <View style={{ flex: 1 }}>
                  {slotsDisplay.map((line: string, idx: number) => (
                    <Text key={idx} style={styles.cardSlots}>
                      {/* Tô đậm phần ngày tháng cho đẹp */}
                      {line.split(":")[0]}:{" "}
                      <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                        {line.split(":")[1]}
                      </Text>
                    </Text>
                  ))}
                </View>
              </View>

              {/* Nút Xem thêm */}
              {b.slots?.length > 2 && ( // Check logic này tùy theo số dòng bạn muốn hiện
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                  <Text style={styles.toggleText}>
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Badge & Actions (Giữ nguyên code cũ) */}
            <View style={styles.cardActions}>
              <View
                style={[
                  styles.badge,
                  isApproved
                    ? styles.badgeApproved
                    : isRejected
                    ? styles.badgeRejected
                    : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isApproved
                      ? styles.badgeTextApproved
                      : isRejected
                      ? styles.badgeTextRejected
                      : styles.badgeTextPending,
                  ]}
                >
                  {isApproved
                    ? "Đã duyệt"
                    : isRejected
                    ? "Từ chối"
                    : "Chờ duyệt"}
                </Text>
              </View>

              {!isApproved && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onRemove(b.id)}
                >
                  <Trash2 size={14} color="#64748B" />
                  <Text style={styles.deleteButtonText}>Hủy</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chi tiết phụ */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Loại: {b.type}</Text>
            {b.courseResponse && (
              <Text style={styles.detailText}>
                Môn: {b.courseResponse.courseCode}
              </Text>
            )}
            {b.projectResponse && (
              <Text style={styles.detailText}>
                Dự án: {b.projectResponse.projectName}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", gap: 12 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },

  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 4,
  },

  slotContainer: { flexDirection: "row", gap: 6, marginTop: 4 },
  cardSlots: { fontSize: 13, color: "#64748B", lineHeight: 20 }, // Tăng lineHeight cho dễ đọc

  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EA580C",
    marginTop: 4,
    marginLeft: 18,
  },

  cardActions: { alignItems: "flex-end", flexShrink: 0 },
  deleteButton: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteButtonText: { fontSize: 12, color: "#64748B" },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeApproved: { backgroundColor: "#ECFDF5" },
  badgeTextApproved: { color: "#065F46" },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeTextPending: { color: "#92400E" },
  badgeRejected: { backgroundColor: "#FEF2F2" },
  badgeTextRejected: { color: "#991B1B" },

  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  detailText: {
    fontSize: 11,
    color: "#475569",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
