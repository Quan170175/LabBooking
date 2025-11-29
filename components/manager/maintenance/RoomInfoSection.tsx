import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Building2, MapPin, User } from "lucide-react-native";

interface RoomInfoProps {
  isLoading: boolean;
  labName?: string;
  location?: string;
  managerName?: string;
}

export default function RoomInfoSection({
  isLoading,
  labName,
  location,
  managerName,
}: RoomInfoProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Building2 size={18} color="#EA580C" />
        <Text style={styles.sectionTitle}>Thông tin phòng</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color="#EA580C" />
      ) : (
        <View style={styles.roomInfoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phòng Lab</Text>
              <Text style={styles.infoValue}>{labName || "N/A"}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Địa điểm</Text>
              <Text style={styles.infoValue}>{location || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
              <User size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Quản lý phụ trách</Text>
              <Text style={styles.infoValue}>{managerName || "N/A"}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#334155" },
  roomInfoContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
    marginLeft: 52,
  },
});
