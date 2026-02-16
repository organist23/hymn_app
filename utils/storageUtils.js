import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const HISTORY_KEY = 'hymn_combiner_history';

export const saveToHistory = async (record) => {
  try {
    const existingHistory = await getHistory();
    const newHistory = [{ ...record, isPinned: false }, ...existingHistory];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Failed to fetch history", e);
    return [];
  }
};

export const deleteFromHistory = async (id) => {
  try {
    const existingHistory = await getHistory();
    const itemToDelete = existingHistory.find(item => item.id === id);
    
    if (itemToDelete && itemToDelete.filePath) {
      try {
        await FileSystem.deleteAsync(itemToDelete.filePath, { idempotent: true });
      } catch (fileErr) {
        console.warn("Failed to delete physical file", fileErr);
      }
    }

    const newHistory = existingHistory.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error("Failed to delete from history", e);
    return null;
  }
};

export const togglePin = async (id) => {
  try {
    const existingHistory = await getHistory();
    const newHistory = existingHistory.map(item => {
      if (item.id === id) {
        return { ...item, isPinned: !item.isPinned };
      }
      return item;
    });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error("Failed to toggle pin", e);
    return null;
  }
};

export const clearHistory = async () => {
  try {
    const history = await getHistory();
    for (const item of history) {
      if (item.filePath) {
        await FileSystem.deleteAsync(item.filePath, { idempotent: true });
      }
    }
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error("Failed to clear history", e);
  }
};
