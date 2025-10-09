import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { DatePickerInput } from './DatePickerInput';
import { DropdownInput, DropdownOption } from './DropdownInput';
import { FormInput } from './FormInput';
import { PrimaryButton } from './PrimaryButton';

interface ProfileFormData {
  phoneNumber: string;
  fullName: string;
  firstName: string;
  dateOfBirth: Date | undefined;
  gender: string;
  email: string;
}

const GENDER_OPTIONS: DropdownOption[] = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

export function ProfilePage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    phoneNumber: '096***350',
    fullName: '',
    firstName: '',
    dateOfBirth: undefined,
    gender: 'male',
    email: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    
    try {
      // Implement your API call here
      // Example: await updateUserProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Profile updated:', formData);
      
      // Show success message or navigate
      // router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title */}
          <View style={styles.headerSection}>
            <ThemedText type="title" style={styles.pageTitle}>
              Thông tin cá nhân
            </ThemedText>
            <ThemedText style={styles.pageSubtitle}>
              Cập nhật thông tin để hoàn thiện hồ sơ
            </ThemedText>
          </View>

          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#E07B53" />
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <ThemedText type="defaultSemiBold" style={styles.userName}>
                Trần Minh Phúc
              </ThemedText>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color="#687076" />
                <ThemedText style={styles.phoneNumber}>
                  {formData.phoneNumber}
                </ThemedText>
              </View>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.statusText}>Đã xác thực</ThemedText>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Thông tin cơ bản
            </ThemedText>

            <FormInput
              label="Số điện thoại"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              editable={false}
              icon="lock-closed"
              keyboardType="phone-pad"
            />

            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <FormInput
                  label="Họ và tên lót"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="Nhập họ"
                />
              </View>
              <View style={styles.nameFieldSmall}>
                <FormInput
                  label="Tên"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="Nhập tên"
                />
              </View>
            </View>

            <DatePickerInput
              label="Ngày sinh"
              value={formData.dateOfBirth}
              onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
              placeholder="DD/MM/YYYY"
              maximumDate={new Date()}
            />

            <DropdownInput
              label="Giới tính"
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value })}
              options={GENDER_OPTIONS}
              placeholder="Chọn giới tính"
            />
          </View>

          {/* Contact Section */}
          <View style={styles.formSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Thông tin liên hệ
            </ThemedText>

            <FormInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="example@fpt.edu.vn"
              keyboardType="email-address"
            />
          </View>

          {/* Info Notice */}
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle-outline" size={20} color="#687076" />
            <ThemedText style={styles.infoText}>
              Thông tin của bạn được bảo mật và chỉ dùng cho mục đích đặt phòng Lab
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Cập nhật thông tin"
              onPress={handleUpdateProfile}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    marginBottom: 8,
    color: '#2D2D2D',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 6,
    color: '#2D2D2D',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#687076',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#2D2D2D',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  nameField: {
    flex: 2,
  },
  nameFieldSmall: {
    flex: 1,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#687076',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
});

