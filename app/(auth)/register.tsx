// import { RegisterForm } from '@/components/auth';
// import { BrandColors } from '@/constants/theme';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import {
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     StyleSheet
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function RegisterScreen() {
//   const router = useRouter();

//   const handleRegister = async (formData: {
//     fullName: string;
//     email: string;
//     password: string;
//     confirmPassword: string;
//   }) => {
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     Alert.alert('Thành công', 'Tạo tài khoản thành công!', [
//       {
//         text: 'OK',
//         onPress: () => {
//           router.replace('/(tabs)');
//         },
//       },
//     ]);
//   };

//   const handleLogin = () => {
//     router.replace('/(auth)/login' as any);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoidingView}
//       >
//         <ScrollView contentContainerStyle={styles.scrollContainer}>
//           <RegisterForm
//             onSubmit={handleRegister}
//             onLoginPress={handleLogin}
//           />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: BrandColors.white,
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//   },
// });
