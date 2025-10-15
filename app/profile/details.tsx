import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Lock,
  UserRound,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileDetails() {
  const router = useRouter();

  const handleUpdate = () => {
    Alert.alert("Thành công", "Thông tin của bạn đã được cập nhật.");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={18} color="#C2410C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      {/* Profile Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <UserRound size={32} color="#EA580C" />
        </View>
        <View>
          <Text style={styles.summaryName}>Trần Minh Phúc</Text>
          <Text style={styles.summaryPhone}>096•••350</Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Số điện thoại</Text>
            <Lock size={16} color="#F97316" />
          </View>
          <TextInput
            value="096 ••• 350"
            editable={false} // Sử dụng editable cho React Native
            style={[styles.input, styles.readOnlyInput]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và tên lót</Text>
          <TextInput
            defaultValue="Trần Minh"
            style={styles.input}
            placeholder="Nhập họ và tên lót..."
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên</Text>
          <TextInput
            defaultValue="Phúc"
            style={styles.input}
            placeholder="Nhập tên..."
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ngày sinh</Text>
            <View>
              <TextInput
                defaultValue="09/09/2003"
                style={styles.input}
                placeholder="DD/MM/YYYY"
              />
              <Calendar size={18} color="#EA580C" style={styles.inputIcon} />
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Giới tính</Text>
            <TouchableOpacity style={styles.picker}>
              <Text style={styles.pickerText}>Nam</Text>
              <ChevronDown size={18} color="#EA580C" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="phuctmse173500@fpt.edu.vn"
            style={styles.input}
            keyboardType="email-address"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.updateButtonText}>Cập nhật thông tin</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFEDD5",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryPhone: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    gap: 20,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 14,
    borderColor: "#FFEDD5",
    borderWidth: 1,
    color: "#1E293B",
  },
  readOnlyInput: {
    color: "#64748B",
  },
  inputIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderColor: "#FFEDD5",
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 14,
    color: "#1E293B",
  },
  updateButton: {
    marginTop: 24,
    width: "100%",
    backgroundColor: "#EA580C",
    borderRadius: 24,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
