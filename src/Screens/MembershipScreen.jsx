import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import {
  AGENT,
  REFERRAL_LINK,
  monthSummary,
  useAmcState,
} from '../Data/amcAgent';
import {useMembership} from '../Services/MembershipService';
import {
  CYCLE_MONTHS,
  MIN_WITHDRAWAL,
  PLAN,
  PLAN_GST,
  PLAN_TOTAL,
  computeEarnings,
  formatDate,
  formatINR,
} from '../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const DEEP_GREEN_2 = '#1B5446';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const PEACH_BG = '#FCEEDD';
const PEACH_BORDER = '#F3D6B8';
const PEACH_TEXT = '#C2703D';

const MembershipScreen = ({navigation}) => {
  const amcState = useAmcState();
  const membership = useMembership();
  const [viewMonth, setViewMonth] = useState(AGENT.cycleMonth);
  const [referralOpen, setReferralOpen] = useState(false);

  const summary = useMemo(() => monthSummary(amcState), [amcState]);
  // The table follows the selected month tab; everything else on the
  // screen is always about the current cycle month.
  const viewed = useMemo(
    () => computeEarnings(summary.memberCount, viewMonth),
    [summary.memberCount, viewMonth],
  );
  const isProjection = viewMonth !== AGENT.cycleMonth;
  const canWithdraw = summary.available >= MIN_WITHDRAWAL;

  const handleShare = () => {
    Share.share({
      message:
        `Join AARVI AMC with my referral code ${AGENT.code} — ` +
        `stays, rides, catering and renewals in one membership.\n${REFERRAL_LINK}`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={18} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My AMC Membership</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[DEEP_GREEN, DEEP_GREEN_2]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.planCard}>
          <View style={styles.planRow}>
            <View>
              <Text style={styles.planLabel}>BASE AMC</Text>
              <Text style={styles.planValue}>{formatINR(PLAN.base)}</Text>
            </View>
            <View>
              <Text style={styles.planLabel}>
                GST ({Math.round(PLAN.gstRate * 100)}%)
              </Text>
              <Text style={styles.planValue}>{formatINR(PLAN_GST)}</Text>
            </View>
            <View style={styles.planColRight}>
              <Text style={styles.planLabel}>TOTAL / YEAR</Text>
              <Text style={styles.planValue}>{formatINR(PLAN_TOTAL)}</Text>
            </View>
          </View>
          <Text style={styles.planFootnote}>
            Renews annually · Next renewal {formatDate(membership.renewsOn ?? AGENT.nextRenewal)}
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Referral commission structure</Text>
        <Text style={styles.sectionSubtitle}>
          Earn per member you enrol, plus a flat extra-point bonus per slab.
          Rates step up in month 1–3 of your enrolment cycle.
        </Text>

        <View style={styles.tabs}>
          {CYCLE_MONTHS.map(month => {
            const active = month === viewMonth;
            return (
              <TouchableOpacity
                key={month}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.8}
                onPress={() => setViewMonth(month)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  Month {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isProjection && (
          <Text style={styles.projectionNote}>
            Projected at Month {viewMonth} rates for your {summary.memberCount}{' '}
            members this month. You're currently in Month {AGENT.cycleMonth}.
          </Text>
        )}

        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, styles.colMembers]}>Members</Text>
            <Text style={[styles.tableHead, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHead, styles.colTotal]}>Slab total</Text>
          </View>
          {viewed.rows.map(row => (
            <View key={row.label} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colMembers]}>{row.label}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>{formatINR(row.rate)}</Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colTotal,
                  row.count === 0 && styles.cellMuted,
                ]}>
                {formatINR(row.total)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Slab total</Text>
            <Text style={styles.totalValue}>{formatINR(viewed.slabTotal)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Extra points (this month)</Text>
          {viewed.bonusRows.map(row => (
            <View key={row.label} style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{row.label}</Text>
              <Text style={[styles.bonusValue, !row.earned && styles.cellMuted]}>
                {row.earned ? formatINR(row.amount) : '—'}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Bonus total</Text>
            <Text style={styles.totalValue}>{formatINR(viewed.bonusTotal)}</Text>
          </View>
        </View>

        <View style={styles.profitCard}>
          <View>
            <Text style={styles.profitLabel}>TOTAL PROFIT THIS MONTH</Text>
            <Text style={styles.profitValue}>{formatINR(summary.earnings.total)}</Text>
          </View>
          <Icon name="trending-up" size={22} color={PEACH_TEXT} />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !canWithdraw && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canWithdraw}
          onPress={() => navigation.navigate('WithdrawEarnings')}>
          <Text style={styles.primaryButtonText}>Withdraw earnings</Text>
        </TouchableOpacity>
        {!canWithdraw && (
          <Text style={styles.withdrawHint}>
            {summary.available === 0
              ? "You've withdrawn everything earned this month."
              : `Withdrawals open once you have ${formatINR(MIN_WITHDRAWAL)} available.`}
          </Text>
        )}

        <TouchableOpacity
          style={styles.linkRow}
          activeOpacity={0.85}
          onPress={() => setReferralOpen(true)}>
          <View style={styles.linkIcon}>
            <Icon name="qr-code-outline" size={18} color={ICON_MINT} />
          </View>
          <View style={styles.linkTextArea}>
            <Text style={styles.linkTitle}>My Referral Code</Text>
            <Text style={styles.linkSubtitle}>Share your code, link or QR</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={TEXT_MUTED} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MemberRegistrations')}>
          <View style={styles.linkIcon}>
            <Icon name="people-outline" size={18} color={ICON_MINT} />
          </View>
          <View style={styles.linkTextArea}>
            <Text style={styles.linkTitle}>My Registrations</Text>
            <Text style={styles.linkSubtitle}>
              {summary.memberCount} members this month
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={TEXT_MUTED} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RegisterMember')}>
          <Text style={styles.outlineButtonText}>+ Register a new member</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={referralOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setReferralOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setReferralOpen(false)}>
          {/* Inner Pressable swallows taps so only the backdrop closes it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>My Referral Code</Text>
            <Text style={styles.sheetSubtitle}>
              New members who sign up with your code are added to your
              registrations.
            </Text>
            <View style={styles.qrWrap}>
              <QRCode value={REFERRAL_LINK} size={160} color={DEEP_GREEN} />
            </View>
            <Text style={styles.referralCode}>{AGENT.code}</Text>
            <Text style={styles.referralLink}>{REFERRAL_LINK}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.sheetButton]}
              activeOpacity={0.85}
              onPress={handleShare}>
              <Icon name="share-social-outline" size={18} color={CREAM} />
              <Text style={styles.primaryButtonText}>Share code</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  planCard: {
    borderRadius: 18,
    padding: 18,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planColRight: {
    alignItems: 'flex-end',
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: 'rgba(245,240,228,0.7)',
  },
  planValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: CREAM,
  },
  planFootnote: {
    marginTop: 14,
    fontSize: 12,
    color: 'rgba(245,240,228,0.75)',
  },

  sectionTitle: {
    marginTop: 22,
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_MUTED,
  },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  tabTextActive: {
    color: CREAM,
    fontWeight: '800',
  },
  projectionNote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: PEACH_TEXT,
  },

  card: {
    marginTop: 14,
    padding: 16,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHead: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  tableCell: {
    fontSize: 13,
    color: TEXT_DARK,
  },
  cellMuted: {
    color: TEXT_MUTED,
  },
  colMembers: {
    flex: 1.3,
  },
  colRate: {
    flex: 1,
  },
  colTotal: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  bonusLabel: {
    fontSize: 13,
    color: TEXT_DARK,
  },
  bonusValue: {
    fontSize: 13,
    color: TEXT_DARK,
  },

  profitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: PEACH_BG,
    borderWidth: 1,
    borderColor: PEACH_BORDER,
  },
  profitLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: PEACH_TEXT,
  },
  profitValue: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: DEEP_GREEN,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: CREAM,
  },
  withdrawHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: TEXT_MUTED,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTextArea: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  linkSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: TEXT_MUTED,
  },

  outlineButton: {
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DEEP_GREEN,
  },
  outlineButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: DEEP_GREEN,
  },

  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    color: TEXT_MUTED,
  },
  qrWrap: {
    marginTop: 18,
    padding: 14,
    backgroundColor: WHITE,
    borderRadius: 16,
  },
  referralCode: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: DEEP_GREEN,
  },
  referralLink: {
    marginTop: 4,
    fontSize: 12,
    color: TEXT_MUTED,
  },
  sheetButton: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
});

export default MembershipScreen;
