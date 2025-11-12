import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MedicineListScreen from '../screens/medicine/MedicineListScreen';
import AddMedicineScreen from '../screens/medicine/AddMedicineScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MedicineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MedicineList" 
        component={MedicineListScreen} 
        options={{ title: '药物管理' }}
      />
      <Stack.Screen 
        name="AddMedicine" 
        component={AddMedicineScreen} 
        options={({ route }) => ({
          title: route.params?.medicine ? '编辑药物' : '添加药物',
        })}
      />
    </Stack.Navigator>
  );
}

// 导入实际的屏幕组件
import ReminderScreen from '../screens/reminder/ReminderScreen';
import HistoryScreen from '../screens/history/HistoryScreen';

// 导入聊天屏幕
import ChatScreen from '../screens/chat/ChatScreen';

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Medicine" 
          component={MedicineStack} 
          options={{
            title: '药物',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💊</Text>,
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="Reminder" 
          component={ReminderScreen} 
          options={{
            title: '提醒',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⏰</Text>,
          }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{
            title: '记录',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            title: '设置',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

import { View, Text } from 'react-native';