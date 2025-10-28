import { Tag } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Booking, Room } from "../../utils/bookingTypes";
import BookingDetailsInfo from "../common/BookingDetailsInfo";

type Props = {
  room: Room;
  selectedDate: Date;
  selectedSlot: string;
};

export default function RoomAvailabilityCard({
  room: r,
  selectedDate,
  selectedSlot,
}: Props) {
  const matchingBooking = useMemo(() => {
    const selectedDateISO = selectedDate.toISOString().slice(0, 10);
    return r.bookings.find(
      (b: Booking) =>
        Array.isArray(b.slots) &&
        b.slots.some(
          // Logic này khớp với kiểu `slots` mới
          (s) => String(s.day) === selectedDateISO && s.slotId === selectedSlot
        )
    );
  }, [r.bookings, selectedDate, selectedSlot]);

  const hasSelected = !!matchingBooking;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}>
            <Tag size={20} color="#EA580C" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{r.name || r.id}</Text>
            <Text style={styles.cardInfo}>
              Tổng: {r.bookings.length} lượt đặt
            </Text>
          </View>
        </View>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badge,
              hasSelected ? styles.badgeBooked : styles.badgeAvailable,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                hasSelected
                  ? styles.badgeTextBooked
                  : styles.badgeTextAvailable,
              ]}
            >
              {hasSelected ? "Đã đặt" : "Còn trống"}
            </Text>
          </View>
        </View>
      </View>

      {hasSelected && matchingBooking && (
        <View style={styles.detailsContainer}>
          {/* SỬ DỤNG COMPONENT CHUNG */}
          <BookingDetailsInfo
            type={matchingBooking.type}
            devices={matchingBooking.devices} // Truyền đúng kiểu `Device[]`
            deviceTitle="Thiết bị sử dụng"
          />
        </View>
      )}
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE8DA",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 64,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
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
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardInfo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  badgeContainer: {
    flexShrink: 0,
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeBooked: {
    backgroundColor: "#FFF7ED",
  },
  badgeTextBooked: {
    color: "#EA580C",
  },
  badgeAvailable: {
    backgroundColor: "#ECFDF5",
  },
  badgeTextAvailable: {
    color: "#065F46",
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 12,
    paddingTop: 12,
  },
});
