import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Svg, Path, Text as SvgText, G } from 'react-native-svg';
import { useColors } from '../context/ThemeContext';
import { DONUT_SEGMENT_COLORS } from '../constants';

const AnimatedPath = Animated.createAnimatedComponent(Path);

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

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

type Entry = { name: string; value: number; color: string };
type Props = { data: Entry[]; active?: boolean };

const MAX_SEGMENTS = 5;

export default function CategoryDonutChart({ data, active = false }: Props) {
  const C = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const segmentOpacityAnims = useRef(
    Array.from({ length: MAX_SEGMENTS }, () => new Animated.Value(1)),
  ).current;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (active) {
      anim.setValue(0);
      setSelectedIndex(null);
      segmentOpacityAnims.forEach((a) => a.setValue(1));
      Animated.spring(anim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    }
  }, [active]);

  const handleSelect = (i: number, count: number) => {
    const next = selectedIndex === i ? null : i;
    setSelectedIndex(next);
    for (let idx = 0; idx < count; idx++) {
      Animated.spring(segmentOpacityAnims[idx], {
        toValue: next === null || next === idx ? 1 : 0.4,
        tension: 180, friction: 10, useNativeDriver: false,
      }).start();
    }
  };

  if (data.length === 0) {
    return (
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.mute }}>No expenses this month yet.</Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top4 = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const otherTotal = rest.reduce((s, d) => s + d.value, 0);

  const segments = [
    ...top4.map((d, i) => ({ name: d.name, value: d.value, color: DONUT_SEGMENT_COLORS[i] })),
    ...(otherTotal > 0 ? [{ name: 'Others', value: otherTotal, color: DONUT_SEGMENT_COLORS[4] }] : []),
  ];

  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 68;
  const innerR = 42;
  let angle = 0;

  const scaleInterp = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ scale: scaleInterp }],
      flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
      paddingHorizontal: 16, paddingVertical: 8,
    }}>
      <Svg width={size} height={size}>
        <G>
          {segments.map((d, i) => {
            const isSelected = selectedIndex === i;
            const sweep = (d.value / total) * 360;
            const thisOuterR = isSelected ? outerR + 7 : outerR;
            const path = arcPath(cx, cy, thisOuterR, innerR, angle, angle + sweep - 0.5);
            angle += sweep;
            return (
              <AnimatedPath
                key={i}
                d={path}
                fill={d.color}
                opacity={segmentOpacityAnims[i]}
                onPress={() => handleSelect(i, segments.length)}
              />
            );
          })}
          {selectedIndex !== null ? (
            <>
              <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.ink}>
                {Math.round(segments[selectedIndex].value).toLocaleString('en-US')}
              </SvgText>
              <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill={C.mute}>
                {trunc(segments[selectedIndex].name.toUpperCase(), 9)}
              </SvgText>
            </>
          ) : (
            <>
              <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize="16" fontWeight="800" fill={C.ink}>
                {Math.round(total).toLocaleString('en-US')}
              </SvgText>
              <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill={C.mute}>
                TOTAL
              </SvgText>
            </>
          )}
        </G>
      </Svg>
      <View style={{ flex: 1, paddingLeft: 12 }}>
        {segments.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          const isSelected = selectedIndex === i;
          return (
            <View
              key={d.name}
              style={{
                flexDirection: 'row', alignItems: 'center', marginBottom: 9,
                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                backgroundColor: isSelected ? C.purpleSoft : 'transparent',
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color, marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 11, color: C.ink, fontWeight: isSelected ? '800' : '600' }} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? C.purpleDark : C.mute, minWidth: 34, textAlign: 'right' }}>
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
