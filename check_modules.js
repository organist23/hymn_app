try {
  console.log('Checking babel-preset-expo:', require.resolve('babel-preset-expo'));
} catch (e) {
  console.error('babel-preset-expo NOT FOUND');
}

try {
  console.log('Checking react-native-reanimated:', require.resolve('react-native-reanimated'));
} catch (e) {
  console.error('react-native-reanimated NOT FOUND');
}

try {
  console.log('Checking expo/metro-config:', require.resolve('expo/metro-config'));
} catch (e) {
  console.error('expo/metro-config NOT FOUND'); // This might fail if it's not a direct dependency but exported by expo
}
