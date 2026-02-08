import { Platform } from 'react-native';

// Use host IP for Android emulator, localhost for iOS simulator
// For physical devices, you might need to use your machine's local IP address
const LOCAL_API_URL = Platform.select({
    android: 'http://192.168.100.33:3000/api',
    ios: 'http://192.168.100.33:3000/api',
    default: 'http://192.168.100.33:3000/api',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL;
