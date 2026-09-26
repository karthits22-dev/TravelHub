import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {getAccount, monthSummary, useAmcState} from '../../Data/amcAgent';
import {formatDate, formatINR} from '../../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';

// Reached via replace() from WithdrawEarnings, so the stack underneath is
// the Membership dashboard — hardware/gesture back already lands there.
const WithdrawalRequestedScreen = ({navigation, route}) => {
  const amcState = useAmcState();
  const withdrawalId = route?.params?.withdrawalId;
  const withdrawal = amcState.withdrawals.find(w => w.id === withdrawalId);
  const {available} = useMemo(() => monthSummary(amcState), [amcState]);

  const backToMembership = () => navigation.popTo('Membership');

  if (!withdrawal) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.body}>
          <Text style={styles.subtitle}>This withdrawal couldn't be found.</Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={backToMembership}>
            <Text style={styles.buttonText}>Back to Membership</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const account = getAccount(withdrawal.accountId);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={styles.body}>
        <View style={styles.checkCircle}>
          <Icon name="checkmark" size={36} color={ICON_MINT} />
        </View>

        <Text style={styles.title}>Withdrawal Requested</Text>
        <Text style={styles.subtitle}>
          {formatINR(withdrawal.amount)} is on its way to your bank account.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatINR(withdrawal.amount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sent to</Text>
            <Text style={styles.detailValue}>
              {account.bank} •••{account.last4}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference ID</Text>
            <Text style={styles.detailValue}>{withdrawal.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected by</Text>
            <Text style={styles.detailValue}>{formatDate(withdrawal.expectedBy)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining balance</Text>
            <Text style={styles.detailValue}>{formatINR(available)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={backToMembership}>
          <Text style={styles.buttonText}>Back to Membership</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
    color: TEXT_MUTED,
  },
  detailsCard: {
    alignSelf: 'stretch',
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  button: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: DEEP_GREEN,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: CREAM,
  },
});

export default WithdrawalRequestedScreen;
