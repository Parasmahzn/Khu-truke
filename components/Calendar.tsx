import React from 'react';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { useColors } from '../context/ThemeContext';

interface CalendarProps {
  markedDates?: Record<string, any>;
  onDayPress: (day: DateData) => void;
  onMonthChange?: (month: DateData) => void;
  current?: string;
  maxDate?: string;
  minDate?: string;
  markingType?: 'dot' | 'multi-dot' | 'period' | 'multi-period' | 'custom';
  enableSwipeMonths?: boolean;
  hideExtraDays?: boolean;
  style?: object;
}

export default function Calendar({ style, ...rest }: CalendarProps) {
  const C = useColors();

  const calendarTheme = {
    backgroundColor: C.paper,
    calendarBackground: C.paper,
    textSectionTitleColor: C.mute,
    selectedDayBackgroundColor: C.purple,
    selectedDayTextColor: C.onPurple,
    todayTextColor: C.purpleDark,
    todayBackgroundColor: C.purpleSoft,
    dayTextColor: C.ink,
    textDisabledColor: C.line,
    dotColor: C.purple,
    selectedDotColor: C.onPurple,
    arrowColor: C.purple,
    monthTextColor: C.ink,
    textDayFontWeight: '500' as const,
    textMonthFontWeight: '800' as const,
    textDayHeaderFontWeight: '700' as const,
    textDayFontSize: 13,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 10,
  };

  return (
    <RNCalendar
      key={C.paper}
      theme={calendarTheme}
      style={style}
      {...rest}
    />
  );
}
