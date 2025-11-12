import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Medicine, MedicationRecord, ReminderSettings } from '../types';

const STORAGE_KEYS = {
  MEDICINES: '@medicines',
  MEDICATION_RECORDS: '@medication_records',
  REMINDER_SETTINGS: '@reminder_settings',
} as const;

export class StorageService {
  private static validateMedicines(medicines: any): medicines is Medicine[] {
    return Array.isArray(medicines) && medicines.every(m => m && typeof m.id === 'string');
  }

  private static validateMedicationRecords(records: any): records is MedicationRecord[] {
    return Array.isArray(records) && records.every(r => r && typeof r.id === 'string');
  }

  private static validateReminderSettings(settings: any): settings is ReminderSettings[] {
    return Array.isArray(settings) && settings.every(s => s && typeof s.id === 'string');
  }

  // 药物相关存储操作
  static async saveMedicines(medicines: Medicine[]): Promise<void> {
    if (!this.validateMedicines(medicines)) {
      throw new Error('无效的药品数据格式');
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } catch (error) {
      console.error('Error saving medicines:', error);
      throw new Error(`保存药品失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getMedicines(): Promise<Medicine[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return this.validateMedicines(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting medicines:', error);
      return [];
    }
  }

  // 服药记录相关存储操作
  static async saveMedicationRecords(records: MedicationRecord[]): Promise<void> {
    if (!this.validateMedicationRecords(records)) {
      throw new Error('无效的服药记录数据格式');
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving medication records:', error);
      throw new Error(`保存服药记录失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getMedicationRecords(): Promise<MedicationRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_RECORDS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return this.validateMedicationRecords(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting medication records:', error);
      return [];
    }
  }

  // 提醒设置相关存储操作
  static async saveReminderSettings(settings: ReminderSettings[]): Promise<void> {
    if (!this.validateReminderSettings(settings)) {
      throw new Error('无效的提醒设置数据格式');
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      throw new Error(`保存提醒设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getReminderSettings(): Promise<ReminderSettings[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return this.validateReminderSettings(parsed) ? parsed : [];
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
      throw new Error(`清理数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}