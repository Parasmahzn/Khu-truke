import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Path, Text as SvgText, G } from 'react-native-svg';
import { useColors } from '../context/ThemeContext';

const DAY_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6', '#9333ea', '#d8b4fe'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, endDeg);
  const i1 = polarToCartesian(cx, cy, innerR, startDeg);
  const i2 = polarToCartesian(cx, cy, innerR, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${innerR} ${innerR} 0 ${large} 0 ${i1.x} ${i1.y} Z`;
}

type Props = { dayTotals: { day: number; total: number }[] };

export default function DayDonutChart({ dayTotals }: Props) {
  const C = useColors();
  if (dayTotals.length === 0) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No expenses this month yet.</Text>
      </View>
    );
  }
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 50;
  const total = dayTotals.reduce((s, d) => s + d.total, 0);
  let angle = 0;
  return (
    <Svg width={size} height={size}>
      <G>
        {dayTotals.map((d, i) => {
          const sweep = (d.total / total) * 360;
          const path = arcPath(cx, cy, outerR, innerR, angle, angle + sweep - 0.5);
          angle += sweep;
          return <Path key={i} d={path} fill={DAY_COLORS[i % DAY_COLORS.length]} />;
        })}
        <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="800" fill={C.ink}>
          {Math.round(total).toLocaleString('en-US')}
        </SvgText>
        <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill={C.mute}>
          TOTAL
        </SvgText>
      </G>
    </Svg>
  );
}
