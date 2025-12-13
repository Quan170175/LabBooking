import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Calendar,
  MapPin,
  MessageSquare,
  User,
  Clock,
  Check,
  X,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react-native";

interface ChangeRequestProps {
  request: {
    id: string;
    userName: string;
    labName: string;
    oldDate: string;
    oldSlots: string[];
    reason: string;
    createdAt: string;
    status: string;
  };
  onPress: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function ChangeRequestSummaryCard({
  request,
  onPress,
  onAccept,
  onReject,
}: ChangeRequestProps) {
  // --- LOGIC RENDER TRẠNG THÁI ---
  const renderStatusOrActions = () => {
    switch (request.status) {
      case "Accepted":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#DCFCE7" }]}>
            <CheckCircle size={14} color="#16A34A" />
            <Text style={[styles.statusText, { color: "#16A34A" }]}>
              Đã chấp nhận
            </Text>
          </View>
        );
      case "Rejected":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
            <XCircle size={14} color="#DC2626" />
            <Text style={[styles.statusText, { color: "#DC2626" }]}>
              Đã từ chối
            </Text>
          </View>
        );
      default: // "Pending"
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.btnReject} onPress={onReject}>
              <X size={16} color="#DC2626" />
              <Text style={styles.textReject}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
              <Check size={16} color="white" />
              <Text style={styles.textAccept}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  // --- 🔥 LOGIC THU GỌN SLOT ---
  const renderSlots = () => {
    const slots = request.oldSlots || [];
    const displaySlots = slots.slice(0, 2); // Chỉ lấy 2 cái đầu
    const remaining = slots.length - 2;

    return (
      <View style={{ flex: 1 }}>
        {displaySlots.map((slot, index) => (
          <Text key={index} style={styles.text} numberOfLines={1}>
            {slot}
          </Text>
        ))}
        {remaining > 0 && (
          <Text style={styles.moreSlotsText}>+ {remaining} slot khác...</Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userRow}>
          <User size={16} color="#64748B" />
          <Text style={styles.userName} numberOfLines={1}>
            {request.userName}
          </Text>
        </View>
        {request.status === "Pending" && (
          <View style={styles.timeBadge}>
            <Clock size={12} color="#EA580C" />
            <Text style={styles.timeText}>Mới</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <MapPin size={16} color="#EA580C" />
          <Text style={styles.text} numberOfLines={1}>
            {request.labName}
          </Text>
        </View>

        {/* Row Ngày */}
        <View style={styles.row}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.text}>{request.oldDate}</Text>
        </View>

        {/* Row Slots (Thu gọn) */}
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <Layers size={16} color="#64748B" style={{ marginTop: 2 }} />
          {renderSlots()}
        </View>
      </View>

      {/* Lý do */}
      <View style={styles.footer}>
        <View style={styles.reasonRow}>
          <MessageSquare size={14} color="#64748B" />
          <Text style={styles.reasonText} numberOfLines={1}>
            "{request.reason}"
          </Text>
        </View>
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>{renderStatusOrActions()}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#334155" },

  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: { fontSize: 11, color: "#EA580C", fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 10 },

  content: { gap: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { fontSize: 14, color: "#475569", fontWeight: "500" },
  // Style cho text "+ N slot khác"
  moreSlotsText: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "600",
    marginTop: 2,
    fontStyle: "italic",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  reasonText: { fontSize: 13, color: "#475569", fontStyle: "italic", flex: 1 },

  actionArea: { marginTop: 4 },
  actionsContainer: { flexDirection: "row", gap: 12 },

  btnReject: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 6,
  },
  textReject: { color: "#DC2626", fontWeight: "600", fontSize: 14 },

  btnAccept: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EA580C",
    gap: 6,
  },
  textAccept: { color: "white", fontWeight: "600", fontSize: 14 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },
  statusText: { fontWeight: "700", fontSize: 14 },
});
