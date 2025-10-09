import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export interface FormInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  icon,
  iconColor = '#E07B53',
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
}: FormInputProps) {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = '#A0A0A0';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {icon && (
          <Ionicons name={icon} size={20} color={iconColor} />
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    letterSpacing: 0.2,
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 52,
    color: '#2D2D2D',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
});

