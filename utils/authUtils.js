import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'hymn_app_device_id';
const SESSION_KEY = 'hymn_app_session';

// ─── Device ID ───
// Generate a unique device ID on first launch, persist in AsyncStorage.
export const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// ─── Session Management ───
export const saveSession = async (session) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = async () => {
  const json = await AsyncStorage.getItem(SESSION_KEY);
  return json ? JSON.parse(json) : null;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};

// ─── Hash PIN (client-side, for display/validation only) ───
// Note: actual hashing is done server-side in Convex
export const validatePin = (pin) => {
  return /^\d{6}$/.test(pin);
};

// ─── UUID Generator ───
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
