import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BLUE = '#0057FF';
const INK = '#111827';
const GRAY = '#6B7280';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTH_NAMES = MONTH_NAMES.map(name => name.slice(0, 3));

// How many months ahead of "now" the calendar pager can swipe through.
const FUTURE_MONTHS_COUNT = 24;

const CARD_PADDING = 12;
// Best guess for the very first frame, before onLayout measures the card's
// real width — matches this component's typical home (a 20px-padded screen
// content column). Corrected immediately once layout lands, so this only
// ever matters for one frame.
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH - 40 - CARD_PADDING * 2;

// ---------------------------------------------------------------------------
// Date helpers — dates are passed around as zero-padded 'YYYY-MM-DD' strings
// ("date keys") so they sort and compare correctly with plain `<`/`>`, even
// across month/year boundaries. Exported so screens can compute nights,
// format labels, and seed a starting selection without duplicating this
// logic.
// ---------------------------------------------------------------------------

const pad2 = n => String(n).padStart(2, '0');

export const toDateKey = (year, month, day) => `${year}-${pad2(month + 1)}-${pad2(day)}`;

export const parseDateKey = dateKey => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return {year, month: month - 1, day};
};

export const dateKeyToUTC = dateKey => {
  const {year, month, day} = parseDateKey(dateKey);
  return Date.UTC(year, month, day);
};

export const formatDateLabel = dateKey => {
  const {month, day} = parseDateKey(dateKey);
  return `${SHORT_MONTH_NAMES[month]} ${day}`;
};

export const getTodayKey = () => {
  const today = new Date();
  return toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
};

const addDays = (dateKey, days) => {
  const next = new Date(dateKeyToUTC(dateKey) + days * 86400000);
  return toDateKey(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate());
};

const buildMonthsWindow = (startYear, startMonth, count) => {
  const months = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(startYear, startMonth + i, 1);
    months.push({year: date.getFullYear(), month: date.getMonth()});
  }
  return months;
};

// There's no real booking backend yet, so every date from today onward is
// selectable — only the past is blocked out.
const buildMonthCells = (year, month, todayKey) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({key: `blank-${year}-${month}-${i}`, day: null});
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(year, month, day);
    cells.push({key: dateKey, day, dateKey, disabled: dateKey < todayKey, isToday: dateKey === todayKey});
  }
  return cells;
};

// A real-time, swipeable multi-month date-range picker — tap one date for a
// single night, tap a second for a range. Anchored to the device's actual
// clock (not a fixed demo date) and reusable across any booking flow
// (homestays, hotel rooms, …): callers own `selectedRange` and get it back
// via `onChangeRange`, so fare/nights math stays with the screen that knows
// the price.
const BookingCalendar = ({selectedRange, onChangeRange}) => {
  const [monthIndex, setMonthIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(DEFAULT_CARD_WIDTH);
  const monthListRef = useRef(null);

  const todayKey = useMemo(() => getTodayKey(), []);
  const monthsWindow = useMemo(() => {
    const {year, month} = parseDateKey(todayKey);
    return buildMonthsWindow(year, month, FUTURE_MONTHS_COUNT);
  }, [todayKey]);

  const pageWidth = cardWidth;
  const cellSize = pageWidth / 7;
  const pageHeight = cellSize * 6; // up to 6 rows in a month

  const currentMonth = monthsWindow[monthIndex];
  const monthLabel = `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`;

  const handleDayPress = useCallback(
    (dateKey, disabled) => {
      if (disabled) return;
      const {start, end} = selectedRange;
      // No open selection, or the previous one is already a complete
      // range — start a fresh single-day pick.
      if (start == null || end != null) {
        onChangeRange({start: dateKey, end: null});
        return;
      }
      if (dateKey === start) return;
      const rangeStart = dateKey < start ? dateKey : start;
      const rangeEnd = dateKey < start ? start : dateKey;
      onChangeRange({start: rangeStart, end: rangeEnd});
    },
    [selectedRange, onChangeRange],
  );

  const handleMonthScrollEnd = useCallback(
    event => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setMonthIndex(index);
    },
    [pageWidth],
  );

  const goToMonth = useCallback(
    direction => {
      const nextIndex = Math.min(Math.max(monthIndex + direction, 0), monthsWindow.length - 1);
      monthListRef.current?.scrollToOffset({offset: nextIndex * pageWidth, animated: true});
      setMonthIndex(nextIndex);
    },
    [monthIndex, monthsWindow.length, pageWidth],
  );

  const monthKeyExtractor = useCallback(item => `${item.year}-${item.month}`, []);

  const getMonthItemLayout = useCallback(
    (_, index) => ({length: pageWidth, offset: pageWidth * index, index}),
    [pageWidth],
  );

  const renderMonthPage = useCallback(
    ({item}) => {
      const cells = buildMonthCells(item.year, item.month, todayKey);
      return (
        <View style={[styles.monthPage, {width: pageWidth, height: pageHeight}]}>
          {cells.map(cell => {
            if (cell.day === null) {
              return <View key={cell.key} style={styles.calendarCell} />;
            }
            const isStart = cell.dateKey === selectedRange.start;
            const isEnd = cell.dateKey === selectedRange.end;
            const hasRange =
              selectedRange.end != null && selectedRange.start !== selectedRange.end;
            const isInRange =
              hasRange && cell.dateKey > selectedRange.start && cell.dateKey < selectedRange.end;
            const isEdge = isStart || isEnd;

            return (
              <View key={cell.key} style={styles.calendarCell}>
                {hasRange && (isInRange || isEdge) && (
                  <View
                    style={[
                      styles.rangeTrack,
                      isStart && styles.rangeTrackStart,
                      isEnd && styles.rangeTrackEnd,
                      isInRange && styles.rangeTrackMiddle,
                    ]}
                  />
                )}
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    cell.isToday && !isEdge && styles.dayButtonToday,
                    isEdge && styles.dayButtonSelected,
                  ]}
                  activeOpacity={0.7}
                  disabled={cell.disabled}
                  onPress={() => handleDayPress(cell.dateKey, cell.disabled)}>
                  <Text
                    style={[
                      styles.dayButtonText,
                      cell.disabled && styles.dayButtonTextDisabled,
                      isEdge && styles.dayButtonTextSelected,
                    ]}>
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    },
    [todayKey, selectedRange, handleDayPress, pageWidth, pageHeight],
  );

  const nights = selectedRange.end
    ? Math.round((dateKeyToUTC(selectedRange.end) - dateKeyToUTC(selectedRange.start)) / 86400000)
    : 1;
  // Without a second tap yet, a single selected day still books one night —
  // show the implied checkout (the next day) rather than a bare placeholder,
  // so the pill always reads as a real date.
  const checkoutKey = selectedRange.end ?? addDays(selectedRange.start, 1);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Check Availability</Text>
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.monthNavButton}
            activeOpacity={0.7}
            disabled={monthIndex === 0}
            onPress={() => goToMonth(-1)}>
            <Icon name="chevron-back" size={16} color={monthIndex === 0 ? '#CBD5E1' : BLUE} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            style={styles.monthNavButton}
            activeOpacity={0.7}
            disabled={monthIndex === monthsWindow.length - 1}
            onPress={() => goToMonth(1)}>
            <Icon
              name="chevron-forward"
              size={16}
              color={monthIndex === monthsWindow.length - 1 ? '#CBD5E1' : BLUE}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.helperText}>
        Swipe the calendar for other months. Tap a date for one night, or a second date for a range.
      </Text>

      <View
        style={styles.card}
        onLayout={event => setCardWidth(event.nativeEvent.layout.width - CARD_PADDING * 2)}>
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Text key={`weekday-${index}`} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>

        <FlatList
          ref={monthListRef}
          data={monthsWindow}
          keyExtractor={monthKeyExtractor}
          renderItem={renderMonthPage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMonthScrollEnd}
          getItemLayout={getMonthItemLayout}
          style={{width: pageWidth}}
          // Each page is a ~40-cell grid of TouchableOpacitys — RN's
          // FlatList defaults (initialNumToRender: 10, windowSize: 21)
          // would eagerly build ~10 of these 24 months on first mount,
          // which is what made opening this screen from Home feel slow.
          // Only the current month needs to exist before the first paint;
          // neighbors render lazily as the rider actually swipes to them.
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />
      </View>

      {/* Check-in / check-out summary, styled like Airbnb/Booking.com —
          clearer at a glance than a single "Aug 1 – Aug 5" line. */}
      <View style={styles.summaryRow}>
        <View style={styles.datePill}>
          <Text style={styles.datePillLabel}>CHECK-IN</Text>
          <Text style={styles.datePillValue}>{formatDateLabel(selectedRange.start)}</Text>
        </View>

        <View style={styles.summaryDivider}>
          <Icon name="arrow-forward" size={14} color={GRAY} />
          <Text style={styles.nightsText}>
            {nights} {nights === 1 ? 'night' : 'nights'}
          </Text>
        </View>

        <View style={styles.datePill}>
          <Text style={styles.datePillLabel}>CHECK-OUT</Text>
          <Text style={styles.datePillValue}>{formatDateLabel(checkoutKey)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
    minWidth: 84,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 11,
    color: GRAY,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: CARD_PADDING,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: GRAY,
    marginBottom: 6,
  },
  monthPage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeTrack: {
    position: 'absolute',
    top: '10',
    bottom: '0',
    backgroundColor: '#bfcfee',
    
  },
  rangeTrackStart: {
    left: '50%',
    right: 0,
  },
  rangeTrackEnd: {
    left: 0,
    right: '50%',
  },
  rangeTrackMiddle: {
    left: 0,
    right: 0,
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: BLUE,
  },
  dayButtonSelected: {
    backgroundColor: BLUE,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
  },
  dayButtonTextDisabled: {
    color: '#CBD5E1',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  datePill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: GRAY,
    letterSpacing: 0.5,
  },
  datePillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
    marginTop: 2,
  },
  summaryDivider: {
    alignItems: 'center',
    gap: 2,
  },
  nightsText: {
    fontSize: 10,
    fontWeight: '600',
    color: BLUE,
  },
});

export default BookingCalendar;
