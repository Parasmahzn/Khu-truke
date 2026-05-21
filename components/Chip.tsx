import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { useColors } from '../context/ThemeContext';

type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
};

export default function Chip({ children, active = false, onPress, style }: ChipProps) {
  const C = useColors();
  const Inner = onPress ? Pressable : View;
  return (
    <Inner
      onPress={onPress}
      style={[
        chipStyle,
        {
          borderColor: active ? C.purple : C.ink,
          backgroundColor: active ? C.purpleSoft : 'transparent',
        },
        style,
      ]}
    >
      <Text style={{ color: active ? C.purpleDark : C.ink, fontWeight: active ? '700' : '400', fontSize: 12 }}>
        {children}
      </Text>
    </Inner>
  );
}

const chipStyle: ViewStyle = {
  paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  borderWidth: 1.5, marginRight: 6, marginBottom: 6,
  alignSelf: 'flex-start',
};
