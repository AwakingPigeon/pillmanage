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
-- 药物信息表（片剂计量版）
CREATE TABLE medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dosage_type TEXT DEFAULT '片',  -- 片、半片、粒等
    dosage_amount REAL DEFAULT 1,   -- 数量：0.5=半片，1=一片
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
            'INSERT INTO medications (name, dosage_type, dosage_amount, description) VALUES (?, ?, ?, ?)',
            [medication.name, medication.dosage_type || '片', medication.dosage_amount || 1, medication.description]
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
            'UPDATE medications SET name=?, dosage_type=?, dosage_amount=?, description=?, updated_at=? WHERE id=?',
            [medication.name, medication.dosage_type, medication.dosage_amount, medication.description, new Date(), id]
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

        // 主提醒（纯文字版 - 无语音）
        PushNotification.localNotificationSchedule({
            title: '温柔提醒',
            message: this.getGentleReminderMessage(medication.name, medication.dosage_amount),
            date: reminderTime,
            repeatType: 'day',
            repeatTime: 24 * 60 * 60 * 1000, // 24小时
            actions: ['已服用', '稍后提醒'],
            smallIcon: 'ic_notification',
            color: '#7C9885', // 温馨配色
            playSound: false, // 完全禁用声音
            vibrate: false,   // 禁用振动
            tag: `medication_${schedule.id}`,
            userInfo: {
                scheduleId: schedule.id,
                medicationName: medication.name,
                dosageAmount: medication.dosage_amount,
                reminderType: 'primary'
            }
        });

        // 延迟提醒（15分钟后，仅文字）
        const delayTime = new Date(reminderTime.getTime() + 15 * 60 * 1000);
        this.scheduleDelayedReminder(schedule, medication, delayTime);
    }

    static getGentleReminderMessage(medicationName, dosageAmount) {
        const dosageText = this.formatDosageText(dosageAmount);
        const messages = [
            `温柔提醒：该服用${dosageText}${medicationName}`,
            `记得服用${dosageText}${medicationName}，照顾好自己`,
            `${dosageText}${medicationName}时间到了，慢慢来`,
            `该服用${dosageText}${medicationName}，你很棒！`,
            `提醒：${dosageText}${medicationName}，保持规律很重要`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    static formatDosageText(amount) {
        if (amount === 0.5) return '半片';
        if (amount === 1) return '一片';
        if (amount === 1.5) return '一片半';
        if (amount === 2) return '两片';
        return `${amount}片`;
    }

    static scheduleDelayedReminder(schedule, medication, delayTime) {
        const dosageText = this.formatDosageText(medication.dosage_amount);
        PushNotification.localNotificationSchedule({
            title: '再次提醒',
            message: `别忘了服用${dosageText}${medication.name}，照顾好自己`,
            date: delayTime,
            actions: ['已服用', '跳过这次'],
            smallIcon: 'ic_notification',
            color: '#FF9800',
            playSound: false, // 禁用声音
            vibrate: false,   // 禁用振动
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

### 4.2 UI组件设计（抑郁症患者优化 - 温馨配色版）

#### 温馨配色方案（抑郁症患者专用）
```javascript
// constants/colors.js
export const Colors = {
    // 主色调 - 温暖的绿色系，给人安心感
    primary: '#7C9885',        // 主绿色 - 温暖、安心
    secondary: '#9BB8A3',      // 浅绿色 - 温和、舒缓
    accent: '#B8D4C8',         // 薄荷绿 - 清新、希望
    
    // 背景色 - 柔和的中性色，减少视觉刺激
    background: '#F8F6F3',     // 温暖的米白色背景
    cardBackground: '#FFFFFF',   // 纯白卡片背景
    
    // 文字颜色 - 高对比度，易于阅读
    textPrimary: '#4A4A4A',    // 深灰色主文本，比纯黑更柔和
    textSecondary: '#7A7A7A',  // 中等灰色副文本
    
    // 分割线 - 极浅的灰色
    divider: '#E8E5E2',
    
    // 状态颜色 - 温和的状态提示
    success: '#7C9885',        // 成功绿色
    successLight: '#F0F5F2',   // 成功背景浅色
    warning: '#E8A598',        // 温暖橙色 - 不刺眼
    warningLight: '#FDF5F4',   // 警告背景浅色
    error: '#D4A5A5',          // 柔和红色 - 不过于强烈
    
    // 阴影 - 轻柔阴影增加层次感
    shadow: '#000000'
};
```

#### 滑动确认组件（防误触）
```javascript
// components/SlideToConfirm.js
import React, { useState } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const SlideToConfirm = ({ onConfirm, title = "滑动确认服药" }) => {
    const [pan] = useState(new Animated.Value(0));
    const [confirmed, setConfirmed] = useState(false);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (e, gestureState) => {
            if (gestureState.dx > 0 && gestureState.dx < 250) {
                Animated.event([null, { dx: pan }], { useNativeDriver: false })(e, gestureState);
            }
        },
        onPanResponderRelease: (e, gestureState) => {
            if (gestureState.dx > 200) {
                // 滑动成功
                Animated.timing(pan, {
                    toValue: 220,
                    duration: 200,
                    useNativeDriver: false
                }).start(() => {
                    setConfirmed(true);
                    onConfirm();
                });
            } else {
                // 回弹
                Animated.spring(pan, {
                    toValue: 0,
                    useNativeDriver: false
                }).start();
            }
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.sliderTrack}>
                <Animated.View 
                    style={[
                        styles.sliderThumb,
                        { transform: [{ translateX: pan }] }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <Text style={styles.thumbText}>💊</Text>
                </Animated.View>
                <Text style={styles.instructionText}>{title}</Text>
            </View>
            {confirmed && (
                <Text style={styles.successText}>✅ 已确认服药！</Text>
            )}
        </View>
    );
};
```

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        alignItems: 'center',
    },
    sliderTrack: {
        width: '100%',
        height: 60,
        backgroundColor: Colors.cardBackground,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        position: 'relative',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sliderText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    sliderThumb: {
        position: 'absolute',
        left: 4,
        width: 52,
        height: 52,
        backgroundColor: Colors.primary,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    thumbInner: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    successText: {
        color: Colors.success,
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    }
});

export default SlideToConfirm;
```

### 4.3 今日服药界面（滑动确认版 - 温馨配色）

```javascript
// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import SlideToConfirm from '../components/SlideToConfirm';
import { completeMedication } from '../store/slices/recordSlice';
import Colors from '../constants/colors';

const HomeScreen = () => {
    const dispatch = useDispatch();
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [fadeAnim] = useState(new Animated.Value(0));
    const { medications } = useSelector(state => state.medication);
    const { schedules } = useSelector(state => state.schedule);
    const { records } = useSelector(state => state.record);

    const encouragements = [
        "做得很好！每一步都是进步 🌱",
        "你真棒！坚持就是胜利 💪",
        "温柔地对待自己，你正在变好 🌸",
        "今天的你比昨天更勇敢 ✨",
        "小小的坚持，大大的改变 🦋"
    ];

    useEffect(() => {
        loadTodaySchedules();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
        }).start();
    }, [schedules, records]);

    const loadTodaySchedules = async () => {
        const today = new Date().toISOString().split('T')[0];
        const todayDay = new Date().getDay();
        
        const activeSchedules = schedules.filter(schedule => {
            const daysOfWeek = schedule.days_of_week.split(',').map(Number);
            return daysOfWeek.includes(todayDay === 0 ? 7 : todayDay);
        });

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

    const formatDosage = (medication) => {
        if (!medication) return '';
        const amount = medication.dosage_amount || 1;
        const type = medication.dosage_type || '片';
        
        if (amount === 0.5) return '半片';
        if (amount === 1) return '一片';
        if (amount === 1.5) return '一片半';
        return `${amount}${type}`;
    };

    const getRandomEncouragement = () => {
        return encouragements[Math.floor(Math.random() * encouragements.length)];
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <ScrollView>
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
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>
                                {schedule.medication?.name}
                            </Text>
                            <View style={styles.dosageBadge}>
                                <Text style={styles.dosageText}>
                                    {formatDosage(schedule.medication)}
                                </Text>
                            </View>
                        </View>
                        
                        <Text style={styles.scheduleTime}>
                            🕐 {schedule.time}
                        </Text>

                        {schedule.status === 'pending' && (
                            <View style={styles.actionContainer}>
                                <SlideToConfirm 
                                    onConfirm={() => handleMedicationComplete(schedule)}
                                    title="滑动确认已服药"
                                />
                            </View>
                        )}

                        {schedule.status === 'taken' && (
                            <View style={styles.statusContainer}>
                                <Text style={styles.statusIcon}>✅</Text>
                                <Text style={styles.completedText}>
                                    {getRandomEncouragement()}
                                </Text>
                            </View>
                        )}

                        {schedule.status === 'missed' && (
                            <View style={styles.statusContainer}>
                                <Text style={styles.missedIcon}>🌙</Text>
                                <Text style={styles.gentleText}>
                                    错过了也没关系，明天记得按时服药哦 🌸
                                </Text>
                            </View>
                        )}
                    </View>
                ))}

                {todaySchedules.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🌈</Text>
                        <Text style={styles.emptyText}>
                            今天没有服药安排
                        </Text>
                        <Text style={styles.emptySubtext}>
                            去温柔地添加新的服药计划吧
                        </Text>
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    header: {
        padding: 30,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    title: {
        fontSize: 28,
        color: Colors.textOnPrimary,
        fontWeight: 'bold',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textOnPrimary,
        opacity: 0.9
    },
    progressContainer: {
        height: 6,
        backgroundColor: Colors.surface,
        marginHorizontal: 20,
        marginVertical: 15,
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.success
    },
    medicationCard: {
        backgroundColor: Colors.cardBackground,
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 25,
        borderRadius: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1
    },
    dosageBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15
    },
    dosageText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600'
    },
    scheduleTime: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 20
    },
    actionContainer: {
        marginTop: 10
    },
    statusContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.successLight,
        borderRadius: 15,
        marginTop: 10
    },
    statusIcon: {
        fontSize: 28,
        marginBottom: 8
    },
    completedText: {
        fontSize: 16,
        color: Colors.success,
        textAlign: 'center',
        lineHeight: 22
    },
    missedIcon: {
        fontSize: 28,
        marginBottom: 8
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
        padding: 50,
        backgroundColor: Colors.background
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
        opacity: 0.7
    },
    emptyText: {
        fontSize: 20,
        color: Colors.textSecondary,
        marginBottom: 10,
        fontWeight: '600'
    },
    emptySubtext: {
        fontSize: 16,
        color: Colors.textSecondary,
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: 22
    }
});

export default HomeScreen;
```

### 4.5 药物添加界面（片剂计量版 - 温馨配色）

```javascript
// screens/AddMedicationScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { MedicationDao } from '../database/medicationDao';

const AddMedicationScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [dosageAmount, setDosageAmount] = useState(1); // 默认为1片
    const [description, setDescription] = useState('');

    const dosageOptions = [
        { label: '半片', value: 0.5 },
        { label: '一片', value: 1 },
        { label: '一片半', value: 1.5 },
        { label: '两片', value: 2 },
    ];

    const handleAddMedication = async () => {
        if (!name.trim()) {
            alert('请填写药物名称');
            return;
        }

        const medication = {
            name: name.trim(),
            dosage_type: '片',
            dosage_amount: dosageAmount,
            description: description.trim()
        };

        try {
            await MedicationDao.create(medication);
            navigation.goBack();
        } catch (error) {
            alert('添加药物失败，请重试');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>添加新的药物</Text>
                
                <Text style={styles.label}>药物名称</Text>
                <TextInput
                    style={styles.input}
                    placeholder="例如：百忧解"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.textSecondary}
                />

                <Text style={styles.label}>服用剂量</Text>
                <View style={styles.dosageContainer}>
                    {dosageOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.dosageButton,
                                dosageAmount === option.value && styles.dosageButtonActive
                            ]}
                            onPress={() => setDosageAmount(option.value)}
                        >
                            <Text style={[
                                styles.dosageButtonText,
                                dosageAmount === option.value && styles.dosageButtonTextActive
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>温馨备注（可选）</Text>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="添加贴心提醒..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholderTextColor={Colors.textSecondary}
                />

                <TouchableOpacity style={styles.addButton} onPress={handleAddMedication}>
                    <Text style={styles.addButtonText}>温柔地添加</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    header: {
        backgroundColor: Colors.primary,
        padding: 30,
        alignItems: 'center'
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF'
    },
    formContainer: {
        padding: 20
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
        marginTop: 15
    },
    input: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.divider
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    dosageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    dosageButton: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 2,
        borderColor: Colors.divider,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginRight: 10,
        marginBottom: 10
    },
    selectedDosageButton: {
        backgroundColor: Colors.accent,
        borderColor: Colors.primary
    },
    dosageText: {
        fontSize: 16,
        color: Colors.textPrimary
    },
    selectedDosageText: {
        color: Colors.primary,
        fontWeight: 'bold'
    },
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 25,
        padding: 18,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    disabledButton: {
        backgroundColor: Colors.divider
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default AddMedicationScreen;
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