import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useColors } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

type PieEntry = {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

type Props = { data: PieEntry[] };

export default function CategoryPieChart({ data }: Props) {
  const C = useColors();
  if (data.length === 0) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No expenses this month yet.</Text>
      </View>
    );
  }
  return (
    <PieChart
      data={data}
      width={width - 40}
      height={200}
      accessor="value"
      backgroundColor="transparent"
      paddingLeft="15"
      chartConfig={{ color: () => C.ink, labelColor: () => C.ink }}
      hasLegend
    />
  );
}
