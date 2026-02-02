import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSync } from './src/hooks/useSync';
import { useAuthStore } from './src/store/authStore';
import { useOutletStore, Outlet } from './src/store/outletStore';
import { useEmployeeStore } from './src/store/employeeStore';
import POSScreen from './src/screens/POSScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OutletPickerScreen from './src/screens/OutletPickerScreen';
import PinEntryScreen from './src/screens/PinEntryScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Screen = 'login' | 'register' | 'outlet_picker' | 'pin_entry' | 'pos' | 'cart' | 'checkout';

function SyncIndicator({ status, isOnline }: { status: string; isOnline: boolean }) {
  const getStatusColor = () => {
    if (!isOnline) return 'bg-zinc-400';
    switch (status) {
      case 'syncing': return 'bg-secondary-400';
      case 'synced': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-zinc-300';
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    switch (status) {
      case 'syncing': return 'sync';
      case 'synced': return 'check-circle-outline';
      case 'error': return 'alert-circle-outline';
      default: return 'cloud-outline';
    }
  };

  return (
    <View className="absolute top-12 right-4 z-50 flex-row items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md ">
      <MaterialCommunityIcons
        name={getStatusIcon()}
        size={14}
        color={!isOnline ? '#9ca3af' : status === 'synced' ? '#22c55e' : '#52525b'}
      />
      <Text className="text-xs font-medium text-zinc-600 ">
        {!isOnline ? 'Offline' : status === 'syncing' ? 'Syncing...' : 'Synced'}
      </Text>
    </View>
  );
}

function LoginScreen({ onLoginSuccess, onGoToRegister }: { onLoginSuccess: () => void; onGoToRegister: () => void }) {
  const { isOnline, syncStatus, syncAll, lastSyncedAt } = useSync();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (isOnline) {
      syncAll();
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Mohon isi email dan password');
      return;
    }
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (e: any) {
      Alert.alert('Gagal Login', e.message || 'Email atau password salah');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 bg-zinc-50 ">
        <View className="flex-1 items-center justify-center px-8">
          <StatusBar style="dark" />
          <SyncIndicator status={syncStatus} isOnline={isOnline} />

          {/* Brand Logo */}
          <View className="mb-6 flex h-28 w-28 items-center justify-center rounded-[32px] bg-primary-600 shadow-2xl shadow-primary-500/30">
            <MaterialCommunityIcons name="storefront-outline" size={48} color="white" />
          </View>

          <Text className="text-4xl font-extrabold tracking-tight text-zinc-900 ">
            Sedia POS
          </Text>
          <Text className="mt-2 text-center text-sm font-medium text-zinc-500 ">
            Sistem Kasir Modern & Terintegrasi
          </Text>

          {/* Offline Badge */}
          {!isOnline && (
            <View className="mt-4 flex-row items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 ">
              <MaterialCommunityIcons name="wifi-off" size={12} color="#52525b" />
              <Text className="text-xs font-medium text-zinc-600 ">
                Mode Offline
              </Text>
            </View>
          )}

          {/* Login Form */}
          <View className="mt-12 w-full gap-4">
            <View className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm border border-zinc-100  ">
              <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                className="flex-1 ml-3 text-base text-zinc-900 "
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm border border-zinc-100  ">
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9ca3af" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                className="flex-1 ml-3 text-base text-zinc-900 "
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`flex-row w-full items-center justify-center gap-2 rounded-2xl py-4 shadow-lg shadow-secondary-500/20 active:opacity-90 ${isLoading ? 'bg-secondary-300' : 'bg-secondary-500'
                }`}
            >
              {isLoading ? <ActivityIndicator color="#18181b" /> : <MaterialCommunityIcons name="login" size={20} color="#18181b" />}
              <Text className="text-base font-bold text-zinc-900">
                {isLoading ? 'Masuk...' : 'Masuk ke POS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onGoToRegister}
              disabled={isLoading}
              className="flex-row w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 shadow-sm active:bg-zinc-50  "
            >
              <MaterialCommunityIcons name="account-plus-outline" size={20} color={isOnline ? "#18181b" : "#a1a1aa"} />
              <Text className="text-base font-semibold text-zinc-900 ">
                Daftar Akun Baru
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-8 text-xs font-medium text-zinc-400">
            v1.0.0 • Powered by Sedia Ecosystem
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('login');
  const { checkSession, user, isLoading, logout } = useAuthStore();
  const { currentOutlet, setCurrentOutlet } = useOutletStore();
  const { currentEmployee, clearEmployee } = useEmployeeStore();

  React.useEffect(() => {
    // Check for persisted session on mount
    checkSession();
  }, []);

  React.useEffect(() => {
    // Redirect logic based on auth state
    if (user && currentScreen === 'login') {
      // If logged in, go to outlet picker (or PIN if outlet selected, or POS if employee logged in)
      if (currentOutlet && currentEmployee) {
        setCurrentScreen('pos');
      } else if (currentOutlet) {
        setCurrentScreen('pin_entry');
      } else {
        setCurrentScreen('outlet_picker');
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setCurrentOutlet(null);
    clearEmployee();
    setCurrentScreen('login');
  };

  const handleOutletSelected = (outlet: Outlet) => {
    setCurrentOutlet(outlet);
    setCurrentScreen('pin_entry');
  };

  const handlePinSuccess = () => {
    setCurrentScreen('pos');
  };

  const navigateTo = (screen: Screen) => setCurrentScreen(screen);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50">
        <ActivityIndicator size="large" color="#377f7e" />
        <Text className="mt-4 text-zinc-500">Memuat Sedia POS...</Text>
      </View>
    );
  }

  switch (currentScreen) {
    case 'outlet_picker':
      return (
        <OutletPickerScreen
          onOutletSelected={handleOutletSelected}
          onLogout={handleLogout}
        />
      );
    case 'pin_entry':
      return (
        <PinEntryScreen
          onPinSuccess={handlePinSuccess}
          onBack={() => navigateTo('outlet_picker')}
        />
      );
    case 'pos':
      return (
        <POSScreen
          onViewCart={() => navigateTo('cart')}
          onSwitchOutlet={() => {
            clearEmployee();
            setCurrentOutlet(null);
            navigateTo('outlet_picker');
          }}
          onLogout={handleLogout}
        />
      );
    case 'cart':
      return (
        <CartScreen
          onBack={() => navigateTo('pos')}
          onCheckout={() => navigateTo('checkout')}
        />
      );
    case 'checkout':
      return (
        <CheckoutScreen
          onBack={() => navigateTo('cart')}
          onComplete={() => navigateTo('pos')}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          onBack={() => navigateTo('login')}
          onRegisterSuccess={() => navigateTo('outlet_picker')}
        />
      );
    default:
      return (
        <LoginScreen
          onLoginSuccess={() => navigateTo('outlet_picker')}
          onGoToRegister={() => navigateTo('register')}
        />
      );
  }
}
