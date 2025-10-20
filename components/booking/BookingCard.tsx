import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type BookingCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  layout?: "default" | "option";
  style?: StyleProp<ViewStyle>;
};

export default function BookingCard({
  children,
  onPress,
  layout = "default",
  style,
}: BookingCardProps) {
  const cardStyles: StyleProp<ViewStyle> = [
    styles.card,
    layout === "option" ? styles.optionLayout : styles.defaultLayout,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={cardStyles}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFE8DA",
  },
  defaultLayout: {
    justifyContent: "space-between",
  },
  optionLayout: {
    justifyContent: "flex-start",
    gap: 16,
  },
});
