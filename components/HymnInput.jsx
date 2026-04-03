import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const HymnInput = ({ label, value, onChangeText, placeholder, keyboardType = 'number-pad' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#636366"
        keyboardType={keyboardType} 
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#e5e5e7',
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#e5e5e7',
  },
});

export default HymnInput;
