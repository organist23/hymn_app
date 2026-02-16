import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteFromHistory, getHistory, togglePin } from '../utils/storageUtils';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getHistory();
    // Sort: Pinned first, then by date (descending)
    const sortedData = [...data].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setHistory(sortedData);
  };

  const formatHymnList = (hymns) => {
    if (!hymns) return '';
    const list = Array.isArray(hymns) ? hymns : String(hymns).split(',').map(s => s.trim());
    return list
      .map(h => parseInt(h, 10))
      .filter(num => !isNaN(num))
      .join(', ');
  };

  const handleOpen = (uri) => {
    navigation.navigate('PDFViewer', { uri });
  };

  const handleShare = async (uri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Error', 'Sharing is not available on this platform');
    }
  };

  const handleTogglePin = async (id) => {
    const updated = await togglePin(id);
    if (updated) {
      loadHistory();
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete History',
      'Are you sure you want to delete this record and its PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteFromHistory(id);
            if (updated) {
              loadHistory();
            }
          }
        }
      ]
    );
  };

  const renderHymnChips = (hymns, isPinned) => {
    if (!hymns) return null;
    const list = Array.isArray(hymns) ? hymns : String(hymns).split(',').map(s => s.trim());
    const filtered = list.map(h => parseInt(h, 10)).filter(num => !isNaN(num));
    
    if (filtered.length === 0) return null;

    return (
      <View style={styles.chipContainer}>
        {filtered.map((num, idx) => (
          <View key={idx} style={[styles.hymnChip, isPinned && styles.pinnedHymnChip]}>
            <Text style={[styles.hymnChipText, isPinned && styles.pinnedHymnChipText]}>{num}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.isPinned && styles.pinnedCard]}>
      {/* Accent Bar for pinned items */}
      {item.isPinned && <View style={styles.accentBar} />}
      
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.date} numberOfLines={1}>{item.fileName}</Text>
        </View>
        <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailLabel}>Hymns Included</Text>
        {renderHymnChips(item.mainHymns, item.isPinned)}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.miniButton, item.isPinned ? styles.unpinBtn : styles.pinBtn]} 
          onPress={() => handleTogglePin(item.id)}
        >
          <Text style={[styles.miniButtonText, item.isPinned && styles.unpinBtnText]}>
            {item.isPinned ? '📍 Unpin' : '📌 Pin'}
          </Text>
        </TouchableOpacity>

        <View style={styles.mainActions}>
          <TouchableOpacity style={[styles.pillButton, styles.openBtn]} onPress={() => handleOpen(item.filePath)}>
            <Text style={styles.pillButtonText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, styles.shareBtn]} onPress={() => handleShare(item.filePath)}>
            <Text style={styles.pillButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
            <Text style={[styles.pillButtonText, styles.deleteBtnText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>History</Text>
        </View>
        <Text style={styles.count}>{history.length} items</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No history yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backBtnIcon: {
    fontSize: 24,
    color: '#4D9FFF', // Unified accent blue
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  count: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    position: 'relative',
  },
  pinnedCard: {
    backgroundColor: '#f6faff', // Subtle blue tint for pinned items
    borderColor: 'rgba(0, 122, 255, 0.2)',
    borderWidth: 1.5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#4D9FFF', // Softer blue
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  date: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1c1e',
    letterSpacing: -0.3,
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
  },
  details: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hymnChip: {
    backgroundColor: '#f2f2f7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  hymnChipText: {
    color: '#4D9FFF', // Softer blue
    fontSize: 13,
    fontWeight: '700',
  },
  pinnedHymnChip: {
    backgroundColor: '#4D9FFF', // Softer blue
    borderColor: '#4D9FFF',
  },
  pinnedHymnChipText: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  pillButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  openBtn: {
    backgroundColor: '#4D9FFF', // Unified accent blue
  },
  shareBtn: {
    backgroundColor: '#5856D6', // Premium Purple/Blue
    paddingHorizontal: 14,
  },
  deleteBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteBtnText: {
    color: '#ff3b30',
  },
  miniButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  pinBtn: {
    borderColor: '#e5e5ea',
    backgroundColor: '#f2f2f7',
  },
  unpinBtn: {
    borderColor: '#4D9FFF',
    backgroundColor: 'rgba(77, 159, 255, 0.08)',
  },
  unpinBtnText: {
    color: '#4D9FFF',
  },
  miniButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#8e8e93',
    fontWeight: '600',
  }
});
