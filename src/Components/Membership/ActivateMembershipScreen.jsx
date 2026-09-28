import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {activateMembership} from '../../Services/MembershipService';
import {PLAN, PLAN_GST, PLAN_TOTAL} from '../../Utils/amcCommission';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const ICON_MINT = '#1F6F5C';

const GST = PLAN_GST;
const TOTAL = PLAN_TOTAL;

const INCLUDED = [
  'Book hotels, restaurants, cabs & catering',
  'Automatic insurance & document renewal reminders',
  'Member pricing on select stays',
];

const ActivateMembershipScreen = ({navigation, route}) => {
  // {name, params} of the action screen that sent us here (see
  // withMembersOnly in MembersOnly.jsx), to continue into after paying.
  const redirectTo = route?.params?.redirectTo;

  // Pre-filled from the agent who referred this signup, matching the same
  // demo code shown on the Rewards screen — editable in case the guest
  // wants to enter a different one.
  const [referralCode, setReferralCode] = useState('AGT-2298');
  const [isPaying, setIsPaying] = useState(false);

  const handleActivate = () => {
    if (isPaying) return;
    setIsPaying(true);
    // No payment backend yet — mirrors the same short simulated delay used
    // for the Hotels & Stays checkout until a real one exists.
    setTimeout(async () => {
      await activateMembership();
      setIsPaying(false);
      Alert.alert(
        'Membership Activated',
        'Your AARVI AMC membership is now active — every feature is unlocked.',
        [
          {
            text: 'Explore',
            // Continue straight into the booking/renewal the user started.
            // Otherwise (Book now button, Home AMC card) go back to where
            // they were, or land on the membership dashboard if there's
            // nowhere to go back to.
            onPress: () => {
              if (redirectTo?.name) {
                navigation.replace(redirectTo.name, redirectTo.params);
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace('Membership');
              }
            },
          },
        ],
        {cancelable: false},
      );
    }, 600);
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
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Activate Your Membership</Text>
        <Text style={styles.subtitle}>
          One AMC membership unlocks every AARVI service — stays, rides, catering,
          insurance renewals and more.
        </Text>

        <View style={styles.planCard}>
          <Text style={styles.planLabel}>AARVI AMC — ANNUAL MEMBERSHIP</Text>
          <View style={styles.planPriceRow}>
            <Text style={styles.planPrice}>₹{TOTAL}</Text>
            <Text style={styles.planPriceUnit}> / year</Text>
          </View>
          <Text style={styles.planBreakdown}>
            ₹{PLAN.base} base + ₹{GST} GST ({Math.round(PLAN.gstRate * 100)}%)
          </Text>
        </View>

        <View style={styles.includedCard}>
          <Text style={styles.includedTitle}>What's included</Text>
          {INCLUDED.map(item => (
            <View key={item} style={styles.includedRow}>
              <Icon name="checkmark" size={16} color={ICON_MINT} />
              <Text style={styles.includedText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Referral code (optional)</Text>
        <TextInput
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="Enter referral code"
          placeholderTextColor={TEXT_MUTED}
          autoCapitalize="characters"
          style={styles.input}
        />
        <Text style={styles.helperText}>Auto-filled from the agent who referred you.</Text>

        <Text style={styles.fieldLabel}>Pay with</Text>
        <TouchableOpacity style={styles.payWithRow} activeOpacity={0.85}>
          <Icon name="card-outline" size={18} color={TEXT_DARK} />
          <Text style={styles.payWithText}>UPI</Text>
          <Icon name="chevron-forward" size={16} color={TEXT_MUTED} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payButton}
          activeOpacity={0.85}
          disabled={isPaying}
          onPress={handleActivate}>
          <Text style={styles.payButtonText}>
            {isPaying ? 'Processing…' : `Pay ₹${TOTAL} & Activate`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>Renews automatically each year unless cancelled.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_MUTED,
  },

  planCard: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
  },
  planLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: 'rgba(245,240,228,0.65)',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  planPrice: {
    fontSize: 34,
    fontWeight: '800',
    color: CREAM,
  },
  planPriceUnit: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(245,240,228,0.7)',
    marginBottom: 4,
  },
  planBreakdown: {
    marginTop: 6,
    fontSize: 12.5,
    color: 'rgba(245,240,228,0.65)',
  },

  includedCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  includedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  includedText: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_DARK,
  },

  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14.5,
    color: TEXT_DARK,
  },
  helperText: {
    marginTop: 6,
    fontSize: 11.5,
    color: TEXT_MUTED,
  },

  payWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  payWithText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  payButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  payButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 16,
  },
  footerNote: {
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
});

export default ActivateMembershipScreen;
