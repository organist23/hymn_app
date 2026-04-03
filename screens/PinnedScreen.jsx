import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteFromHistory, getHistory, togglePin } from '../utils/storageUtils';

export default function PinnedScreen({ navigation }) {
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    loadPinned();
  }, []);

  const loadPinned = async () => {
    const data = await getHistory();
    const pinnedData = data
      .filter(item => item.isPinned)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setPinned(pinnedData);
  };

  const handleOpen = (uri) => {
    navigation.navigate('PDFViewer', { uri: `${uri}?t=${Date.now()}` });
  };

  const handleShare = async (uri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Error', 'Sharing is not available on this platform');
    }
  };

  const handleUnpin = async (id) => {
    const updated = await togglePin(id);
    if (updated) {
      loadPinned();
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Pinned',
      'Are you sure you want to delete this pinned record and its PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteFromHistory(id);
            if (updated) {
              loadPinned();
            }
          }
        }
      ]
    );
  };

  const renderHymnChips = (hymns, label) => {
    if (!hymns) return null;
    const list = Array.isArray(hymns) ? hymns : String(hymns).split(',').map(s => s.trim());
    const filtered = list.map(h => parseInt(h, 10)).filter(num => !isNaN(num));
    
    if (filtered.length === 0) return null;

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>{label}:</Text>
        <View style={styles.chipContainer}>
          {filtered.map((num, idx) => (
            <View key={idx} style={styles.hymnChip}>
              <Text style={styles.hymnChipText}>{num}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">{item.fileName}</Text>
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedBadgeText}>📍 PINNED</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailLabel}>Hymns Included</Text>
        {renderHymnChips(item.mainHymns, 'Main Hymns')}
        {renderHymnChips(item.preludes, 'Preludes')}
        {renderHymnChips(item.offering, 'Offering')}
        {renderHymnChips(item.recessional, 'Recessional')}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.miniButton, styles.unpinBtn]} 
          onPress={() => handleUnpin(item.id)}
        >
          <Text style={[styles.miniButtonText, styles.unpinBtnText]}>📍 Unpin</Text>
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
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.backBtn}>
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pinned</Text>
        </View>
        <Text style={styles.count}>{pinned.length} items</Text>
      </View>
      <FlatList
        data={pinned}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyText}>No pinned hymns yet.</Text>
            <Text style={styles.emptySubText}>Pin items from History to see them here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  header: {
    backgroundColor: '#1c1c1e',
    padding: 10,
    paddingTop: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
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
    color: '#4D9FFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e5e5e7',
  },
  count: {
    fontSize: 14,
    color: '#636366',
    fontWeight: '600',
  },
  list: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#f0f6ff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(77, 159, 255, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#4D9FFF',
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pinnedBadge: {
    backgroundColor: '#4D9FFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  pinnedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
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
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2a6fcf',
    marginRight: 8,
    minWidth: 85,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  hymnChip: {
    backgroundColor: '#4D9FFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4D9FFF',
  },
  hymnChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: '#4D9FFF',
  },
  shareBtn: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 14,
  },
  deleteBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff453a',
  },
  deleteBtnText: {
    color: '#ff453a',
  },
  miniButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  unpinBtn: {
    borderColor: '#4D9FFF',
    backgroundColor: 'rgba(77, 159, 255, 0.12)',
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
    color: '#636366',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 13,
    color: '#48484a',
    fontWeight: '500',
    marginTop: 8,
  },
});
