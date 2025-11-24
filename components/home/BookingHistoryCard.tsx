import { Tag, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Đường dẫn: app/components/home -> utils
import { Booking } from "../../utils/bookingTypes";
import { isApproved } from "../../utils/bookingUtils";
// Đường dẫn: app/components/home -> app/components/common
import BookingDetailsInfo from "../common/BookingDetailsInfo";

type Props = {
  booking: Booking;
  onRemove: (id: number) => void;
};

// Map hiển thị tên Slot
const SLOTS_MAP: { [key: string]: string } = {
  slot1: "Slot 1",
  slot2: "Slot 2",
  slot3: "Slot 3",
  slot4: "Slot 4",
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch (e) {
    return "N/A";
  }
};

export default function BookingHistoryCard({ booking: b, onRemove }: Props) {
  const approved = isApproved(b);
  const [isExpanded, setIsExpanded] = useState(false);

  // Logic hiển thị slot
  const slotsDisplay = useMemo(() => {
    if (!b.slots || b.slots.length === 0) return ["Không có slot."];
    const formatted = b.slots.map((slot: any) => {
      const label = SLOTS_MAP[slot.slotId] || slot.slotId;
      const date = formatDate(slot.date);
      return `${label} (ngày ${date})`;
    });
    if (isExpanded) return formatted;
    if (formatted.length > 2) {
      return [formatted[0], `...và ${formatted.length - 1} slot khác.`];
    }
    return formatted;
  }, [b.slots, isExpanded]);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardIcon}>
          <Tag size={20} color="#EA580C" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {b.roomName || b.roomId}
              </Text>

              <Text
                style={styles.cardSlots}
                numberOfLines={isExpanded ? 10 : 2}
              >
                {slotsDisplay.join("\n")}
              </Text>

              {b.slots.length > 2 && (
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                  <Text style={styles.toggleText}>
                    {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardActions}>
              <View
                style={[
                  styles.badge,
                  approved ? styles.badgeApproved : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    approved
                      ? styles.badgeTextApproved
                      : styles.badgeTextPending,
                  ]}
                >
                  {approved ? "Đã duyệt" : "Chưa duyệt"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onRemove(b.id)}
              >
                <Trash2 size={14} color="#64748B" />
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <BookingDetailsInfo type={b.type} devices={b.devices} />
          </View>

          {/* --- PHẦN SỬA LỖI OBJECTS NOT VALID AS REACT CHILD --- */}
          {b.invited && b.invited.length > 0 && (
            <View style={styles.invitedContainer}>
              {b.invited.map((guest: any, index: number) => {
                // Kiểm tra xem guest là string (cũ) hay object (mới)
                const guestName =
                  typeof guest === "string" ? guest : guest.name;
                const key =
                  typeof guest === "string" ? guest : guest.email || index;

                return (
                  <View key={key} style={styles.invitedBadge}>
                    <Text style={styles.invitedText}>{guestName}</Text>
                  </View>
                );
              })}
            </View>
          )}
          {/* ----------------------------------------------------- */}
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
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSlots: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 18,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EA580C",
    marginTop: 4,
  },
  cardActions: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
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
  deleteButtonText: {
    fontSize: 12,
    color: "#64748B",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeApproved: {
    backgroundColor: "#ECFDF5",
  },
  badgeTextApproved: {
    color: "#065F46",
  },
  badgePending: {
    backgroundColor: "#FEF2F2",
  },
  badgeTextPending: {
    color: "#B91C1C",
  },
  cardDetails: {
    marginTop: 12,
  },
  invitedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  invitedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
  },
  invitedText: {
    fontSize: 12,
    color: "#475569",
  },
});
