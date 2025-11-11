// 药物类型定义
export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'as_needed';
  times: string[]; // 服药时间，如 ["08:00", "14:00", "20:00"]
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 服药记录类型定义
export interface MedicationRecord {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  dosage: string;
  notes?: string;
  createdAt: string;
}

// 提醒设置类型定义
export interface ReminderSettings {
  medicineId: string;
  enabled: boolean;
  advanceNotice: number; // 提前通知时间（分钟）
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  repeatInterval: number; // 重复间隔（分钟）
}

// 应用状态类型定义
export interface AppState {
  medicines: Medicine[];
  medicationRecords: MedicationRecord[];
  reminderSettings: ReminderSettings[];
  isLoading: boolean;
  error: string | null;
}