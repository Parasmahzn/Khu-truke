import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { COLORS, FONTS } from './src/theme';
import { ExpenseContext } from './src/store';
import { ThemeProvider, useColors } from './src/ThemeContext';
import { useUserProfile } from './src/hooks/useUserProfile';
import { useExpenses } from './src/hooks/useExpenses';
import { useCustomCategories } from './src/hooks/useCustomCategories';

import OnboardingScreen from './src/screens/OnboardingScreen';
import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AddEditScreen from './src/screens/AddEditScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import type { RootStackParamList, MainTabParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

type TabEntry = { name: string; route?: keyof MainTabParamList; icon?: string; iconOutline?: string };

const tabs: TabEntry[] = [
  { name: 'Home',    route: 'Home',      icon: 'home',       iconOutline: 'home-outline' },
  { name: 'Reports', route: 'Reports',   icon: 'bar-chart',  iconOutline: 'bar-chart-outline' },
  { name: '__fab__' },
  { name: 'Stats',   route: 'Analytics', icon: 'pie-chart',  iconOutline: 'pie-chart-outline' },
  { name: 'Me',      route: 'Profile',   icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const C = useColors();
  const tabStyles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { position: 'absolute', bottom: Platform.OS === 'ios' ? 28 : 18, left: 12, right: 12 },
        bar: {
          height: 62, backgroundColor: C.white,
          borderWidth: 1.5, borderColor: C.ink, borderRadius: 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
          shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
          elevation: 4,
        },
        tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        tabLabel: { fontSize: 10, fontFamily: FONTS.ui, marginTop: 2 },
        fab: {
          width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple,
          borderWidth: 1.5, borderColor: C.ink, marginTop: -24,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
          elevation: 8,
        },
      }),
    [C],
  );

  const activeRouteName = state.routes[state.index].name;

  return (
    <View style={tabStyles.wrap}>
      <View style={tabStyles.bar}>
        {tabs.map((t) => {
          if (t.name === '__fab__') {
            return (
              <Pressable key="fab" onPress={() => navigation.navigate('AddEdit' as any)} style={tabStyles.fab}>
                <Ionicons name="add" size={32} color={C.onPurple} />
              </Pressable>
            );
          }
          const isActive = activeRouteName === t.route;
          const tint = isActive ? C.purple : C.mute;
          return (
            <Pressable
              key={t.route}
              onPress={() => navigation.navigate(t.route as string)}
              style={tabStyles.tab}
            >
              <Ionicons name={(isActive ? t.icon : t.iconOutline) as any} size={22} color={tint} />
              <Text style={[tabStyles.tabLabel, { color: tint, fontWeight: isActive ? '700' : '400' }]}>
                {t.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 36, color: COLORS.onPurple, fontFamily: FONTS.hand, fontWeight: '700' }}>
        Khu₹truke
      </Text>
    </View>
  );
}

function AppContent() {
  const {
    ready: profileReady,
    userName, profileImage, currency, budget, onboarded, setupDone, isUserConfigured,
    saveProfileImage, saveCurrency, saveBudget, clearBudgetForCurrency, markOnboarded, completeSetup,
  } = useUserProfile();

  const {
    expenses, ready: expensesReady,
    addExpense, updateExpense, deleteExpense, clearExpensesForCurrency, countExpensesForCurrency,
  } = useExpenses(profileReady ? currency.code : null);

  const { customCategories, ready: categoriesReady, addCustomCategory, removeCustomCategory } = useCustomCategories();

  const ready = profileReady && expensesReady && categoriesReady;

  const contextValue = useMemo(
    () => ({
      expenses, addExpense, updateExpense, deleteExpense,
      clearExpensesForCurrency, countExpensesForCurrency,
      userName, profileImage, saveProfileImage,
      currency, saveCurrency,
      budget, saveBudget, clearBudgetForCurrency,
      customCategories, addCustomCategory, removeCustomCategory,
    }),
    [
      expenses, addExpense, updateExpense, deleteExpense,
      clearExpensesForCurrency, countExpensesForCurrency,
      userName, profileImage, saveProfileImage,
      currency, saveCurrency,
      budget, saveBudget, clearBudgetForCurrency,
      customCategories, addCustomCategory, removeCustomCategory,
    ],
  );

  if (!ready) return <SplashScreen />;

  const initialRoute: keyof RootStackParamList = isUserConfigured
    ? 'Main'
    : onboarded
      ? 'Setup'
      : 'Onboarding';

  return (
    <SafeAreaProvider>
      <ExpenseContext.Provider value={contextValue}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            initialRouteName={initialRoute}
          >
            <Stack.Screen name="Onboarding">
              {({ navigation }) => (
                <OnboardingScreen
                  onDone={async () => {
                    await markOnboarded();
                    navigation.replace(setupDone ? 'Main' : 'Setup');
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Setup">
              {({ navigation }) => (
                <SetupScreen
                  onDone={async (name, currencyCode) => {
                    await completeSetup(name, currencyCode);
                    navigation.replace('Main');
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Main" component={MainTabs} />

            <Stack.Screen
              name="AddEdit"
              component={AddEditScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />

            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </ExpenseContext.Provider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
