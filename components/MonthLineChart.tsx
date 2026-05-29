import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useColors } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const Y_AXIS_WIDTH = 36;
const chartWidth = screenWidth - 43 - Y_AXIS_WIDTH;

type Props = {
  data: { label: string; total: number }[];
  currencySymbol: string;
};

export default function MonthLineChart({ data, currencySymbol }: Props) {
  const C = useColors();

  if (!data.some((m) => m.total > 0)) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No spend in the last 6 months.</Text>
      </View>
    );
  }

  const spacing = Math.floor((chartWidth - 32) / (data.length - 1));

  const chartData = data.map((m) => ({
    value: m.total,
    label: m.label,
  }));

  return (
    <LineChart
      data={chartData}
      isAnimated
      animationDuration={700}
      color={C.purple}
      thickness={2}
      dataPointsColor={C.purple}
      dataPointsRadius={4}
      yAxisColor={C.line}
      xAxisColor={C.line}
      yAxisTextStyle={{ color: C.mute, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: C.mute, fontSize: 10 }}
      backgroundColor={C.paper}
      noOfSections={4}
      yAxisLabelWidth={Y_AXIS_WIDTH}
      formatYLabel={(v: string) =>
        Number(v) >= 1000
          ? `${Math.round(Number(v) / 1000)}K`
          : `${Math.round(Number(v))}`
      }
      width={chartWidth}
      height={180}
      initialSpacing={12}
      endSpacing={20}
      spacing={spacing}
      rulesColor={C.line}
      rulesType="solid"
      pointerConfig={{
        pointerStripHeight: 160,
        pointerStripColor: C.purple + '33',
        pointerStripWidth: 1.5,
        pointerColor: C.purpleDark,
        radius: 6,
        pointerLabelWidth: 110,
        pointerLabelHeight: 58,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: { value: number; label: string }[]) => {
          const item = items[0];
          if (!item) return null;
          return (
            <View
              style={{
                backgroundColor: C.purple,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                alignItems: 'center',
                width: 110,
                elevation: 4,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                {currencySymbol}{Math.round(item.value).toLocaleString()}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, marginTop: 1 }}>
                {item.label?.toUpperCase()}
              </Text>
            </View>
          );
        },
      }}
    />
  );
}
