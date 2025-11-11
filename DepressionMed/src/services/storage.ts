import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Medicine, MedicationRecord, ReminderSettings } from '../types';

const STORAGE_KEYS = {
  MEDICINES: '@medicines',
  MEDICATION_RECORDS: '@medication_records',
  REMINDER_SETTINGS: '@reminder_settings',
};

export class StorageService {
  // 药物相关存储操作
  static async saveMedicines(medicines: Medicine[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } catch (error) {
      console.error('Error saving medicines:', error);
      throw error;
    }
  }

  static async getMedicines(): Promise<Medicine[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICINES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting medicines:', error);
      return [];
    }
  }

  // 服药记录相关存储操作
  static async saveMedicationRecords(records: MedicationRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving medication records:', error);
      throw error;
    }
  }

  static async getMedicationRecords(): Promise<MedicationRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting medication records:', error);
      return [];
    }
  }

  // 提醒设置相关存储操作
  static async saveReminderSettings(settings: ReminderSettings[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      throw error;
    }
  }

  static async getReminderSettings(): Promise<ReminderSettings[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return [];
    }
  }

  // 清除所有数据（用于测试或重置）
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}