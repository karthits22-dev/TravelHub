import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import TaxiIcon from 'react-native-vector-icons/MaterialIcons';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';
const AMBER = '#D97706';
const RED = '#C0392B';

const TABS = [
  {key: 'upcoming', label: 'Upcoming'},
  {key: 'completed', label: 'Completed'},
  {key: 'cancelled', label: 'Cancelled'},
];

const TYPE_STYLE = {
  hotel: {icon: 'business', tint: TINT_PEACH, color: ICON_PEACH, lib: 'ion'},
  taxi: {icon: 'local-taxi', tint: TINT_MINT, color: ICON_MINT, lib: 'material'},
  homestay: {icon: 'home', tint: TINT_MINT, color: ICON_MINT, lib: 'ion'},
};

const BOOKINGS = [
  {
    id: 'nilgiri-retreat',
    status: 'upcoming',
    type: 'hotel',
    name: 'The Nilgiri Retreat',
    dateLabel: 'Aug 10–12 · 2 nights',
    price: 6400,
    statusLabel: 'Confirmed',
    statusColor: ICON_MINT,
    statusBg: TINT_MINT,
  },
  {
    id: 'sedan-mg-road',
    status: 'upcoming',
    type: 'taxi',
    name: 'Sedan · MG Road → Airport',
    dateLabel: 'Aug 9 · 6:00 AM',
    price: 428,
    statusLabel: 'Confirmed',
    statusColor: ICON_MINT,
    statusBg: TINT_MINT,
  },
  ...Array.from({length: 11}, (_, index) => ({
    id: `mini-koramangala-${index + 1}`,
    status: 'completed',
    type: 'taxi',
    name: 'Mini · Koramangala → Whitefield',
    dateLabel: 'Jul 28 · 9:42 AM',
    price: 146,
    statusLabel: 'Completed',
    statusColor: ICON_MINT,
    statusBg: TINT_MINT,
  })),
  {
    id: 'coorg-cottage',
    status: 'completed',
    type: 'homestay',
    name: 'Coorg Cottage Escape',
    dateLabel: 'Jul 20–22 · 2 nights',
    price: 3600,
    statusLabel: 'Completed',
    statusColor: ICON_MINT,
    statusBg: TINT_MINT,
  },
  {
    id: 'misty-hills',
    status: 'cancelled',
    type: 'hotel',
    name: 'Misty Hills Resort',
    dateLabel: 'Jul 15 · Cancelled',
    price: 3200,
    statusLabel: 'Refunded',
    statusColor: RED,
    statusBg: TINT_PEACH,
  },
];

// Check-in only makes sense for a stay you haven't arrived at yet, and only
// for booking types that involve physically checking in at a property.
const CHECKIN_TYPES = new Set(['hotel', 'homestay']);

const ACTIONS_BY_STATUS = {
  upcoming: [
    {key: 'details', label: 'View Details', color: DEEP_GREEN},
    {key: 'invoice', label: 'Invoice', icon: 'document-text-outline', color: TEXT_MUTED},
  ],
  completed: [
    {key: 'details', label: 'View Details', color: DEEP_GREEN},
    {key: 'rate', label: 'Rate', icon: 'star-outline', color: AMBER},
    {key: 'download', label: 'Download', icon: 'download-outline', color: DEEP_GREEN},
  ],
  cancelled: [
    {key: 'details', label: 'View Details', color: DEEP_GREEN},
    {key: 'rebook', label: 'Rebook', icon: 'refresh-outline', color: DEEP_GREEN},
  ],
};

const EMPTY_COPY = {
  upcoming: "You don't have any upcoming bookings.",
  completed: "You don't have any completed bookings yet.",
  cancelled: "You don't have any cancelled bookings.",
};

const BookingScreen = ({navigation}) => {
  const getActions = item => {
    const actions = ACTIONS_BY_STATUS[item.status];
    if (item.status === 'upcoming' && CHECKIN_TYPES.has(item.type)) {
      return [
        {key: 'checkin', label: 'Check-in', icon: 'qr-code-outline', color: DEEP_GREEN},
        ...actions,
      ];
    }
    return actions;
  };

  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');

  const filteredBookings = useMemo(
    () => BOOKINGS.filter(b => b.status === activeTab),
    [activeTab],
  );

  // Bottom-tab screens stay mounted after their first visit, so a plain
  // <StatusBar> here would keep winning even after the user switches to
  // another tab. useFocusEffect applies this only while Booking is the
  // active tab and restores the app default when it isn't.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor(CREAM);
      return () => {};
    }, []),
  );

  const keyExtractor = useCallback(item => item.id, []);

  const renderTypeIcon = type => {
    const typeStyle = TYPE_STYLE[type];
    return (
      <View style={[styles.typeIconWrap, {backgroundColor: typeStyle.tint}]}>
        {typeStyle.lib === 'material' ? (
          <TaxiIcon name={typeStyle.icon} size={19} color={typeStyle.color} />
        ) : (
          <Icon name={typeStyle.icon} size={19} color={typeStyle.color} />
        )}
      </View>
    );
  };

  const renderBooking = useCallback(
    ({item}) => {
      const actions = getActions(item);
      return (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            {renderTypeIcon(item.type)}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardDate}>{item.dateLabel}</Text>
            </View>
            <View style={styles.cardPriceCol}>
              <Text style={styles.cardPrice}>
                ₹{item.price.toLocaleString('en-IN')}
              </Text>
              <View style={[styles.statusPill, {backgroundColor: item.statusBg}]}>
                <Text style={[styles.statusPillText, {color: item.statusColor}]}>
                  {item.statusLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.footerAction,
                  index > 0 && styles.footerActionDivider,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (action.key === 'checkin') {
                    navigation?.navigate?.('CheckInScan', {booking: item});
                  }
                }}>
                {action.icon ? (
                  <Icon name={action.icon} size={13} color={action.color} />
                ) : null}
                <Text style={[styles.footerActionText, {color: action.color}]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    },
    [navigation],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={17} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate?.('CheckInScan')}>
          <Icon name="qr-code-outline" size={18} color={DEEP_GREEN} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsTrack}>
        {TABS.map(tab => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={keyExtractor}
        renderItem={renderBooking}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{EMPTY_COPY[activeTab]}</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  // Tabs — segmented pill control
  tabsTrack: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 4,
    backgroundColor: TINT_MINT,
    borderRadius: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: WHITE,
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabLabelActive: {
    color: DEEP_GREEN,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  emptyText: {
    marginTop: 60,
    textAlign: 'center',
    fontSize: 13,
    color: TEXT_MUTED,
  },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  cardDate: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  cardPriceCol: {
    alignItems: 'flex-end',
  },
  cardPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  statusPill: {
    marginTop: 6,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Card footer actions
  cardFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  footerAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 10,
  },
  footerActionDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: BORDER,
  },
  footerActionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

export default BookingScreen;
