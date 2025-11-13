import AsyncStorage from '@react-native-async-storage/async-storage'
import type { MedicationConfig, MedicationRecords } from '../types'

const STORAGE_KEYS = {
  MEDICATION_CONFIG: '@medication_config',
  MEDICATION_RECORDS: '@medication_records',
} as const

export class StorageService {
  static async saveMedicationConfig(config: MedicationConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_CONFIG, JSON.stringify(config))
    } catch (error) {
      throw new Error(`保存药物配置失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static async getMedicationConfig(): Promise<MedicationConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_CONFIG)
      return data ? (JSON.parse(data) as MedicationConfig) : null
    } catch (error) {
      return null
    }
  }

  static async saveMedicationRecords(records: MedicationRecords): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_RECORDS, JSON.stringify(records))
    } catch (error) {
      throw new Error(`保存服药记录失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static async getMedicationRecords(): Promise<MedicationRecords> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_RECORDS)
      return data ? (JSON.parse(data) as MedicationRecords) : {}
    } catch (error) {
      return {}
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS))
    } catch (error) {
      throw new Error(`清理数据失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
