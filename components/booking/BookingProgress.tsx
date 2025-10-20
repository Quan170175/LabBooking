import { Building2, Check, Clock, Wrench } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BookingProgressProps = {
  step: number;
};

// Cập nhật: Thêm thuộc tính icon cho mỗi bước
const steps = [
  {
    id: 1,
    label: "Phòng",
    icon: (color: string) => <Building2 size={16} color={color} />,
  },
  {
    id: 2,
    label: "Giờ",
    icon: (color: string) => <Clock size={16} color={color} />,
  },
  {
    id: 3,
    label: "Thiết bị",
    icon: (color: string) => <Wrench size={16} color={color} />,
  },
];

export default function BookingProgress({ step }: BookingProgressProps) {
  return (
    <View style={styles.container}>
      {steps.map((s, index) => {
        const isActive = s.id === step;
        const isCompleted = s.id < step;
        const iconColor = isCompleted || isActive ? "white" : "#94A3B8";

        return (
          <React.Fragment key={s.id}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  (isCompleted || isActive) && styles.activeCircle,
                  isActive && styles.currentCircle,
                ]}
              >
                {/* Cập nhật: Hiển thị icon thay vì số */}
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  s.icon(iconColor)
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  (isCompleted || isActive) && styles.activeLabel,
                ]}
              >
                {s.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.line, isCompleted && styles.activeLine]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  stepItem: { alignItems: "center", zIndex: 1 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeCircle: { backgroundColor: "#EA580C" },
  currentCircle: { borderColor: "#FDBA74" },
  label: { marginTop: 8, fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  activeLabel: { color: "#0F172A", fontWeight: "600" },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#F1F5F9",
    position: "relative",
    top: 17, // Đặt đường kẻ nằm giữa các vòng tròn
    marginHorizontal: -12, // Thu hẹp khoảng cách để đường kẻ chạm vào vòng tròn
    zIndex: 0, // Đảm bảo đường kẻ nằm dưới vòng tròn
  },
  activeLine: { backgroundColor: "#EA580C" },
});
