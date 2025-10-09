import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface DatePickerInputProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = '#A0A0A0';

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) return null;
    
    const date = new Date(year, month, day);
    return date;
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    
    if (text.length === 10) {
      const parsedDate = parseDate(text);
      if (parsedDate) {
        onChange(parsedDate);
      }
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    onChange(selectedDate);
    setShowPicker(false);
  };

  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState(value || new Date());

    return (
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          
          <ThemedView style={styles.pickerContainer}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowPicker(false)}
                style={styles.headerButton}
              >
                <ThemedText style={styles.cancelButton}>Hủy</ThemedText>
              </TouchableOpacity>
              
              <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                Chọn ngày sinh
              </ThemedText>
              
              <TouchableOpacity 
                onPress={() => handleDateSelect(tempDate)}
                style={styles.headerButton}
              >
                <ThemedText style={styles.doneButton}>Xong</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Selected Date Display */}
            <View style={styles.selectedDateDisplay}>
              <Ionicons name="calendar" size={20} color="#E07B53" />
              <ThemedText style={styles.selectedDateText}>
                {formatDate(tempDate)}
              </ThemedText>
            </View>

            {/* Picker Wheels */}
            <View style={styles.pickerWheels}>
              {/* Day */}
              <View style={styles.wheelColumn}>
                <ThemedText style={styles.wheelLabel}>Ngày</ThemedText>
                <ScrollView 
                  style={styles.wheelScroll}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={styles.wheelItem}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setDate(day);
                        setTempDate(newDate);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.wheelItemText,
                          tempDate.getDate() === day && styles.wheelItemTextActive,
                        ]}
                      >
                        {day.toString().padStart(2, '0')}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View style={styles.wheelColumn}>
                <ThemedText style={styles.wheelLabel}>Tháng</ThemedText>
                <ScrollView 
                  style={styles.wheelScroll}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={styles.wheelItem}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setMonth(month - 1);
                        setTempDate(newDate);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.wheelItemText,
                          tempDate.getMonth() + 1 === month && styles.wheelItemTextActive,
                        ]}
                      >
                        {month.toString().padStart(2, '0')}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View style={styles.wheelColumn}>
                <ThemedText style={styles.wheelLabel}>Năm</ThemedText>
                <ScrollView 
                  style={styles.wheelScroll}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.wheelItem}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setFullYear(year);
                        setTempDate(newDate);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.wheelItemText,
                          tempDate.getFullYear() === year && styles.wheelItemTextActive,
                        ]}
                      >
                        {year}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ThemedView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value ? formatDate(value) : inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity 
          onPress={() => setShowPicker(true)}
          style={styles.iconButton}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color="#E07B53"
          />
        </TouchableOpacity>
      </View>

      <DatePickerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 52,
    color: '#2D2D2D',
  },
  iconButton: {
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerButton: {
    minWidth: 60,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#8E8E93',
    fontSize: 17,
  },
  doneButton: {
    color: '#E07B53',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(224, 123, 83, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 123, 83, 0.2)',
  },
  selectedDateText: {
    fontSize: 24,
    color: '#E07B53',
    fontWeight: '700',
    letterSpacing: 1,
  },
  pickerWheels: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  wheelColumn: {
    flex: 1,
  },
  wheelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wheelScroll: {
    height: 240,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  wheelContent: {
    paddingVertical: 8,
  },
  wheelItem: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  wheelItemText: {
    fontSize: 20,
    color: '#3C3C43',
    fontWeight: '400',
  },
  wheelItemTextActive: {
    fontSize: 24,
    color: '#E07B53',
    fontWeight: '700',
  },
});

