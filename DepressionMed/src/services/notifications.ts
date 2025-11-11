import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 请求通知权限
  async requestPermissionsAsync(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('模拟器不支持推送通知');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('通知权限被拒绝');
      return false;
    }

    return true;
  }

  // 获取推送令牌（用于远程通知）
  async getExpoPushTokenAsync(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // 替换为你的 Expo 项目 ID
      });
      return token.data;
    } catch (error) {
      console.error('获取推送令牌失败:', error);
      return null;
    }
  }

  // 调度服药提醒
  async scheduleMedicineReminder({
    medicineId,
    medicineName,
    dosage,
    time,
    frequency = 'daily',
  }: {
    medicineId: string;
    medicineName: string;
    dosage: string;
    time: string;
    frequency?: 'daily' | 'weekly';
  }): Promise<string | null> {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      
      const trigger: Notifications.NotificationTriggerInput = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      // 添加通知标识符
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '服药提醒',
          body: `该服用 ${medicineName} (${dosage}) 了`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            medicineId,
            type: 'medicine_reminder',
          },
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('调度通知失败:', error);
      return null;
    }
  }

  // 取消特定药物的所有提醒
  async cancelMedicineReminders(medicineId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.medicineId === medicineId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('取消通知失败:', error);
    }
  }

  // 取消所有提醒
  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('取消所有通知失败:', error);
    }
  }

  // 获取所有已调度的通知
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('获取已调度通知失败:', error);
      return [];
    }
  }

  // 立即发送测试通知
  async sendTestNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // 立即触发
      });
    } catch (error) {
      console.error('发送测试通知失败:', error);
    }
  }

  // 设置通知通道（Android）
  async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine_reminders', {
        name: '服药提醒',
        importance: Notifications.AndroidImportance.HIGH,
        description: '用于服药提醒的通知',
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }

  // 添加通知监听器
  addNotificationListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // 添加通知响应监听器
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // 移除监听器
  removeNotificationListener(subscription: any) {
    if (subscription) {
      subscription.remove();
    }
  }
}

// 创建单例实例
export const notificationService = NotificationService.getInstance();