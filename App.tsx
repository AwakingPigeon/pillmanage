import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, TextInput, Alert } from 'react-native'
import * as Notifications from 'expo-notifications'
import { StorageService } from './DepressionMed/src/services/storage'
import type { MedicationConfig, MedicationRecords } from './DepressionMed/src/types'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

type TabKey = 'home' | 'records' | 'medicine' | 'settings'

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [config, setConfig] = useState<MedicationConfig>({
    medicationName: '抗抑郁药',
    reminderTime: '09:00',
    isActive: true,
    doseFraction: 1,
    inventoryCount: 0,
    daysBeforeRunout: 3,
    reminderIntervalDays: 1,
  })
  const [records, setRecords] = useState<MedicationRecords>({})

  useEffect(() => {
    ;(async () => {
      const savedConfig = await StorageService.getMedicationConfig()
      if (savedConfig) setConfig(savedConfig)
      const savedRecords = await StorageService.getMedicationRecords()
      setRecords(savedRecords)
      await ensureNotificationPermission()
      if (savedConfig?.isActive) {
        await scheduleDailyOrIntervalNotification(savedConfig)
      }
    })()
  }, [])

  const todayKey = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const hasTakenToday = !!records[todayKey]

  async function ensureNotificationPermission() {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync()
      if (res.status !== 'granted') {
        Alert.alert('通知权限被拒绝', '请在系统设置中允许通知以接收提醒')
      }
    }
  }

  async function scheduleDailyOrIntervalNotification(cfg: MedicationConfig) {
    await Notifications.cancelAllScheduledNotificationsAsync()
    const [h, m] = cfg.reminderTime.split(':').map(Number)
    const trigger: Notifications.DailyTriggerInput = {
      hour: h,
      minute: m,
      repeats: true,
    }
    if (cfg.reminderIntervalDays && cfg.reminderIntervalDays > 1) {
      // 通过多条计划近似实现隔日：每日提醒，配合应用内逻辑只在需要的日子显示
      // 简化实现：仍按日程触发，用户在“隔日”当天确认。
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '服药提醒',
        body: `${cfg.medicationName} 请在 ${cfg.reminderTime} 服用`,
      },
      trigger,
    })
  }

  async function saveConfig(next: MedicationConfig) {
    setConfig(next)
    await StorageService.saveMedicationConfig(next)
    if (next.isActive) await scheduleDailyOrIntervalNotification(next)
  }

  async function confirmTaken() {
    const nextRecords: MedicationRecords = { ...records, [todayKey]: true }
    setRecords(nextRecords)
    await StorageService.saveMedicationRecords(nextRecords)
    const consumed = nextDoseToPieces(config.doseFraction)
    const nextInv = Math.max(0, (config.inventoryCount ?? 0) - consumed)
    if (nextInv !== config.inventoryCount) {
      await saveConfig({ ...config, inventoryCount: nextInv })
    }
    maybeAlertLowInventory(nextInv, config.daysBeforeRunout)
    Alert.alert('已记录', '今日服药已记录，坚持下去！')
  }

  function nextDoseToPieces(doseFraction: number) {
    // 以“片”为单位，doseFraction表示 fraction of a pill
    // 例如 0.5 表示半片；按折算消耗 0.5 片
    return doseFraction
  }

  function maybeAlertLowInventory(inv: number, daysBeforeRunout: number) {
    // 粗略估计剩余天数 = 库存片数 / 每次服用片数
    const perDose = config.doseFraction || 1
    const remainingDays = perDose > 0 ? Math.floor(inv / perDose) : 0
    if (remainingDays <= daysBeforeRunout) {
      Alert.alert('补药提醒', `库存可能不足（约剩 ${remainingDays} 天），请及时补药`)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'home' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>今日提醒</Text>
          <Text style={{ fontSize: 16, marginBottom: 24 }}>
            {config.medicationName} · {config.reminderTime}
          </Text>
          <Pressable
            onPress={confirmTaken}
            disabled={hasTakenToday}
            style={{
              backgroundColor: hasTakenToday ? '#9CCC65' : '#007AFF',
              paddingVertical: 24,
              paddingHorizontal: 48,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 20 }}>
              {hasTakenToday ? '已服用 ✅' : '滑动/点击已服用'}
            </Text>
          </Pressable>
          <Text style={{ marginTop: 24, fontSize: 16 }}>库存：{config.inventoryCount} 片</Text>
        </View>
      )}

      {tab === 'records' && (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>本周记录</Text>
          <WeekRecords records={records} />
        </View>
      )}

      {tab === 'medicine' && (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>药物设置</Text>
          <LabeledInput
            label="药物名称"
            value={config.medicationName}
            onChangeText={t => setConfig({ ...config, medicationName: t })}
          />
          <LabeledInput
            label="提醒时间 (HH:MM)"
            value={config.reminderTime}
            onChangeText={t => setConfig({ ...config, reminderTime: t })}
          />
          <LabeledInput
            label="每次剂量（片的小数，如0.5）"
            value={String(config.doseFraction)}
            keyboardType="numeric"
            onChangeText={t => setConfig({ ...config, doseFraction: Number(t) || 0 })}
          />
          <LabeledInput
            label="库存（片）"
            value={String(config.inventoryCount)}
            keyboardType="numeric"
            onChangeText={t => setConfig({ ...config, inventoryCount: Number(t) || 0 })}
          />
          <LabeledInput
            label="用完前提醒天数"
            value={String(config.daysBeforeRunout)}
            keyboardType="numeric"
            onChangeText={t => setConfig({ ...config, daysBeforeRunout: Number(t) || 0 })}
          />
          <LabeledInput
            label="提醒间隔（天，1为每日，2为隔日）"
            value={String(config.reminderIntervalDays)}
            keyboardType="numeric"
            onChangeText={t => setConfig({ ...config, reminderIntervalDays: Number(t) || 1 })}
          />
          <Pressable
            onPress={() => saveConfig(config)}
            style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginTop: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>保存并启用提醒</Text>
          </Pressable>
        </View>
      )}

      {tab === 'settings' && (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>设置</Text>
          <Text style={{ fontSize: 16 }}>高对比度与大按钮已默认启用。</Text>
        </View>
      )}
    </View>
  )
}

function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const items: { key: TabKey; title: string }[] = [
    { key: 'home', title: '首页' },
    { key: 'records', title: '记录' },
    { key: 'medicine', title: '药物' },
    { key: 'settings', title: '设置' },
  ]
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' }}>
      {items.map(it => (
        <Pressable
          key={it.key}
          onPress={() => onChange(it.key)}
          style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: active === it.key ? '#F0F8FF' : '#FFFFFF' }}
        >
          <Text style={{ fontSize: 16 }}>{it.title}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function LabeledInput({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'default' | 'numeric' }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 6, fontSize: 16 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 }}
      />
    </View>
  )
}

function WeekRecords({ records }: { records: MedicationRecords }) {
  const days: string[] = []
  const base = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return (
    <View>
      {days.map(k => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
          <Text style={{ fontSize: 16 }}>{k}</Text>
          <Text style={{ fontSize: 16 }}>{records[k] ? '✅' : '❌'}</Text>
        </View>
      ))}
    </View>
  )
}

