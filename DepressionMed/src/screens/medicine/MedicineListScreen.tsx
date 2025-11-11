import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import type { Medicine } from '../../types';

export default function MedicineListScreen({ navigation }: any) {
  const { state, deleteMedicine } = useApp();
  const { medicines } = state;

  const handleDeleteMedicine = (id: string) => {
    Alert.alert(
      '删除药物',
      '确定要删除这个药物吗？相关的服药记录也会被删除。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteMedicine(id),
        },
      ]
    );
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <View style={styles.medicineItem}>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <Text style={styles.medicineDosage}>{item.dosage}</Text>
        <Text style={styles.medicineFrequency}>
          {item.frequency === 'daily' && '每日一次'}
          {item.frequency === 'twice_daily' && '每日两次'}
          {item.frequency === 'three_times_daily' && '每日三次'}
          {item.frequency === 'as_needed' && '按需服用'}
        </Text>
        <Text style={styles.medicineTimes}>
          服药时间: {item.times.join(', ')}
        </Text>
      </View>
      <View style={styles.medicineActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddMedicine', { medicine: item })}
        >
          <Text style={styles.buttonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMedicine(item.id)}
        >
          <Text style={styles.buttonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无药物记录</Text>
      <Text style={styles.emptySubtext}>点击下方按钮添加第一个药物</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={renderMedicineItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={medicines.length === 0 ? styles.emptyList : null}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <Text style={styles.addButtonText}>+ 添加药物</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  medicineItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  medicineFrequency: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  medicineTimes: {
    fontSize: 14,
    color: '#888',
  },
  medicineActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});