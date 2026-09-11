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

const INK = '#0F172A';
const GRAY = '#64748B';
const BLUE = '#2563EB';
const BORDER = '#E5E7EB';
const BG = '#F8FAFC';

const TABS = [
  {key: 'upcoming', label: 'Upcoming'},
  {key: 'completed', label: 'Completed'},
  {key: 'cancelled', label: 'Cancelled'},
];

const TYPE_STYLE = {
  hotel: {icon: 'business', tint: '#FCEAF3', color: '#EC4899', lib: 'ion'},
  taxi: {icon: 'local-taxi', tint: '#E9FBEF', color: '#16A34A', lib: 'material'},
  homestay: {icon: 'home', tint: '#E9FBEF', color: '#16A34A', lib: 'ion'},
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
    statusColor: BLUE,
    statusBg: '#EAF2FF',
  },
  {
    id: 'sedan-mg-road',
    status: 'upcoming',
    type: 'taxi',
    name: 'Sedan · MG Road → Airport',
    dateLabel: 'Aug 9 · 6:00 AM',
    price: 428,
    statusLabel: 'Confirmed',
    statusColor: BLUE,
    statusBg: '#EAF2FF',
  },
  ...Array.from({length: 11}, (_, index) => ({
    id: `mini-koramangala-${index + 1}`,
    status: 'completed',
    type: 'taxi',
    name: 'Mini · Koramangala → Whitefield',
    dateLabel: 'Jul 28 · 9:42 AM',
    price: 146,
    statusLabel: 'Completed',
    statusColor: '#16A34A',
    statusBg: '#E9FBEF',
  })),
  {
    id: 'coorg-cottage',
    status: 'completed',
    type: 'homestay',
    name: 'Coorg Cottage Escape',
    dateLabel: 'Jul 20–22 · 2 nights',
    price: 3600,
    statusLabel: 'Completed',
    statusColor: '#16A34A',
    statusBg: '#E9FBEF',
  },
  {
    id: 'misty-hills',
    status: 'cancelled',
    type: 'hotel',
    name: 'Misty Hills Resort',
    dateLabel: 'Jul 15 · Cancelled',
    price: 3200,
    statusLabel: 'Refunded',
    statusColor: '#DB2777',
    statusBg: '#FCEAF3',
  },
];

// Check-in only makes sense for a stay you haven't arrived at yet, and only
// for booking types that involve physically checking in at a property.
const CHECKIN_TYPES = new Set(['hotel', 'homestay']);

const ACTIONS_BY_STATUS = {
  upcoming: [
    {key: 'details', label: 'View Details', color: BLUE},
    {key: 'invoice', label: 'Invoice', icon: 'document-text-outline', color: GRAY},
  ],
  completed: [
    {key: 'details', label: 'View Details', color: BLUE},
    {key: 'rate', label: 'Rate', icon: 'star-outline', color: '#D97706'},
    {key: 'download', label: 'Download', icon: 'download-outline', color: BLUE},
  ],
  cancelled: [
    {key: 'details', label: 'View Details', color: BLUE},
    {key: 'rebook', label: 'Rebook', icon: 'refresh-outline', color: BLUE},
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
        {key: 'checkin', label: 'Check-in', icon: 'qr-code-outline', color: BLUE},
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
      StatusBar.setBackgroundColor('#FFFFFF');
      return () => {};
    }, []),
  );

  const keyExtractor = useCallback(item => item.id, []);

  const renderTypeIcon = type => {
    const typeStyle = TYPE_STYLE[type];
    return (
      <View style={[styles.typeIconWrap, {backgroundColor: typeStyle.tint}]}>
        {typeStyle.lib === 'material' ? (
          <TaxiIcon name={typeStyle.icon} size={22} color={typeStyle.color} />
        ) : (
          <Icon name={typeStyle.icon} size={22} color={typeStyle.color} />
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
                  <Icon name={action.icon} size={14} color={action.color} />
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
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Booking</Text>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate?.('CheckInScan')}>
          <Icon name="qr-code-outline" size={22} color={BLUE} />
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
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf9f9',
    borderRadius:30
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: "INK",
  },

  // Tabs — segmented pill control
  tabsTrack: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    padding: 4,
    backgroundColor: '#EEF1F5',
    borderRadius: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 16,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY,
  },
  tabLabelActive: {
    color: BLUE,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  emptyText: {
    marginTop: 60,
    textAlign: 'center',
    fontSize: 13,
    color: GRAY,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  cardDate: {
    fontSize: 12,
    color: GRAY,
    marginTop: 3,
  },
  cardPriceCol: {
    alignItems: 'flex-end',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  statusPill: {
    marginTop: 6,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BookingScreen;
