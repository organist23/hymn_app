import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    BackHandler,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import DatePicker from '../components/DatePicker';
import HymnInput from '../components/HymnInput';
import { getCurrentDate, getWorshipDates } from '../utils/dateUtils';
import { parseHymnInput } from '../utils/hymnUtils';
import { createCombinedPdf } from '../utils/pdfUtils';
import { saveToHistory } from '../utils/storageUtils';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [initDate] = useState(getCurrentDate());
  const [month, setMonth] = useState(initDate.month);
  const [year, setYear] = useState(initDate.year);
  const [worshipDates, setWorshipDates] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Inputs
  const [preludes, setPreludes] = useState('');
  const [mainHymns, setMainHymns] = useState('');
  const [offering, setOffering] = useState('');
  const [recessional, setRecessional] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  // Update generated dates when month/year changes
  useEffect(() => {
    const dates = getWorshipDates(month, year);
    setWorshipDates(dates);
    if (selectedDateIndex >= dates.length) {
      setSelectedDateIndex(0);
    }
  }, [month, year]);

  const handleCombine = async () => {
    if (worshipDates.length === 0) {
        Alert.alert('Error', 'No worship dates generated.');
        return;
    }

    setLoading(true);
    try {
      const selected = worshipDates[selectedDateIndex];
      
      // 1. Parse Inputs
      const parsedPreludes = parseHymnInput(preludes);
      const parsedMain = parseHymnInput(mainHymns);
      const parsedOffering = parseHymnInput(offering);
      const parsedRecessional = parseHymnInput(recessional);

      if (parsedMain.length === 0 && parsedPreludes.length === 0 && parsedOffering.length === 0 && parsedRecessional.length === 0) {
        Alert.alert('Validation', 'Please input at least one hymn.');
        setLoading(false);
        return;
      }

      // 2. Resolve Files
      // Merge Order: Preludes -> Main -> Offering -> Recessional
      // File Naming:
      // Main: ###.pdf (e.g., 339.pdf) - User said "339-S.pdf" in example but "339.pdf" in provided folder?
      // WAIT: User's provided file list has "339.pdf". 
      // User said "Convert to PDF file names: Main -> 339-S.pdf". This might be the OUTPUT name in the merge??
      // OR they want to LOOK for `339-S.pdf`?
      // Looking at the file list provided in `list_dir`: `339.pdf`, `252.pdf`.
      // The user Requirement "Convert to PDF file names: Main -> 339-S.pdf" is confusing if the source is `339.pdf`.
      // It likely means "The resulting section in the combined PDF corresponds to this" OR "The file to look for is 339-S.pdf".
      // BUT the provided files are just numbers. `1.pdf`, `10.pdf`, etc.
      // So I will assume the SOURCE is just `###.pdf`.
      
      const missingFiles = [];
      const filesToMerge = [];
      const hymnsDir = FileSystem.documentDirectory + 'hymns/';

      const resolveAndAdd = async (list, type) => {
        for (const num of list) {
             // Look for exact match or padded match
             let filename = `${num}.pdf`;
             // Try to find the file
             let fileInfo = await FileSystem.getInfoAsync(hymnsDir + filename);
             
             // Try stripping leading zeros if not found (e.g. 008 vs 8.pdf)
             if (!fileInfo.exists) {
                 const simpleNum = parseInt(num, 10).toString();
                 const altFilename = `${simpleNum}.pdf`;
                 const altInfo = await FileSystem.getInfoAsync(hymnsDir + altFilename);
                 if (altInfo.exists) {
                    filename = altFilename;
                    fileInfo = altInfo;
                 }
             }

             if (fileInfo.exists) {
                 filesToMerge.push(hymnsDir + filename);
             } else {
                 missingFiles.push(`${type} ${num}`);
             }
        }
      };

      await resolveAndAdd(parsedPreludes, 'Prelude');
      await resolveAndAdd(parsedMain, 'Main');
      await resolveAndAdd(parsedOffering, 'Offering');
      await resolveAndAdd(parsedRecessional, 'Recessional');

      if (missingFiles.length > 0) {
        Alert.alert('Missing Files', `Could not find PDF files for:\n${missingFiles.join(', ')}\n\nPlease ensure files are in the 'hymns' folder.`);
        setLoading(false);
        return;
      }

      // 3. Generate Output Filename
      let baseOutputName;
      if (customFileName.trim()) {
        const sanitized = customFileName.replace(/[^a-z0-9 _-]/gi, '').trim();
        if (sanitized) {
          baseOutputName = sanitized.toLowerCase().endsWith('.pdf') ? sanitized.slice(0, -4) : sanitized;
        }
      }

      if (!baseOutputName) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(selected.date).padStart(2, '0');
        const dayType = selected.fileLabel.split('-')[1]; // 'S' or 'TH'
        baseOutputName = `${year}-${mm}-${dd}-${dayType}`;
      }

      let outputName = `${baseOutputName}.pdf`;
      const combinedDir = FileSystem.documentDirectory + 'combined/';
      
      // Ensure directory exists so we can check it
      const dirInfo = await FileSystem.getInfoAsync(combinedDir);
      if (dirInfo.exists) {
        let counter = 2;
        let checkFile = await FileSystem.getInfoAsync(combinedDir + outputName);
        while (checkFile.exists) {
          outputName = `${baseOutputName} (${counter}).pdf`;
          checkFile = await FileSystem.getInfoAsync(combinedDir + outputName);
          counter++;
        }
      }

      // 4. Combine
      const combinedUri = await createCombinedPdf(filesToMerge, outputName);

      // 5. Save History
      const historyItem = {
        id: Date.now().toString(),
        month: month + 1,
        year,
        serviceDate: selected.label,
        preludes: parsedPreludes,
        mainHymns: parsedMain,
        offering: parsedOffering,
        recessional: parsedRecessional,
        filePath: combinedUri,
        fileName: outputName,
        createdAt: new Date().toISOString(),
      };
      
      await saveToHistory(historyItem);

      setLoading(false);
      Alert.alert(
        'Success', 
        `Created ${outputName}`,
        [
            { text: 'View Now', onPress: () => navigation.navigate('PDFViewer', { uri: `${combinedUri}?t=${Date.now()}` }) },
            { text: 'OK' }
        ]
      );

    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert('Error', 'Failed to combine PDFs. ' + error.message);
    }
  };

  const handleExit = () => {
    Alert.alert(
      "Exit App",
      "Are you sure you want to close the app?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.mainHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.mainTitle}>Hymn Combiner</Text>
        </View>
        <Image 
          source={require('../logo/logo.jpg')} 
          style={styles.logo} 
          resizeMode="cover"
        />
      </View>
      
      {/* Date Selection */}
      <DatePicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />

      {/* Worship Date List */}
      <Text style={styles.sectionTitle}>Select Worship Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
        {worshipDates.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.dateCard, selectedDateIndex === index && styles.selectedDateCard]}
            onPress={() => setSelectedDateIndex(index)}
          >
            <Text style={[styles.dateText, selectedDateIndex === index && styles.selectedDateText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <HymnInput 
            label="Main Hymns" 
            placeholder="e.g. 339, 252, 13, 311" 
            value={mainHymns} 
            onChangeText={setMainHymns} 
        />
        <HymnInput 
            label="Preludes" 
            placeholder="e.g. 8, 50" 
            value={preludes} 
            onChangeText={setPreludes} 
        />
        <HymnInput 
            label="Offering" 
            placeholder="e.g. 544" 
            value={offering} 
            onChangeText={setOffering} 
        />
        <HymnInput 
            label="Recessional" 
            placeholder="e.g. 473" 
            value={recessional} 
            onChangeText={setRecessional} 
        />
        <HymnInput 
            label="Custom Filename (Optional)" 
            placeholder="e.g. SpecialService" 
            value={customFileName} 
            onChangeText={setCustomFileName} 
            keyboardType="default"
        />
      </View>

      {/* Action */}
        <TouchableOpacity 
          style={[styles.combineButton, loading && styles.disabledButton]} 
          onPress={handleCombine}
          disabled={loading}
        >
          <Text style={styles.combineButtonText}>
            {loading ? 'Processing...' : 'Generate'}
          </Text>
        </TouchableOpacity>

      <View style={styles.navSection}>
        <TouchableOpacity 
          style={[styles.navButton, styles.historyNavBtn]} 
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyNavBtnText}>📂 View History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.exitNavBtn]} 
          onPress={handleExit}
        >
          <Text style={styles.exitNavBtnText}>🚪 Exit App</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.copyrightText}>Copyright © 2026 Keiphil Guimba</Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    padding: 15,
  },
  mainHeader: {
    marginTop: 50,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#4D9FFF', // Unified accent blue
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40, // Perfect circle
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff', // White for blue background
    letterSpacing: -0.8,
  },
  mainSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)', // Semi-transparent white
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
    paddingLeft: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4D9FFF', // Theme accent blue
  },
  datesContainer: {
    marginBottom: 20,
    maxHeight: 60,
  },
  dateCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 40,
    justifyContent: 'center',
  },
  selectedDateCard: {
    backgroundColor: '#4D9FFF', // Unified accent blue
    borderColor: '#4D9FFF',
  },
  dateText: {
    color: '#333',
    fontWeight: '600',
  },
  selectedDateText: {
    color: '#fff',
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  combineButton: {
    backgroundColor: '#4D9FFF', // Unified accent blue
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  combineButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyButton: {
    padding: 15,
    alignItems: 'center',
  },
  navSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    maxWidth: 160,
  },
  historyNavBtn: {
    backgroundColor: '#fff',
    borderColor: '#4D9FFF',
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  historyNavBtnText: {
    color: '#4D9FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  exitNavBtn: {
    backgroundColor: '#fff',
    borderColor: '#ff3b30',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  exitNavBtnText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
    paddingTop: 15,
  },
  copyrightText: {
    fontSize: 11,
    color: '#a1a1a6',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
