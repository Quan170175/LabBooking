import React from "react";

import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type BookingButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function BookingButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  isLoading = false,
  style,
}: BookingButtonProps) {
  const buttonStyle: StyleProp<ViewStyle> = [
    styles.button,
    variant === "primary" ? styles.primaryButton : styles.secondaryButton,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.buttonText,
    variant === "primary" ? styles.primaryText : styles.secondaryText,
  ];

  if (disabled || isLoading) {
    buttonStyle.push(styles.disabled);
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : "#334155"}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: "#EA580C",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  primaryText: {
    color: "white",
  },
  secondaryText: {
    color: "#334155",
  },
  disabled: {
    opacity: 0.6,
  },
});
