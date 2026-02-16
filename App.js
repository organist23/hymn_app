import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import HistoryScreen from './screens/HistoryScreen';
import HomeScreen from './screens/HomeScreen';
import PDFViewerScreen from './screens/PDFViewerScreen';
import { hymnAssets } from './utils/hymnFileMap';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenProps, setScreenProps] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [initStatus, setInitStatus] = useState('Initializing...');

  useEffect(() => {
    initializeHymns();
  }, []);

  const initializeHymns = async () => {
    try {
      setInitStatus('Checking hymns...');
      const hymnsDir = FileSystem.documentDirectory + 'hymns/';
      const dirInfo = await FileSystem.getInfoAsync(hymnsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(hymnsDir, { intermediates: true });
      }

      const keys = Object.keys(hymnAssets);
      const total = keys.length;
      let count = 0;
      let importedCount = 0;

      for (const filename of keys) {
          count++;
          // Check if this specific file already exists in phone storage
          const fileInfo = await FileSystem.getInfoAsync(hymnsDir + filename);
          
          if (!fileInfo.exists) {
              // Only download and copy if it's missing
              const assetModule = hymnAssets[filename];
              const asset = Asset.fromModule(assetModule);
              await asset.downloadAsync();
              
              if (asset.localUri) {
                  await FileSystem.copyAsync({
                      from: asset.localUri,
                      to: hymnsDir + filename
                  });
                  importedCount++;
              }
          }
          
          if (count % 25 === 0) {
              setInitStatus(`Syncing hymns... ${Math.round((count/total)*100)}%`);
          }
      }
      
      if (importedCount > 0) {
        console.log(`Synced ${importedCount} new hymns.`);
      } else {
        console.log("Hymns directory is up to date.");
      }
      
      setIsReady(true);
    } catch (e) {
      console.error("Error initializing hymns:", e);
      setInitStatus('Error initializing: ' + e.message);
      // Allow continuing anyway?
      setTimeout(() => setIsReady(true), 3000);
    }
  };

  // Simple Navigation System
  const navigation = {
    navigate: (screen, props = {}) => {
      setScreenProps(props);
      setCurrentScreen(screen);
    },
    goBack: () => {
      if (currentScreen !== 'Home') {
          setCurrentScreen('Home');
      }
    }
  };

  const route = { params: screenProps };

  const renderScreen = () => {
    switch(currentScreen) {
        case 'Home':
            return <HomeScreen navigation={navigation} />;
        case 'History':
            return <HistoryScreen navigation={navigation} />;
        case 'PDFViewer':
            return <PDFViewerScreen navigation={navigation} route={route} />;
        default:
            return <HomeScreen navigation={navigation} />;
    }
  };

  if (!isReady) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ marginTop: 20 }}>{initStatus}</Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.content}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
});
