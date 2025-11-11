import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import type { Medicine } from '../../types';

export default function AddMedicineScreen({ navigation, route }: any) {
  const { addMedicine, updateMedicine } = useApp();
  const editingMedicine = route.params?.medicine;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'twice_daily' | 'three_times_daily' | 'as_needed'>('daily');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingMedicine) {
      setName(editingMedicine.name);
      setDosage(editingMedicine.dosage);
      setFrequency(editingMedicine.frequency);
      setTimes(editingMedicine.times);
      setNotes(editingMedicine.notes || '');
    }
  }, [editingMedicine]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入药物名称');
      return;
    }

    if (!dosage.trim()) {
      Alert.alert('错误', '请输入剂量');
      return;
    }

    const medicineData = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      times,
      startDate: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      isActive: true,
    };

    if (editingMedicine) {
      updateMedicine(editingMedicine.id, medicineData);
    } else {
      addMedicine(medicineData);
    }

    navigation.goBack();
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const addTime = () => {
    if (frequency === 'as_needed') return;
    
    const timeSlots = {
      daily: 1,
      twice_daily: 2,
      three_times_daily: 3,
    };

    const maxTimes = timeSlots[frequency] || 1;
    if (times.length < maxTimes) {
      setTimes([...times, '12:00']);
    }
  };

  const removeTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const renderTimeInputs = () => {
    if (frequency === 'as_needed') {
      return <Text style={styles.infoText}>按需服用，无需设置具体时间</Text>;
    }

    return (
      <View>
        {times.map((time, index) => (
          <View key={index} style={styles.timeInputContainer}>
            <TextInput
              style={styles.timeInput}
              value={time}
              onChangeText={(value) => updateTime(index, value)}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
            />
            {times.length > 1 && (
              <TouchableOpacity
                style={styles.removeTimeButton}
                onPress={() => removeTime(index)}
              >
                <Text style={styles.removeTimeText}>删除</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {canAddMoreTimes() && (
          <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
            <Text style={styles.addTimeText}>+ 添加时间</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const canAddMoreTimes = () => {
    const timeSlots = {
      daily: 1,
      twice_daily: 2,
      three_times_daily: 3,
    };
    return frequency !== 'as_needed' && times.length < (timeSlots[frequency] || 1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>药物名称 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例如：阿司匹林"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>剂量 *</Text>
        <TextInput
          style={styles.input}
          value={dosage}
          onChangeText={setDosage}
          placeholder="例如：100mg"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>服用频率 *</Text>
        <View style={styles.frequencyContainer}>
          {[
            { value: 'daily', label: '每日一次' },
            { value: 'twice_daily', label: '每日两次' },
            { value: 'three_times_daily', label: '每日三次' },
            { value: 'as_needed', label: '按需服用' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.frequencyOption,
                frequency === option.value && styles.frequencyOptionSelected,
              ]}
              onPress={() => {
                setFrequency(option.value as any);
                if (option.value === 'as_needed') {
                  setTimes([]);
                } else if (option.value === 'daily') {
                  setTimes(['08:00']);
                } else if (option.value === 'twice_daily') {
                  setTimes(['08:00', '20:00']);
                } else if (option.value === 'three_times_daily') {
                  setTimes(['08:00', '14:00', '20:00']);
                }
              }}
            >
              <Text
                style={[
                  styles.frequencyText,
                  frequency === option.value && styles.frequencyTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>服药时间</Text>
        {renderTimeInputs()}

        <Text style={styles.label}>备注</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="可选：添加备注信息"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {editingMedicine ? '更新药物' : '保存药物'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  frequencyOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
  },
  frequencyTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 100,
    marginRight: 8,
  },
  removeTimeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  removeTimeText: {
    color: 'white',
    fontSize: 12,
  },
  addTimeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  addTimeText: {
    color: 'white',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});