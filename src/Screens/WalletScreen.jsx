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
import Icon from 'react-native-vector-icons/Ionicons';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';
const RED = '#C0392B';

const BALANCE = {
  total: 4084,
  referralIncome: 2450,
  cashback: 380,
};

const TRANSACTIONS = [
  {
    id: 't1',
    title: 'Referral Bonus',
    dateLabel: 'Jul 28, 2:14 PM',
    amount: 200,
    icon: 'gift-outline',
    tint: TINT_PEACH,
    iconColor: ICON_PEACH,
  },
  {
    id: 't2',
    title: 'Taxi Booking',
    dateLabel: 'Jul 28, 9:42 AM',
    amount: -146,
    icon: 'car-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't3',
    title: 'Cashback Reward',
    dateLabel: 'Jul 27, 6:30 PM',
    amount: 50,
    icon: 'trophy-outline',
    tint: TINT_PEACH,
    iconColor: ICON_PEACH,
  },
  {
    id: 't4',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't5',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't6',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't7',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't8',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
  },
  {
    id: 't9',
    title: 'Hotel Booking',
    dateLabel: 'Jul 26, 3:15 PM',
    amount: -3200,
    icon: 'business-outline',
    tint: TINT_MINT,
    iconColor: ICON_MINT,
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
      StatusBar.setBackgroundColor(CREAM);
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
          <Text style={[styles.txnAmount, {color: isCredit ? ICON_MINT : RED}]}>
            {formatAmount(item.amount)}
          </Text>
        </View>
      );
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Fixed section — stays in place while only the transactions below scroll */}
      <View style={styles.fixedTop}>
        <View style={styles.balanceCard}>
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

          <View style={styles.cardActionsRow}>
            <TouchableOpacity style={styles.addMoneyButton} activeOpacity={0.85}>
              <Icon name="add-circle-outline" size={17} color={DEEP_GREEN} />
              <Text style={styles.addMoneyButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.85}>
              <Icon name="arrow-down-circle-outline" size={17} color={CREAM} />
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: CREAM,
  },

  // Header — same trick as Rewards' header: an invisible spacer on the
  // right matches the back button's width so space-between centers the
  // title, without leaving a stray visible box sitting there.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
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
    borderRadius: 22,
    padding: 16,
    backgroundColor: DEEP_GREEN,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(245,240,228,0.7)',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: CREAM,
    marginTop: 2,
  },
  balanceSubRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  balanceSubCard: {
    flex: 1,
    backgroundColor: 'rgba(245,240,228,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  balanceSubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(245,240,228,0.7)',
  },
  balanceSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: CREAM,
    marginTop: 2,
  },

  // Add Money / Withdraw — inside the balance card
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  addMoneyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: CREAM,
    borderRadius: 12,
    paddingVertical: 9,
  },
  addMoneyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(245,240,228,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,240,228,0.4)',
    borderRadius: 12,
    paddingVertical: 9,
  },
  withdrawButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: CREAM,
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
    fontWeight: '800',
    color: TEXT_DARK,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: DEEP_GREEN,
  },

  // Transaction card
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
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
    color: TEXT_DARK,
  },
  txnDate: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WalletScreen;
