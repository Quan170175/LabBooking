import { Calendar, Tag, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  booking: any;
  slotTemplates: any[];
  onRemove: (id: string) => void;
  showCancelButton?: boolean;
  onPress?: () => void;
};

export default function BookingHistoryCard({
  booking: b,
  slotTemplates,
  onRemove,
  showCancelButton = true,
  onPress,
}: Props) {
  const status = b.status?.toLowerCase() || "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isCancelled = ["cancelled", "denied", "expired"].includes(status);

  const [isExpanded, setIsExpanded] = useState(false);

  // --- LOGIC HIỂN THỊ SLOT ---
  const slotsDisplay = useMemo(() => {
    if (!b.slots || b.slots.length === 0) return ["Nhấn vào để xem chi tiết"];

    const grouped: Record<string, string[]> = {};
    b.slots.forEach((s: any) => {
      try {
        const dateObj = new Date(s.date);
        const dateStr = dateObj.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
        const template = slotTemplates.find((t) => t.id === s.slotId);
        const slotName = template
          ? template.label.split("(")[0].trim()
          : "Slot";
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(slotName);
      } catch (e) {
        return;
      }
    });
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const [dA, mA] = a.split("/");
      const [dB, mB] = b.split("/");
      return (
        parseInt(mA) * 31 + parseInt(dA) - (parseInt(mB) * 31 + parseInt(dB))
      );
    });
    const lines = sortedDates.map((date) => {
      const slotNames = grouped[date].sort().join(", ");
      return `• Ngày ${date}: ${slotNames}`;
    });
    if (isExpanded) return lines;
    if (lines.length > 2)
      return [lines[0], lines[1], `...và ${lines.length - 2} ngày khác.`];
    return lines;
  }, [b.slots, slotTemplates, isExpanded]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        <View style={styles.cardIcon}>
          <Tag size={20} color="#EA580C" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {b.labName || "Phòng Lab"}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {b.title}
              </Text>

              {/* SLOT LIST */}
              <View style={styles.slotContainer}>
                <Calendar size={12} color="#64748B" style={{ marginTop: 3 }} />
                <View style={{ flex: 1 }}>
                  {slotsDisplay.map((line: string, idx: number) => (
                    <Text key={idx} style={styles.cardSlots}>
                      {line.split(":")[0]}:{" "}
                      <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                        {line.split(":")[1]}
                      </Text>
                    </Text>
                  ))}
                </View>
              </View>

              {b.slots?.length > 2 && (
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                  <Text style={styles.toggleText}>
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              <View
                style={[
                  styles.badge,
                  isApproved
                    ? styles.badgeApproved
                    : isRejected || isCancelled
                    ? styles.badgeRejected
                    : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isApproved
                      ? styles.badgeTextApproved
                      : isRejected || isCancelled
                      ? styles.badgeTextRejected
                      : styles.badgeTextPending,
                  ]}
                >
                  {isApproved
                    ? "Đã duyệt"
                    : isRejected || isCancelled
                    ? "Từ chối"
                    : "Chờ duyệt"}
                </Text>
              </View>

              {/* [FIXED] Nút Hủy bấm được, gọi hàm onRemove từ cha */}
              {!isApproved &&
                !isRejected &&
                !isCancelled &&
                showCancelButton && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { zIndex: 10 }]}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    onPress={() => onRemove(b.id)}
                  >
                    <Trash2 size={14} color="#64748B" />
                    <Text style={styles.deleteButtonText}>Hủy</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Loại: {b.type}</Text>
            {b.courseResponse && (
              <Text style={styles.detailText}>
                Môn: {b.courseResponse.courseCode}
              </Text>
            )}
            {b.projectResponse && (
              <Text style={styles.detailText}>
                DA: {b.projectResponse.projectName}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  cardSlots: { fontSize: 13, color: "#64748B", lineHeight: 20 },
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
