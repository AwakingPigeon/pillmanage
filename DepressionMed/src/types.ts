export type MedicationRecords = Record<string, boolean>

export interface MedicationConfig {
  medicationName: string
  reminderTime: string
  isActive: boolean
  doseFraction: number
  inventoryCount: number
  daysBeforeRunout: number
  reminderIntervalDays: number
}

