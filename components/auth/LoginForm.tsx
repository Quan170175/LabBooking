import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onRegisterPress: () => void;
  onForgotPasswordPress: () => void;
}

export function LoginForm({ onSubmit, onRegisterPress, onForgotPasswordPress }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo/Icon Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="person-circle" size={80} color={BrandColors.primary} />
        </View>
        <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitleText}>Đăng nhập để tiếp tục</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tên đăng nhập</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tài khoản của bạn"
              placeholderTextColor={BrandColors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Nhập mật khẩu của bạn"
              placeholderTextColor={BrandColors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={BrandColors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={onForgotPasswordPress} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        {/* <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View> */}

        {/* Register Link */}
        {/* <View style={styles.registerSection}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onRegisterPress}>
            <Text style={styles.registerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: BrandColors.textMuted,
  },
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: BrandColors.white,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: BrandColors.textSecondary,
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: BrandColors.primary,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BrandColors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.white,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColors.border,
  },
  dividerText: {
    fontSize: 14,
    color: BrandColors.textMuted,
    marginHorizontal: 16,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  registerLink: {
    fontSize: 14,
    color: BrandColors.primary,
    fontWeight: '600',
  },
});
