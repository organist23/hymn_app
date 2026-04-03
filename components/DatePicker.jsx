import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMonthName } from '../utils/dateUtils';

const DatePicker = ({ month, year, onMonthChange, onYearChange }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worship Schedule</Text>
        <View style={styles.yearBadge}>
          <TouchableOpacity onPress={() => onYearChange(year - 1)} style={styles.yearTouch}>
            <Text style={styles.yearArrow}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.yearText}>{year}</Text>
          <TouchableOpacity onPress={() => onYearChange(year + 1)} style={styles.yearTouch}>
            <Text style={styles.yearArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity 
          onPress={() => onMonthChange((month - 1 + 12) % 12)} 
          style={styles.navButton}
        >
          <Text style={styles.navIcon}>◀</Text>
        </TouchableOpacity>
        
        <View style={styles.monthDisplay}>
          <Text style={styles.monthName}>{getMonthName(month)}</Text>
          <Text style={styles.monthSub}>Selection</Text>
        </View>

        <TouchableOpacity 
          onPress={() => onMonthChange((month + 1) % 12)} 
          style={styles.navButton}
        >
          <Text style={styles.navIcon}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yearTouch: {
    padding: 6,
  },
  yearArrow: {
    fontSize: 10,
    color: '#4D9FFF',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e5e7',
    marginHorizontal: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  navIcon: {
    fontSize: 14,
    color: '#4D9FFF',
    fontWeight: 'bold',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e5e5e7',
    marginBottom: 2,
  },
  monthSub: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default DatePicker;
