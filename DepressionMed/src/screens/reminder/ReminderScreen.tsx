import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { notificationService } from '../../services/notifications';

export default function ReminderScreen() {
  const { state, updateReminderSettings } = useApp();
  const { medicines, reminderSettings } = state;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('');

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const granted = await notificationService.requestPermissionsAsync();
    setNotificationPermission(granted ? 'granted' : 'denied');
    setNotificationsEnabled(granted);
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermissionsAsync();
    setNotificationPermission(granted ? 'granted' : 'denied');
    setNotificationsEnabled(granted);
    
    if (!granted) {
      Alert.alert(
        '权限未授予',
        '需要通知权限才能设置服药提醒。请在设置中开启通知权限。'
      );
    }
  };

  const toggleReminder = async (medicineId: string, enabled: boolean) => {
    if (!notificationsEnabled) {
      await requestNotificationPermission();
      if (!notificationsEnabled) return;
    }

    const newSettings = {
      ...reminderSettings,
      [medicineId]: {
        enabled,
        ...reminderSettings[medicineId],
      },
    };
    updateReminderSettings(newSettings);

    if (enabled) {
      await scheduleMedicineReminder(medicineId);
    } else {
      await cancelMedicineReminder(medicineId);
    }
  };

  const scheduleMedicineReminder = async (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine || !medicine.times.length) return;

    // 取消现有的通知
    await cancelMedicineReminder(medicineId);

    // 为每个服药时间创建通知
    for (const time of medicine.times) {
      await notificationService.scheduleMedicineReminder({
        medicineId,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time,
      });
    }
  };

  const cancelMedicineReminder = async (medicineId: string) => {
    // 取消该药物的所有通知
    await notificationService.cancelMedicineReminder(medicineId);
    
    // 重新安排其他启用的药物通知
    const enabledMedicines = medicines.filter(m => 
      reminderSettings[m.id]?.enabled
    );
    
    for (const medicine of enabledMedicines) {
      if (medicine.id !== medicineId) {
        await scheduleMedicineReminder(medicine.id);
      }
    }
  };

  // 取消所有提醒
  const cancelAllReminders = async () => {
    await notificationService.cancelAllReminders();
  };

  const renderMedicineReminder = (medicine: any) => {
    const isEnabled = reminderSettings[medicine.id]?.enabled || false;
    
    return (
      <View key={medicine.id} style={styles.medicineCard}>
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.medicineDetails}>
            {medicine.dosage} • {medicine.times.join(', ')}
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(enabled) => toggleReminder(medicine.id, enabled)}
          disabled={!notificationsEnabled && notificationPermission !== 'denied'}
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>暂无药物</Text>
      <Text style={styles.emptyText}>请先添加药物才能设置提醒</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {}}
      >
        <Text style={styles.addButtonText}>去添加药物</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>服药提醒设置</Text>
        <Text style={styles.subtitle}>
          {notificationsEnabled ? '通知权限已开启' : '需要开启通知权限'}
        </Text>
      </View>

      {!notificationsEnabled && (
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestNotificationPermission}
        >
          <Text style={styles.permissionButtonText}>开启通知权限</Text>
        </TouchableOpacity>
      )}

      {medicines.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.medicinesList}>
          <Text style={styles.sectionTitle}>药物提醒设置</Text>
          {medicines.map(renderMedicineReminder)}
        </View>
      )}

      {medicines.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 提示</Text>
          <Text style={styles.tipsText}>
            • 开启提醒后，系统会在设定时间发送通知
            {'\n'}• 确保手机通知权限已开启
            {'\n'}• 建议设置合理的提醒时间
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  medicinesList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#e8f4fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});