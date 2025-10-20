import { LoginForm } from '@/components/auth';
import { BrandColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    Alert.alert('Thành công', 'Đăng nhập thành công!', [
      {
        text: 'OK',
        onPress: () => {
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleRegister = () => {
    router.replace('/(auth)/register' as any);
  };

  const handleForgotPassword = () => {
    Alert.alert('Quên mật khẩu', 'Tính năng đặt lại mật khẩu sẽ được triển khai sớm.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LoginForm
            onSubmit={handleLogin}
            onRegisterPress={handleRegister}
            onForgotPasswordPress={handleForgotPassword}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
