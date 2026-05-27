import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../theme';
import { useColors } from '../context/ThemeContext';

type TabEntry = { name: string; route?: string; icon?: string; iconOutline?: string };

type TabBarProps = {
  state: { routes: Array<{ name: string; key: string }>; index: number };
  navigation: { navigate: (name: string) => void };
};

const tabs: TabEntry[] = [
  { name: 'Home',    route: 'index',     icon: 'home',         iconOutline: 'home-outline' },
  { name: 'Reports', route: 'reports',   icon: 'bar-chart',    iconOutline: 'bar-chart-outline' },
  { name: '__fab__' },
  { name: 'Stats',   route: 'analytics', icon: 'pie-chart',    iconOutline: 'pie-chart-outline' },
  { name: 'Me',      route: 'profile',   icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

export default function CustomTabBar({ state, navigation }: TabBarProps) {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabStyles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { position: 'absolute', bottom: (Platform.OS === 'ios' ? 28 : 18) + insets.bottom, left: 12, right: 12 },
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
    [C, insets.bottom],
  );

  const activeRouteName = state.routes[state.index].name;

  return (
    <View style={tabStyles.wrap}>
      <View style={tabStyles.bar}>
        {tabs.map((t) => {
          if (t.name === '__fab__') {
            return (
              <Pressable key="fab" onPress={() => router.push('/add-edit')} style={tabStyles.fab}>
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
