import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useColors } from '../context/ThemeContext';

const chartWidth = Dimensions.get('window').width - 64;

type Props = {
  data: { label: string; total: number }[];
  currencySymbol: string;
};

export default function MonthLineChart({ data, currencySymbol }: Props) {
  const C = useColors();
  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number } | null>(null);

  const chartConfig = useMemo(() => ({
    backgroundColor: C.white,
    backgroundGradientFrom: C.white,
    backgroundGradientTo: C.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124,58,237,${opacity})`,
    labelColor: () => C.ink,
    propsForDots: { r: '4', strokeWidth: '2', stroke: C.purple },
    propsForBackgroundLines: { strokeDasharray: '', stroke: C.line, strokeOpacity: 0.5 },
    propsForLabels: { fontSize: 9 },
  }), [C]);

  const formatYLabel = (v: string) => {
    const n = +v;
    return n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`;
  };

  if (!data.some((m) => m.total > 0)) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No spend in the last 6 months.</Text>
      </View>
    );
  }
  return (
    <>
      <LineChart
        data={{
          labels: data.map((m) => m.label),
          datasets: [{ data: data.map((m) => m.total || 0.01) }],
        }}
        width={chartWidth}
        height={180}
        yAxisLabel=""
        yAxisSuffix=""
        formatYLabel={formatYLabel}
        chartConfig={chartConfig}
        bezier
        onDataPointClick={({ index, value }) => setSelectedPoint({ index, value })}
        withShadow={false}
        getDotColor={(_dataPoint: number, index: number) =>
          selectedPoint?.index === index ? C.purple : C.purpleSoft
        }
      />
      {selectedPoint && (
        <Text style={{ fontSize: 12, color: C.purpleDark, fontWeight: '700', marginTop: 6 }}>
          {data[selectedPoint.index]?.label}: {currencySymbol}{Math.round(selectedPoint.value).toLocaleString()}
        </Text>
      )}
    </>
  );
}
