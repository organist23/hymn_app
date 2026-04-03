import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { getDeviceId, saveSession, validatePin } from '../utils/authUtils';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useMutation(api.users.login);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!validatePin(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      const result = await loginMutation({
        email: email.trim(),
        pin,
        deviceId,
      });

      // Save session
      await saveSession({
        userId: result.userId,
        email: result.email,
        role: result.role,
      });

      onLoginSuccess(result);
    } catch (e) {
      const msg = e?.message || 'Login failed. Please try again.';
      if (msg.includes('locked to another device')) {
        setError('🔒 This account is locked to another device.\nContact your admin to reset.');
      } else if (msg.includes('Invalid email or PIN')) {
        setError('Invalid email or PIN. Please try again.');
      } else if (msg.includes('deactivated')) {
        setError('Account deactivated. Contact your admin.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.branding}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../logo/logo.jpg')} 
              style={styles.logoImage} 
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>Hymn Combiner</Text>
        </View>

        {/* Login Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              placeholder="Enter your email"
              placeholderTextColor="#636366"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN (6 digits)</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                setPin(cleaned);
                setError('');
              }}
              placeholder="••••••"
              placeholderTextColor="#636366"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              editable={!isLoading}
            />
            <View style={styles.pinDots}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, i < pin.length && styles.dotFilled]}
                />
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Contact your administrator for account access
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1c1c1e',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#e5e5e7',
    letterSpacing: -0.8,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e5e5e7',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#e5e5e7',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3a3a3c',
  },
  dotFilled: {
    backgroundColor: '#4D9FFF',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#4D9FFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    elevation: 3,
    shadowColor: '#4D9FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    color: '#48484a',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 24,
  },
});
