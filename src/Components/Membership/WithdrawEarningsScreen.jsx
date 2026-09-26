import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import {
  BANK_ACCOUNTS,
  getAccount,
  monthSummary,
  requestWithdrawal,
  selectAccount,
  useAmcState,
} from '../../Data/amcAgent';
import {MIN_WITHDRAWAL, formatDate, formatINR} from '../../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const DEEP_GREEN_2 = '#1B5446';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const ERROR_RED = '#C23E3E';
const PEACH_TEXT = '#C2703D';

const RECENT_LIMIT = 5;

const WithdrawEarningsScreen = ({navigation}) => {
  const amcState = useAmcState();
  const {available} = useMemo(() => monthSummary(amcState), [amcState]);
  const account = getAccount(amcState.selectedAccountId);

  // Pre-filled with the full balance, the common case.
  const [amountText, setAmountText] = useState(String(available));
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(amountText) || 0;
  let amountError = null;
  if (available < MIN_WITHDRAWAL) {
    amountError = `You need at least ${formatINR(MIN_WITHDRAWAL)} available to withdraw.`;
  } else if (amount < MIN_WITHDRAWAL) {
    amountError = `Enter at least ${formatINR(MIN_WITHDRAWAL)}.`;
  } else if (amount > available) {
    amountError = `You can withdraw up to ${formatINR(available)}.`;
  }
  const canSubmit = !amountError && !submitting;

  const handleWithdraw = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // No payouts backend yet — same short simulated delay as the other
    // payment flows until a real one exists.
    setTimeout(() => {
      const record = requestWithdrawal(amount, account.id);
      // replace so back from the confirmation goes to the dashboard,
      // never back into a form for money that's already been requested.
      navigation.replace('WithdrawalRequested', {withdrawalId: record.id});
    }, 600);
  };

  const recent = amcState.withdrawals.slice(0, RECENT_LIMIT);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      {/* padding, not the manifest's adjustResize: edge-to-edge on
          Android 15+ stops the window resizing for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={18} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Earnings</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[DEEP_GREEN, DEEP_GREEN_2]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>AVAILABLE TO WITHDRAW</Text>
            <Text style={styles.balanceValue}>{formatINR(available)}</Text>
            <Text style={styles.balanceNote}>
              Commission + bonus earned this month, not yet withdrawn
            </Text>
          </LinearGradient>

          <Text style={styles.fieldLabel}>Amount to withdraw</Text>
          <View style={[styles.amountWrap, amountError && styles.amountWrapError]}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={text => setAmountText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={7}
              editable={!submitting && available >= MIN_WITHDRAWAL}
            />
          </View>
          <Text style={[styles.helperText, amountError && styles.helperTextError]}>
            {amountError ?? `Minimum withdrawal ${formatINR(MIN_WITHDRAWAL)} · no fee`}
          </Text>

          <View style={styles.withdrawToRow}>
            <Text style={styles.fieldLabelInline}>Withdraw to</Text>
            <TouchableOpacity onPress={() => setAccountsOpen(true)} hitSlop={8}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.accountCard}>
            <View style={styles.accountIcon}>
              <Icon name="business-outline" size={18} color={ICON_MINT} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.accountTitle}>
                {account.bank} · {account.type}
              </Text>
              <Text style={styles.accountMeta}>
                A/C ending {account.last4} · IFSC {account.ifsc}
              </Text>
            </View>
          </View>

          <View style={styles.infoNote}>
            <Icon name="information-circle-outline" size={18} color={ICON_MINT} />
            <Text style={styles.infoText}>
              Withdrawals are sent via NEFT and land in your account within 1–2
              business days.
            </Text>
          </View>

          {recent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent withdrawals</Text>
              {recent.map(w => {
                const wAccount = getAccount(w.accountId);
                const done = w.status === 'completed';
                return (
                  <View key={w.id} style={styles.historyRow}>
                    <View style={styles.flex}>
                      <Text style={styles.historyTitle}>
                        {formatINR(w.amount)} to {wAccount.shortName} •••{wAccount.last4}
                      </Text>
                      <Text style={styles.historyDate}>{formatDate(w.createdAt)}</Text>
                    </View>
                    <Text style={[styles.historyStatus, !done && styles.historyStatusPending]}>
                      {done ? 'Completed' : 'Processing'}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && !submitting && styles.submitButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canSubmit}
            onPress={handleWithdraw}>
            {submitting ? (
              <ActivityIndicator size="small" color={CREAM} />
            ) : (
              <Text style={styles.submitButtonText}>
                {amountError ? 'Withdraw' : `Withdraw ${formatINR(amount)}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={accountsOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAccountsOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setAccountsOpen(false)}>
          {/* Inner Pressable swallows taps so only the backdrop closes it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Withdraw to</Text>
            {BANK_ACCOUNTS.map(a => {
              const selected = a.id === account.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.accountCard, selected && styles.accountCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => {
                    selectAccount(a.id);
                    setAccountsOpen(false);
                  }}>
                  <View style={styles.accountIcon}>
                    <Icon name="business-outline" size={18} color={ICON_MINT} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.accountTitle}>
                      {a.bank} · {a.type}
                    </Text>
                    <Text style={styles.accountMeta}>
                      A/C ending {a.last4} · IFSC {a.ifsc}
                    </Text>
                  </View>
                  {selected && <Icon name="checkmark-circle" size={20} color={ICON_MINT} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  balanceCard: {
    borderRadius: 18,
    padding: 18,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: 'rgba(245,240,228,0.7)',
  },
  balanceValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '800',
    color: CREAM,
  },
  balanceNote: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(245,240,228,0.75)',
  },

  fieldLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DEEP_GREEN,
    backgroundColor: WHITE,
  },
  amountWrapError: {
    borderColor: ERROR_RED,
  },
  rupee: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  helperText: {
    marginTop: 6,
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  helperTextError: {
    color: ERROR_RED,
    fontWeight: '600',
  },

  withdrawToRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  accountCardSelected: {
    borderColor: ICON_MINT,
    borderWidth: 1.5,
  },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  accountMeta: {
    marginTop: 2,
    fontSize: 11.5,
    color: TEXT_MUTED,
  },

  infoNote: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: TINT_MINT,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: ICON_MINT,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  historyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  historyDate: {
    marginTop: 2,
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: ICON_MINT,
  },
  historyStatusPending: {
    color: PEACH_TEXT,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  submitButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: DEEP_GREEN,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: CREAM,
  },

  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    gap: 10,
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
});

export default WithdrawEarningsScreen;
