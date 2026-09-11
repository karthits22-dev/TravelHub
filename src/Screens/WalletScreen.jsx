import React, {useCallback} from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const INK = '#0F172A';
const GRAY = '#64748B';
const BLUE = '#2563EB';
const GREEN = '#16A34A';
const RED = '#DC2626';
const BG = '#F8FAFC';

const BALANCE = {
  total: 4084,
  referralIncome: 2450,
  cashback: 380,
};

const QUICK_ACTIONS = [
  {id: 'add', label: 'Add Money', icon: 'add-circle-outline', tint: '#ECEBFE', iconColor: '#6366F1'},
  {id: 'withdraw', label: 'Withdraw', icon: 'business-outline', tint: '#E9FBEF', iconColor: GREEN},
  {id: 'send', label: 'Send', icon: 'paper-plane-outline', tint: '#FFF1E4', iconColor: '#F97316'},
];

const TRANSACTIONS = [
  {
    id: 't1',
    title: 'Referral Bonus',
    dateLabel: 'Jul 28, 2:14 PM',
    amount: 200,
    icon: 'gift-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't2',
    title: 'Taxi Booking',
    dateLabel: 'Jul 28, 9:42 AM',
    amount: -146,
    icon: 'car-outline',
    tint: '#FFF1E4',
    iconColor: '#F97316',
  },
  {
    id: 't3',
    title: 'Cashback Reward',
    dateLabel: 'Jul 27, 6:30 PM',
    amount: 50,
    icon: 'trophy-outline',
    tint: '#E9FBEF',
    iconColor: GREEN,
  },
  {
    id: 't4',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't5',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't6',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't7',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't8',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
  {
    id: 't9',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: '#FCEAF3',
    iconColor: '#EC4899',
  },
];

const formatAmount = amount => {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
};

const WalletScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  // Bottom-tab screens stay mounted after their first visit, so a plain
  // <StatusBar> here would keep winning even after the user switches to
  // another tab. useFocusEffect applies this only while Wallet is the
  // active tab and restores the app default when it isn't.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#FFFFFF');
      return () => {};
    }, []),
  );

  const keyExtractor = useCallback(item => item.id, []);

  const renderTransaction = useCallback(
    ({item}) => {
      const isCredit = item.amount >= 0;
      return (
        <View style={styles.txnCard}>
          <View style={[styles.txnIconWrap, {backgroundColor: item.tint}]}>
            <Icon name={item.icon} size={20} color={item.iconColor} />
          </View>
          <View style={styles.txnInfo}>
            <Text style={styles.txnTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.txnDate}>{item.dateLabel}</Text>
          </View>
          <Text style={[styles.txnAmount, {color: isCredit ? GREEN : RED}]}>
            {formatAmount(item.amount)}
          </Text>
        </View>
      );
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.backButton} />
      </View>

      {/* Fixed section — stays in place while only the transactions below scroll */}
      <View style={styles.fixedTop}>
        <LinearGradient
          colors={['#2F6FED', '#3B82F6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.balanceCard}>
          <View style={styles.balanceBubbleLarge} />
          <View style={styles.balanceBubbleSmall} />

          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            ₹{BALANCE.total.toLocaleString('en-IN')}
          </Text>

          <View style={styles.balanceSubRow}>
            <View style={styles.balanceSubCard}>
              <Text style={styles.balanceSubLabel}>Referral Income</Text>
              <Text style={styles.balanceSubValue}>
                ₹{BALANCE.referralIncome.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.balanceSubCard}>
              <Text style={styles.balanceSubLabel}>Cashback</Text>
              <Text style={styles.balanceSubValue}>
                ₹{BALANCE.cashback.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              activeOpacity={0.8}>
              <View style={[styles.quickActionIconWrap, {backgroundColor: action.tint}]}>
                <Icon name={action.icon} size={22} color={action.iconColor} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={TRANSACTIONS}
        keyExtractor={keyExtractor}
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
  },

  // Fixed section above the scrollable list
  fixedTop: {
    paddingHorizontal: 20,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },

  // Balance card
  balanceCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  balanceBubbleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceBubbleSmall: {
    position: 'absolute',
    bottom: -20,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceSubRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  balanceSubCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceSubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  balanceSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: INK,
    marginTop: 8,
    textAlign: 'center',
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
  },

  // Transaction card
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  txnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  txnDate: {
    fontSize: 12,
    color: GRAY,
    marginTop: 3,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WalletScreen;
