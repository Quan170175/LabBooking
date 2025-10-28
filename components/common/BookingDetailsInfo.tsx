import { StyleSheet, Text, View } from "react-native";
import { Device } from "../../utils/bookingTypes";
import { formatDevices } from "../../utils/bookingUtils";

type Props = {
  type: string;
  devices: Device[]; // Đã cập nhật type
  deviceTitle?: string;
};

export default function BookingDetailsInfo({
  type,
  devices,
  deviceTitle = "Thiết bị",
}: Props) {
  return (
    <>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>Loại: {type || "N/A"}</Text>
      </View>
      <View style={styles.deviceSection}>
        <Text style={styles.deviceTitle}>{deviceTitle}</Text>
        <Text style={styles.deviceText}>{formatDevices(devices)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: "#FFF7ED",
  },
  typeBadgeText: {
    color: "#EA580C",
    fontSize: 12,
    fontWeight: "500",
  },
  deviceSection: {
    marginTop: 12,
  },
  deviceTitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  deviceText: {
    fontSize: 14,
    color: "#334155",
  },
});
