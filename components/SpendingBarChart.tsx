import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useColors } from '../context/ThemeContext';

const chartWidth = Dimensions.get('window').width - 64;

type Props = { data: { label: string; total: number }[] };

export default function SpendingBarChart({ data }: Props) {
  const C = useColors();
  const chartConfig = useMemo(() => ({
    backgroundColor: C.white,
    backgroundGradientFrom: C.white,
    backgroundGradientTo: C.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124,58,237,${opacity})`,
    labelColor: () => C.ink,
    propsForBackgroundLines: { strokeDasharray: '', stroke: C.line, strokeOpacity: 0.5 },
    propsForLabels: { fontSize: 9 },
  }), [C]);

  if (!data.some((d) => d.total > 0)) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No spend in the last 7 days.</Text>
      </View>
    );
  }
  return (
    <BarChart
      data={{
        labels: data.map((d) => d.label),
        datasets: [{ data: data.map((d) => d.total || 0.01) }],
      }}
      width={chartWidth}
      height={180}
      yAxisLabel=""
      yAxisSuffix=""
      chartConfig={chartConfig}
      showValuesOnTopOfBars
      fromZero
      withInnerLines={false}
    />
  );
}
