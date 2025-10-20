// import { BrandColors } from '@/constants/theme';
// import { Ionicons } from '@expo/vector-icons';
// import React, { useState } from 'react';
// import {
//     Alert,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// interface RegisterFormProps {
//   onSubmit: (formData: {
//     fullName: string;
//     email: string;
//     password: string;
//     confirmPassword: string;
//   }) => Promise<void>;
//   onLoginPress: () => void;
// }

// export function RegisterForm({ onSubmit, onLoginPress }: RegisterFormProps) {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const validateForm = () => {
//     const { fullName, email, password, confirmPassword } = formData;

//     if (!fullName || !email || !password || !confirmPassword) {
//       Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
//       return false;
//     }

//     if (!email.includes('@')) {
//       Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ');
//       return false;
//     }

//     if (password.length < 6) {
//       Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
//       return false;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Lỗi', 'Mật khẩu không khớp');
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       await onSubmit(formData);
//     } catch (error) {
//       // Error handling is done in parent component
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Logo/Icon Section */}
//       <View style={styles.logoSection}>
//         <View style={styles.logoContainer}>
//           <Ionicons name="person-add" size={80} color={BrandColors.primary} />
//         </View>
//         <Text style={styles.welcomeText}>Tạo tài khoản</Text>
//         <Text style={styles.subtitleText}>Tham gia cùng chúng tôi ngay hôm nay</Text>
//       </View>

//       {/* Register Form */}
//       <View style={styles.formSection}>
//         <View style={styles.inputContainer}>
//           <Text style={styles.inputLabel}>Họ và tên</Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons name="person-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
//             <TextInput
//               style={styles.textInput}
//               placeholder="Nhập họ và tên của bạn"
//               placeholderTextColor={BrandColors.textMuted}
//               value={formData.fullName}
//               onChangeText={(value) => handleInputChange('fullName', value)}
//               autoCapitalize="words"
//             />
//           </View>
//         </View>

//         <View style={styles.inputContainer}>
//           <Text style={styles.inputLabel}>Email</Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons name="mail-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
//             <TextInput
//               style={styles.textInput}
//               placeholder="Nhập email của bạn"
//               placeholderTextColor={BrandColors.textMuted}
//               value={formData.email}
//               onChangeText={(value) => handleInputChange('email', value)}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//           </View>
//         </View>

//         <View style={styles.inputContainer}>
//           <Text style={styles.inputLabel}>Mật khẩu</Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
//             <TextInput
//               style={styles.textInput}
//               placeholder="Nhập mật khẩu của bạn"
//               placeholderTextColor={BrandColors.textMuted}
//               value={formData.password}
//               onChangeText={(value) => handleInputChange('password', value)}
//               secureTextEntry={!showPassword}
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//             <TouchableOpacity
//               onPress={() => setShowPassword(!showPassword)}
//               style={styles.eyeIcon}
//             >
//               <Ionicons
//                 name={showPassword ? "eye-outline" : "eye-off-outline"}
//                 size={20}
//                 color={BrandColors.textMuted}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.inputContainer}>
//           <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
//           <View style={styles.inputWrapper}>
//             <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textMuted} style={styles.inputIcon} />
//             <TextInput
//               style={styles.textInput}
//               placeholder="Xác nhận mật khẩu của bạn"
//               placeholderTextColor={BrandColors.textMuted}
//               value={formData.confirmPassword}
//               onChangeText={(value) => handleInputChange('confirmPassword', value)}
//               secureTextEntry={!showConfirmPassword}
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//             <TouchableOpacity
//               onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//               style={styles.eyeIcon}
//             >
//               <Ionicons
//                 name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
//                 size={20}
//                 color={BrandColors.textMuted}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Register Button */}
//         <TouchableOpacity
//           style={[styles.registerButton, loading && styles.registerButtonDisabled]}
//           onPress={handleSubmit}
//           disabled={loading}
//         >
//           <Text style={styles.registerButtonText}>
//             {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
//           </Text>
//         </TouchableOpacity>

//         {/* Divider */}
//         <View style={styles.divider}>
//           <View style={styles.dividerLine} />
//           <Text style={styles.dividerText}>or</Text>
//           <View style={styles.dividerLine} />
//         </View>

//         {/* Login Link */}
//         <View style={styles.loginSection}>
//           <Text style={styles.loginText}>Đã có tài khoản? </Text>
//           <TouchableOpacity onPress={onLoginPress}>
//             <Text style={styles.loginLink}>Đăng nhập</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 24,
//   },
//   logoSection: {
//     alignItems: 'center',
//     marginTop: 40,
//     marginBottom: 32,
//   },
//   logoContainer: {
//     marginBottom: 16,
//   },
//   welcomeText: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: BrandColors.textSecondary,
//     marginBottom: 8,
//   },
//   subtitleText: {
//     fontSize: 16,
//     color: BrandColors.textMuted,
//   },
//   formSection: {
//     flex: 1,
//   },
//   inputContainer: {
//     marginBottom: 16,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: BrandColors.textSecondary,
//     marginBottom: 8,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: BrandColors.border,
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     backgroundColor: BrandColors.white,
//     minHeight: 56,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 16,
//     color: BrandColors.textSecondary,
//     paddingVertical: 14,
//   },
//   eyeIcon: {
//     padding: 4,
//   },
//   registerButton: {
//     backgroundColor: BrandColors.primary,
//     borderRadius: 16,
//     paddingVertical: 18,
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 24,
//     shadowColor: BrandColors.primary,
//     shadowOffset: {
//       width: 0,
//       height: 6,
//     },
//     shadowOpacity: 0.4,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   registerButtonDisabled: {
//     opacity: 0.6,
//   },
//   registerButtonText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: BrandColors.white,
//     letterSpacing: 0.5,
//   },
//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: BrandColors.border,
//   },
//   dividerText: {
//     fontSize: 14,
//     color: BrandColors.textMuted,
//     marginHorizontal: 16,
//   },
//   loginSection: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loginText: {
//     fontSize: 14,
//     color: BrandColors.textMuted,
//   },
//   loginLink: {
//     fontSize: 14,
//     color: BrandColors.primary,
//     fontWeight: '600',
//   },
// });
