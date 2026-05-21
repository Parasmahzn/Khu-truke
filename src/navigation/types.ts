import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Expense } from '../store';

export type RootStackParamList = {
  Onboarding: undefined;
  Setup: undefined;
  Main: undefined;
  AddEdit: { expense?: Expense } | undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Reports: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
