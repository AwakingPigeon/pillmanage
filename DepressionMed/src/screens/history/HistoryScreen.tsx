import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import dayjs from 'dayjs';

export default function HistoryScreen() {
  const { state } = useApp();
  const { medicationRecords, medicines } = state;
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getMedicineName = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    return medicine?.name || '未知药物';
  };

  const groupRecordsByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    
    medicationRecords.forEach(record => {
      const date = dayjs(record.date).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dayjs(dateB).valueOf() - dayjs(dateA).valueOf())
      .map(([date, records]) => ({
        title: formatDate(date),
        data: records.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
      }));
  };

  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const today = dayjs();
    
    if (date.isSame(today, 'day')) {
      return '今天';
    } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return '昨天';
    } else if (date.isSame(today, 'week')) {
      return date.format('dddd');
    } else {
      return date.format('MM月DD日');
    }
  };

  const formatTime = (dateStr: string) => {
    return dayjs(dateStr).format('HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return '#4CAF50';
      case 'missed':
        return '#F44336';
      case 'skipped':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken':
        return '已服用';
      case 'missed':
        return '未服用';
      case 'skipped':
        return '已跳过';
      default:
        return '未知';
    }
  };

  const renderRecordItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={() => {
        setSelectedRecord(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.recordHeader}>
        <Text style={styles.medicineName}>{getMedicineName(item.medicineId)}</Text>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.timeText}>{formatTime(item.date)}</Text>
        <Text style={styles.dosageText}>{item.dosage}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderStats = () => {
    const totalRecords = medicationRecords.length;
    const takenRecords = medicationRecords.filter(r => r.status === 'taken').length;
    const missedRecords = medicationRecords.filter(r => r.status === 'missed').length;
    const complianceRate = totalRecords > 0 ? (takenRecords / totalRecords * 100).toFixed(1) : 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRecords}</Text>
          <Text style={styles.statLabel}>总记录</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{takenRecords}</Text>
          <Text style={styles.statLabel}>已服用</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{missedRecords}</Text>
          <Text style={styles.statLabel}>未服用</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{complianceRate}%</Text>
          <Text style={styles.statLabel}>依从率</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>暂无服药记录</Text>
      <Text style={styles.emptyText}>开始服药后会在这里显示记录</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>服药记录</Text>
      </View>

      {renderStats()}

      {medicationRecords.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          sections={groupRecordsByDate()}
          keyExtractor={(item) => item.id}
          renderItem={renderRecordItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>记录详情</Text>
            {selectedRecord && (
              <ScrollView>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>药物名称：</Text>
                  <Text style={styles.detailValue}>{getMedicineName(selectedRecord.medicineId)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>服用时间：</Text>
                  <Text style={styles.detailValue}>{formatTime(selectedRecord.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>剂量：</Text>
                  <Text style={styles.detailValue}>{selectedRecord.dosage}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>状态：</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedRecord.status) }]}>
                    {getStatusText(selectedRecord.status)}
                  </Text>
                </View>
                {selectedRecord.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>备注：</Text>
                    <Text style={styles.detailValue}>{selectedRecord.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  recordItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  dosageText: {
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});