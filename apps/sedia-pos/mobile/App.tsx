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

import OutletPickerScreen from './src/screens/OutletPickerScreen';
import PinEntryScreen from './src/screens/PinEntryScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/Toast';
import Drawer from './src/components/Drawer';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import ProductManagementScreen from './src/screens/ProductManagementScreen';
import ShiftReportScreen from './src/screens/ShiftReportScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CustomerManagementScreen from './src/screens/CustomerManagementScreen';
import EmployeeManagementScreen from './src/screens/EmployeeManagementScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import StockOpnameScreen from './src/screens/StockOpnameScreen';
import OutletManagementScreen from './src/screens/OutletManagementScreen';
import CategoryManagementScreen from './src/screens/CategoryManagementScreen';
import StockOpnameListScreen from './src/screens/StockOpnameListScreen';


import StockOpnameDetailScreen from './src/screens/StockOpnameDetailScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import TaxManagementScreen from './src/screens/TaxManagementScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StockOpnameCreateScreen from './src/screens/StockOpnameCreateScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import SupplierFormScreen from './src/screens/SupplierFormScreen';
import PurchaseOrdersScreen from './src/screens/PurchaseOrdersScreen';
import PurchaseOrderFormScreen from './src/screens/PurchaseOrderFormScreen';
import PurchaseOrderDetailScreen from './src/screens/PurchaseOrderDetailScreen';

type Screen = 'login' | 'outlet_picker' | 'pin_entry' | 'dashboard' | 'pos' | 'cart' | 'checkout' | 'transactions' | 'products' | 'shifts' | 'customers' | 'employees' | 'inventory' | 'stock_opname' | 'stock_opname_create' | 'stock_opname_detail' | 'outlets' | 'activity' | 'categories' | 'reports' | 'tax' | 'settings' | 'suppliers' | 'supplier_form' | 'purchase_orders' | 'purchase_order_form' | 'purchase_order_detail';

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

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { isOnline, syncStatus, syncAll, lastSyncedAt } = useSync();
  const { login, isLoading, error } = useAuthStore();
  const { currentOutlet } = useOutletStore();
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
          <View
            className="mb-6 flex h-28 w-28 items-center justify-center rounded-[32px] shadow-2xl"
            style={{
              backgroundColor: currentOutlet?.primaryColor || '#0f766e', // teal-700 fallback
              shadowColor: currentOutlet?.primaryColor || '#0f766e',
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }}
          >
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
              className={`flex-row w-full items-center justify-center gap-2 rounded-2xl py-4 shadow-lg active:opacity-90`}
              style={{
                backgroundColor: currentOutlet?.primaryColor || '#f2b30c', // Default secondary gold
                shadowColor: currentOutlet?.primaryColor || '#f2b30c',
                shadowOpacity: 0.2,
                shadowRadius: 5
              }}
            >
              {isLoading ? <ActivityIndicator color="#18181b" /> : <MaterialCommunityIcons name="login" size={20} color="white" />}
              <Text className="text-base font-bold text-white">
                {isLoading ? 'Masuk...' : 'Masuk ke POS'}
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

// Toast and SafeArea providers are now imported at the top

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

  // Initialize sync engine globally
  useSync();

  const [currentParams, setCurrentParams] = React.useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = React.useState(false);

  React.useEffect(() => {
    // Check for persisted session on mount
    checkSession();
  }, []);

  React.useEffect(() => {
    // Redirect logic based on auth state
    if (user && currentScreen === 'login') {
      // If logged in, go to outlet picker (or PIN if outlet selected, or Dashboard if employee logged in)
      if (currentOutlet && currentEmployee) {
        setCurrentScreen('dashboard');
      } else if (currentOutlet) {
        setCurrentScreen('dashboard');
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
    setCurrentScreen('dashboard');
  };

  const handlePinSuccess = () => {
    setCurrentScreen('dashboard');
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

  const renderScreen = () => {
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
      case 'dashboard':
        return (

          <DashboardScreen
            onNavigate={navigateTo}
            onOpenDrawer={() => {
              console.log('[App] Opening drawer from Dashboard');
              setIsDrawerVisible(true);
            }}
          />
        );
      case 'customers':
        return (
          <CustomerManagementScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'employees':
        return (
          <EmployeeManagementScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'outlets':
        return (
          <OutletManagementScreen
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'pos':
        return (
          <POSScreen
            onViewCart={() => navigateTo('cart')}
            onOpenDrawer={() => {
              console.log('[App] Opening drawer from POS');
              setIsDrawerVisible(true);
            }}
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
            onComplete={() => navigateTo('pos')} // Complete goes to POS for next order
          />
        );
      case 'transactions':
        return (
          <TransactionHistoryScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'products':
        return (
          <ProductManagementScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );


      case 'shifts':
        return (
          <ShiftReportScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'activity':
        // Fallback or placeholder for screens not yet fully implemented as standalone
        return (
          <DashboardScreen
            onNavigate={navigateTo}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'categories':
        return (
          <CategoryManagementScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'stock_opname': // List (Map 'stock_opname' from Drawer ID)
        return (
          <StockOpnameListScreen
            onNavigate={(screen, params) => {
              if (params) setCurrentParams(params);
              navigateTo(screen as Screen);
            }}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'stock_opname_create':
        return (
          <StockOpnameCreateScreen
            onNavigate={(screen, params) => {
              if (params) setCurrentParams(params);
              navigateTo(screen as Screen);
            }}
            onBack={() => navigateTo('stock_opname')}
          />
        );
      case 'stock_opname_detail':
        return (
          <StockOpnameDetailScreen
            opnameId={currentParams?.opnameId}
            onBack={() => navigateTo('stock_opname')}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'tax':
        return (
          <TaxManagementScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );

        return (
          <SettingsScreen
            onBack={() => navigateTo('dashboard')}
            onOpenDrawer={() => setIsDrawerVisible(true)}
          />
        );
      case 'suppliers':
        return (
          <SuppliersScreen
            onNavigate={(screen, params) => {
              if (params) setCurrentParams(params);
              navigateTo(screen as Screen);
            }}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'supplier_form':
        return (
          <SupplierFormScreen
            supplier={currentParams?.supplier}
            onBack={() => navigateTo('suppliers')}
          />
        );
      case 'purchase_orders':
        return (
          <PurchaseOrdersScreen
            onNavigate={(screen, params) => {
              if (params) setCurrentParams(params);
              navigateTo(screen as Screen);
            }}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'purchase_order_form':
        return (
          <PurchaseOrderFormScreen
            onBack={() => navigateTo('purchase_orders')}
          />
        );
      case 'purchase_order_detail':
        return (
          <PurchaseOrderDetailScreen
            poId={currentParams?.poId}
            onBack={() => navigateTo('purchase_orders')}
          />
        );

      default:
        // Only show Login if not logged in
        if (user) {
          return (
            <DashboardScreen
              onNavigate={navigateTo}
              onOpenDrawer={() => setIsDrawerVisible(true)}
            />
          );
        }
        return (
          <LoginScreen
            onLoginSuccess={() => navigateTo('outlet_picker')}
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-zinc-50">
      <StatusBar style="dark" />
      {renderScreen()}
      <Drawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
    </View>
  );
}
