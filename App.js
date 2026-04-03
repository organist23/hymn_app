import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import AdminScreen from './screens/AdminScreen';
import HistoryScreen from './screens/HistoryScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import PDFViewerScreen from './screens/PDFViewerScreen';
import PinnedScreen from './screens/PinnedScreen';
import { hymnAssets } from './utils/hymnFileMap';
import { clearSession, getDeviceId, getSession } from './utils/authUtils';

// Initialize Convex client
const convex = new ConvexReactClient("https://majestic-hare-999.convex.cloud");

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenProps, setScreenProps] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [initStatus, setInitStatus] = useState('Initializing...');

  // Auth state
  const [session, setSession] = useState(null);             // { userId, email, role }
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // loading auth on startup

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check auth session first
    await checkSavedSession();

    // Then initialize hymns
    await initializeHymns();
  };

  const checkSavedSession = async () => {
    try {
      const savedSession = await getSession();
      if (savedSession && savedSession.userId) {
        // We have a saved session — validate it with Convex
        // For now, trust the local session. Convex validateSession
        // will be checked reactively when the app loads.
        setSession(savedSession);
      }
    } catch (e) {
      console.error('Failed to check session:', e);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (result) => {
    setSession({
      userId: result.userId,
      email: result.email,
      role: result.role,
    });
    setCurrentScreen('Home');
    setScreenStack(['Home']);
  };

  const handleLogout = async () => {
    await clearSession();
    setSession(null);
    setCurrentScreen('Home');
    setScreenStack(['Home']);
  };

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
          const fileInfo = await FileSystem.getInfoAsync(hymnsDir + filename);
          
          if (!fileInfo.exists) {
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
      setTimeout(() => setIsReady(true), 3000);
    }
  };

  // Simple Navigation System with back stack
  const [screenStack, setScreenStack] = useState(['Home']);

  const navigation = {
    navigate: (screen, props = {}) => {
      setScreenProps(props);
      setCurrentScreen(screen);
      setScreenStack(prev => [...prev, screen]);
    },
    goBack: () => {
      setScreenStack(prev => {
        if (prev.length <= 1) return prev;
        const newStack = prev.slice(0, -1);
        const previousScreen = newStack[newStack.length - 1];
        setCurrentScreen(previousScreen);
        return newStack;
      });
    }
  };

  const route = { params: screenProps };

  const renderScreen = () => {
    switch(currentScreen) {
        case 'Home':
            return <HomeScreen navigation={navigation} session={session} onLogout={handleLogout} />;
        case 'History':
            return <HistoryScreen navigation={navigation} />;
        case 'Pinned':
            return <PinnedScreen navigation={navigation} />;
        case 'PDFViewer':
            return <PDFViewerScreen navigation={navigation} route={route} />;
        case 'Admin':
            return <AdminScreen navigation={navigation} session={session} />;
        default:
            return <HomeScreen navigation={navigation} session={session} onLogout={handleLogout} />;
    }
  };

  // Show loading while checking auth + initializing hymns
  if (!isReady || isCheckingAuth) {
      return (
        <ConvexProvider client={convex}>
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#4D9FFF" />
              <Text style={{ marginTop: 20, color: '#a1a1aa' }}>{initStatus}</Text>
          </View>
        </ConvexProvider>
      );
  }

  // Not logged in → show login screen
  if (!session) {
    return (
      <ConvexProvider client={convex}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0d0d0f" />
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </SafeAreaView>
      </ConvexProvider>
    );
  }

  // Logged in → show app
  return (
    <ConvexProvider client={convex}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0f" />
        
        <View style={styles.content}>
          {renderScreen()}
        </View>
      </SafeAreaView>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
