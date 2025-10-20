import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BookingPageHeaderProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

export default function BookingPageHeader({
  icon,
  title,
  subtitle,
}: BookingPageHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
});
