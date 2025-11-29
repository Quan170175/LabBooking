import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { FileText, MessageSquarePlus } from "lucide-react-native";

interface DescriptionProps {
  description: string;
  onChangeText: (text: string) => void;
  onOpenTemplate: () => void;
}

export default function MaintenanceDescriptionSection({
  description,
  onChangeText,
  onOpenTemplate,
}: DescriptionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FileText size={18} color="#EA580C" />
        <Text style={styles.sectionTitle}>Nội dung bảo trì</Text>
      </View>
      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textAreaInput}
          placeholder="Mô tả lỗi hoặc lý do bảo trì..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={onChangeText}
        />
        <TouchableOpacity style={styles.miniFab} onPress={onOpenTemplate}>
          <MessageSquarePlus size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>
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
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    position: "relative",
    height: 120,
  },
  textAreaInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
    paddingBottom: 40,
  },
  miniFab: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
