# 抑郁服药助手 - 技术实现方案

## 1. 技术栈选择

### 1.1 推荐方案：React Native

**核心优势：**
- ✅ 跨平台开发（iOS + Android）
- ✅ 开发效率高，JavaScript生态成熟
- ✅ 接近原生性能
- ✅ 丰富的第三方库支持
- ✅ 开源免费，符合公益项目原则

**技术组成：**
```
前端框架：React Native 0.72+
状态管理：Redux Toolkit
本地存储：SQLite (react-native-sqlite-storage)
推送通知：react-native-push-notification
UI组件：React Native Elements
导航管理：React Navigation 6.x
开发语言：JavaScript / TypeScript
```

### 1.2 替代方案：原生Android开发

**技术组成：**
```
编程语言：Kotlin（推荐）/ Java
开发环境：Android Studio
本地存储：Room Database
通知服务：Android Notification API
应用架构：MVVM + LiveData + Repository
最低版本：Android 9.0 (API 28+)
```

## 2. 项目架构设计

### 2.1 整体架构
```
src/
├── components/          # 通用UI组件
│   ├── atoms/          # 原子组件（按钮、输入框等）
│   ├── molecules/      # 分子组件（表单、卡片等）
│   └── organisms/      # 组织组件（完整功能模块）
├── screens/            # 页面组件
│   ├── HomeScreen.js   # 首页（今日服药状态）
│   ├── MedicationScreen.js  # 药物管理
│   ├── ScheduleScreen.js    # 服药计划设置
│   └── HistoryScreen.js     # 服药历史记录
├── navigation/         # 导航配置
├── store/              # Redux状态管理
│   ├── slices/
│   │   ├── medicationSlice.js
│   │   ├── scheduleSlice.js
│   │   └── recordSlice.js
│   └── store.js
├── database/           # SQLite数据库
│   ├── database.js     # 数据库初始化
│   ├── medicationDao.js
│   ├── scheduleDao.js
│   └── recordDao.js
├── services/           # 业务逻辑服务
│   ├── reminderService.js    # 提醒服务
│   ├── notificationService.js # 通知服务
│   └── storageService.js     # 存储服务
├── utils/              # 工具函数
└── constants/          # 常量定义
```

### 2.2 数据流架构
```
用户界面 → Redux Store → 业务逻辑服务 → 数据库操作 → SQLite
    ↑                                              ↓
    └─────────── 状态更新 ───────────────────────┘
```

## 3. 数据库设计

### 3.1 数据表结构

```sql
-- 药物信息表
CREATE TABLE medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dosage TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 服药计划表
CREATE TABLE medication_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL,
    time TEXT NOT NULL,                    -- 格式：HH:MM
    days_of_week TEXT DEFAULT '1,2,3,4,5,6,7', -- 1=周一，7=周日
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- 服药记录表
CREATE TABLE medication_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL,
    taken_at TIMESTAMP,
    status TEXT DEFAULT 'pending',          -- pending, taken, missed, skipped
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id)
);

-- 情绪记录表（可选功能）
CREATE TABLE mood_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_date DATE NOT NULL,
    mood_score INTEGER,                     -- 1-5分
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 数据库操作类

```javascript
// database/medicationDao.js
class MedicationDao {
    static async create(medication) {
        const db = await getDatabase();
        const result = await db.executeSql(
            'INSERT INTO medications (name, dosage, description) VALUES (?, ?, ?)',
            [medication.name, medication.dosage, medication.description]
        );
        return result.insertId;
    }

    static async getAll() {
        const db = await getDatabase();
        const results = await db.executeSql('SELECT * FROM medications ORDER BY name');
        return results.rows.raw();
    }

    static async update(id, medication) {
        const db = await getDatabase();
        await db.executeSql(
            'UPDATE medications SET name=?, dosage=?, description=?, updated_at=? WHERE id=?',
            [medication.name, medication.dosage, medication.description, new Date(), id]
        );
    }

    static async delete(id) {
        const db = await getDatabase();
        await db.executeSql('DELETE FROM medications WHERE id=?', [id]);
    }
}
```

## 4. 核心功能实现

### 4.1 服药提醒服务

```javascript
// services/reminderService.js
import PushNotification from 'react-native-push-notification';

class ReminderService {
    static scheduleReminder(schedule, medication) {
        const now = new Date();
        const [hours, minutes] = schedule.time.split(':');
        const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                    parseInt(hours), parseInt(minutes), 0);

        // 如果今天的提醒时间已过，则安排明天的提醒
        if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        // 主提醒
        PushNotification.localNotificationSchedule({
            title: '服药提醒',
            message: this.getGentleReminderMessage(medication.name),
            date: reminderTime,
            repeatType: 'day',
            repeatTime: 24 * 60 * 60 * 1000, // 24小时
            actions: ['已服用', '稍后提醒'],
            smallIcon: 'ic_notification',
            largeIcon: '',
            color: '#4CAF50',
            playSound: true,
            soundName: 'default',
            vibrate: true,
            vibration: 300,
            tag: `medication_${schedule.id}`,
            userInfo: {
                scheduleId: schedule.id,
                medicationName: medication.name,
                reminderType: 'primary'
            }
        });

        // 延迟提醒（15分钟后）
        const delayTime = new Date(reminderTime.getTime() + 15 * 60 * 1000);
        this.scheduleDelayedReminder(schedule, medication, delayTime);
    }

    static getGentleReminderMessage(medicationName) {
        const messages = [
            `记得照顾好自己，该服用 ${medicationName} 了 💚`,
            `服药是关爱自己的方式，${medicationName} 时间到了 ✨`,
            `坚持就是进步，该服用 ${medicationName} 了 🌱`,
            `每一小步都很重要，记得服用 ${medicationName} 🌟`,
            `为自己加油，该服用 ${medicationName} 了 💪`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    static scheduleDelayedReminder(schedule, medication, delayTime) {
        PushNotification.localNotificationSchedule({
            title: '温柔提醒',
            message: `还没服用 ${medication.name} 吗？没关系，现在也不晚 🌈`,
            date: delayTime,
            actions: ['已服用', '跳过这次'],
            smallIcon: 'ic_notification',
            color: '#FF9800',
            playSound: true,
            vibrate: true,
            vibration: 500,
            tag: `medication_${schedule.id}_delayed`,
            userInfo: {
                scheduleId: schedule.id,
                medicationName: medication.name,
                reminderType: 'delayed'
            }
        });
    }

    static cancelReminder(scheduleId) {
        PushNotification.cancelLocalNotifications({ tag: `medication_${scheduleId}` });
        PushNotification.cancelLocalNotifications({ tag: `medication_${scheduleId}_delayed` });
    }
}
```

### 4.2 UI组件设计（抑郁症患者优化）

```javascript
// components/LargeButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const LargeButton = ({ title, onPress, color = '#4CAF50', disabled = false }) => {
    return (
        <TouchableOpacity 
            style={[
                styles.button, 
                { backgroundColor: disabled ? '#CCCCCC' : color },
                styles.shadow
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 25,
        paddingHorizontal: 40,
        borderRadius: 20,
        marginVertical: 15,
        minWidth: 200,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8
    }
});

export default LargeButton;
```

### 4.3 主屏幕组件

```javascript
// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LargeButton from '../components/LargeButton';
import { completeMedication } from '../store/slices/recordSlice';

const HomeScreen = () => {
    const dispatch = useDispatch();
    const [todaySchedules, setTodaySchedules] = useState([]);
    const { medications } = useSelector(state => state.medication);
    const { schedules } = useSelector(state => state.schedule);
    const { records } = useSelector(state => state.record);

    useEffect(() => {
        loadTodaySchedules();
    }, [schedules, records]);

    const loadTodaySchedules = async () => {
        const today = new Date().toISOString().split('T')[0];
        const todayDay = new Date().getDay(); // 0=周日
        
        // 筛选今天的服药计划
        const activeSchedules = schedules.filter(schedule => {
            const daysOfWeek = schedule.days_of_week.split(',').map(Number);
            return daysOfWeek.includes(todayDay === 0 ? 7 : todayDay);
        });

        // 检查每个计划的完成状态
        const schedulesWithStatus = activeSchedules.map(schedule => {
            const record = records.find(r => 
                r.schedule_id === schedule.id && r.scheduled_date === today
            );
            return {
                ...schedule,
                status: record ? record.status : 'pending',
                medication: medications.find(m => m.id === schedule.medication_id)
            };
        });

        setTodaySchedules(schedulesWithStatus);
    };

    const handleMedicationComplete = (schedule) => {
        dispatch(completeMedication({
            scheduleId: schedule.id,
            medicationName: schedule.medication.name
        }));
    };

    const getCompletionRate = () => {
        if (todaySchedules.length === 0) return 0;
        const completed = todaySchedules.filter(s => s.status === 'taken').length;
        return Math.round((completed / todaySchedules.length) * 100);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>今日服药</Text>
                <Text style={styles.subtitle}>
                    完成率: {getCompletionRate()}%
                </Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${getCompletionRate()}%` }]} />
            </View>

            {todaySchedules.map((schedule) => (
                <View key={schedule.id} style={styles.medicationCard}>
                    <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>
                            {schedule.medication?.name}
                        </Text>
                        <Text style={styles.medicationDosage}>
                            {schedule.medication?.dosage}
                        </Text>
                        <Text style={styles.scheduleTime}>
                            计划时间: {schedule.time}
                        </Text>
                    </View>

                    {schedule.status === 'pending' && (
                        <LargeButton
                            title="确认服药"
                            onPress={() => handleMedicationComplete(schedule)}
                            color="#4CAF50"
                        />
                    )}

                    {schedule.status === 'taken' && (
                        <View style={styles.completedContainer}>
                            <Text style={styles.completedText}>
                                ✓ 已完成
                            </Text>
                            <Text style={styles.encouragementText}>
                                太棒了！继续加油 💚
                            </Text>
                        </View>
                    )}

                    {schedule.status === 'missed' && (
                        <View style={styles.missedContainer}>
                            <Text style={styles.missedText}>
                                已错过
                            </Text>
                            <Text style={styles.gentleText}>
                                没关系，下次记得就好 🌈
                            </Text>
                        </View>
                    )}
                </View>
            ))}

            {todaySchedules.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        今天没有安排服药
                    </Text>
                    <Text style={styles.emptySubtext}>
                        去设置页面添加服药计划吧
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    header: {
        padding: 30,
        backgroundColor: '#2196F3',
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 18,
        color: 'white',
        opacity: 0.9
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#E0E0E0',
        marginBottom: 20
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50'
    },
    medicationCard: {
        backgroundColor: 'white',
        margin: 15,
        padding: 25,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    medicationInfo: {
        marginBottom: 20,
        alignItems: 'center'
    },
    medicationName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5
    },
    medicationDosage: {
        fontSize: 18,
        color: '#666',
        marginBottom: 10
    },
    scheduleTime: {
        fontSize: 16,
        color: '#888'
    },
    completedContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#E8F5E8',
        borderRadius: 15
    },
    completedText: {
        fontSize: 24,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 10
    },
    encouragementText: {
        fontSize: 18,
        color: '#4CAF50'
    },
    missedContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF3E0',
        borderRadius: 15
    },
    missedText: {
        fontSize: 20,
        color: '#FF9800',
        fontWeight: 'bold',
        marginBottom: 10
    },
    gentleText: {
        fontSize: 16,
        color: '#FF9800'
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 50
    },
    emptyText: {
        fontSize: 20,
        color: '#666',
        marginBottom: 10
    },
    emptySubtext: {
        fontSize: 16,
        color: '#999'
    }
});

export default HomeScreen;
```

## 5. 开发环境配置

### 5.1 开发环境要求

```bash
# Node.js 和 npm
Node.js: 18.0.0 或更高版本
npm: 8.0.0 或更高版本

# React Native CLI
npm install -g react-native-cli

# Android 开发环境
Android Studio: 最新版本
Android SDK: API Level 28+ (Android 9.0+)
Java Development Kit (JDK): 11 或更高版本
```

### 5.2 项目初始化

```bash
# 创建新项目
npx react-native init DepressionMedApp --template react-native-template-typescript

# 进入项目目录
cd DepressionMedApp

# 安装核心依赖
npm install @reduxjs/toolkit react-redux
npm install react-native-sqlite-storage
npm install react-native-push-notification
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler

# iOS 依赖（如需要）
cd ios && pod install && cd ..
```

### 5.3 Android 配置

**android/app/build.gradle:**
```gradle
android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"
    
    defaultConfig {
        applicationId "com.depressionmed.app"
        minSdkVersion 28
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }
    
    signingConfigs {
        release {
            storeFile file('depressionmed-release.keystore')
            storePassword 'your_store_password'
            keyAlias 'depressionmed-key'
            keyPassword 'your_key_password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 6. 测试和部署

### 6.1 真机测试流程

```bash
# 启用开发者模式
# 设置 > 关于手机 > 版本号（连续点击7次）

# 开启USB调试
# 设置 > 开发者选项 > USB调试（开启）

# 连接设备验证
adb devices

# 运行应用
npx react-native run-android
```

### 6.2 性能优化

```javascript
// 内存优化
- 使用 FlatList 替代 ScrollView
- 图片使用适当的尺寸和格式
- 及时清理定时器和监听器

// 启动优化
- 代码分割和懒加载
- 减少初始包大小
- 优化启动屏

// 电池优化
- 最小化后台任务
- 优化推送服务
- 合理使用定位服务
```

### 6.3 发布准备

```bash
# 生成签名APK
cd android
./gradlew assembleRelease

# 生成AAB（Google Play推荐）
./gradlew bundleRelease

# APK位置
android/app/build/outputs/apk/release/app-release.apk

# AAB位置
android/app/build/outputs/bundle/release/app-release.aab
```

## 7. 开发时间计划

| 阶段 | 任务 | 时间 | 交付物 |
|------|------|------|---------|
| 阶段1 | 环境搭建 + 基础架构 | 3天 | 可运行的基础项目 |
| 阶段2 | 数据库设计 + 核心服务 | 5天 | 数据存储和提醒功能 |
| 阶段3 | UI界面开发 | 7天 | 完整用户界面 |
| 阶段4 | 功能集成测试 | 5天 | 功能完整的测试版本 |
| 阶段5 | 性能优化 + Bug修复 | 5天 | 稳定版本 |
| 阶段6 | 真机测试 + 发布准备 | 3天 | 发布就绪版本 |

**总计：28天（约6周）**

## 8. 针对抑郁症患者的特殊优化

### 8.1 UI/UX设计原则

1. **极简设计**：界面元素最少化，避免信息过载
2. **大按钮操作**：按钮尺寸大于常规应用，便于点击
3. **温和配色**：使用蓝色、绿色等舒缓色彩
4. **清晰字体**：大字号，高对比度
5. **一致性**：所有界面保持统一的操作逻辑

### 8.2 交互优化

1. **一键操作**：主要功能支持一键完成
2. **语音支持**：可选的语音确认功能
3. **震动反馈**：操作成功后提供温和震动
4. **容错设计**：允许用户纠正错误操作
5. **进度可视化**：清晰显示任务完成进度

### 8.3 情绪支持

1. **积极语言**：使用鼓励性文案，避免责备
2. **灵活调整**：允许用户根据实际情况调整计划
3. **无压力设计**：不强制要求完美执行
4. **温和提醒**：多重提醒机制，避免造成焦虑

这个技术实现方案确保了项目能够按时交付一个专门针对抑郁症患者服药健忘问题的公益应用，同时保证了良好的用户体验和技术质量。