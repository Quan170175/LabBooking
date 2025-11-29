import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Wrench } from "lucide-react-native";

interface SubmitBtnProps {
  onPress: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  label?: string;
}

export default function MaintenanceSubmitButton({
  onPress,
  disabled,
  isSubmitting,
  label = "Xác nhận Bảo trì",
}: SubmitBtnProps) {
  return (
    <TouchableOpacity
      style={[styles.submitButton, disabled && styles.submitButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {isSubmitting ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Wrench size={20} color="white" />
          <Text style={styles.submitButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
