import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {formatWeekdayDate} from '../../Utils/stayDates';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';

const TAX_RATE = 0.12;
const AMC_DISCOUNT = 200;
const WALLET_BALANCE = 640;

const ConfirmPayScreen = ({navigation, route}) => {
  const {
    stayId,
    stayName = 'Your stay',
    roomName = '',
    pricePerNight = 0,
    checkIn,
    checkOut,
    guests = 2,
    nights = 1,
  } = route?.params ?? {};

  const [guestName, setGuestName] = useState('User');
  const [phoneNumber, setPhoneNumber] = useState('+91 98450 12345');
  const [isPaying, setIsPaying] = useState(false);

  const subtotal = pricePerNight * nights;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + taxes - AMC_DISCOUNT;

  const canPay = guestName.trim().length > 0 && phoneNumber.trim().length > 0 && !isPaying;

  const handlePay = () => {
    if (!canPay) return;
    setIsPaying(true);
    // No payment backend yet — this simulates a short processing delay
    // before landing on the confirmation screen, matching how the rest of
    // the app defers real integrations until a backend exists.
    setTimeout(() => {
      setIsPaying(false);
      // reset (not navigate) so the stays list/detail/payment screens drop
      // out of the stack — otherwise the device back button from this
      // confirmation screen would step back through the now-completed
      // booking flow (including the payment form) instead of exiting to
      // Home.
      navigation?.reset?.({
        index: 1,
        routes: [
          {name: 'MainTabs'},
          {
            name: 'BookingConfirmed',
            params: {stayId, stayName, roomName, checkIn, checkOut, amountPaid: total},
          },
        ],
      });
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
        <Text style={styles.headerTitle}>Confirm & Pay</Text>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Icon name="home" size={22} color={ICON_MINT} />
          </View>
          <View style={styles.summaryTextArea}>
            <Text style={styles.summaryStayName} numberOfLines={1}>
              {stayName}
            </Text>
            <Text style={styles.summaryRoomName} numberOfLines={1}>
              {roomName}
            </Text>
          </View>
        </View>

        <View style={styles.datesCard}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>{formatWeekdayDate(checkIn)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>{formatWeekdayDate(checkOut)}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Guest name</Text>
        <TextInput
          value={guestName}
          onChangeText={setGuestName}
          placeholder="Full name"
          placeholderTextColor={TEXT_MUTED}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Phone number</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+91 00000 00000"
          placeholderTextColor={TEXT_MUTED}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Price breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              ₹{pricePerNight.toLocaleString('en-IN')} × {nights} {nights === 1 ? 'night' : 'nights'}
            </Text>
            <Text style={styles.breakdownValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Taxes & GST (12%)</Text>
            <Text style={styles.breakdownValue}>₹{taxes.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>AMC member discount</Text>
            <Text style={styles.breakdownDiscount}>−₹{AMC_DISCOUNT.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Total</Text>
            <Text style={styles.breakdownTotalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Pay with</Text>
        <TouchableOpacity style={styles.walletRow} activeOpacity={0.85}>
          <Icon name="card-outline" size={18} color={TEXT_DARK} />
          <Text style={styles.walletText}>
            Wallet · ₹{WALLET_BALANCE.toLocaleString('en-IN')} balance
          </Text>
          <Icon name="chevron-forward" size={16} color={TEXT_MUTED} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, !canPay && styles.payButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canPay}
          onPress={handlePay}>
          <Text style={styles.payButtonText}>
            {isPaying ? 'Processing…' : `Pay ₹${total.toLocaleString('en-IN')} & Confirm`}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextArea: {
    flex: 1,
  },
  summaryStayName: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  summaryRoomName: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 3,
  },

  datesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  dateValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 4,
  },
  dateDivider: {
    width: 1,
    height: 32,
    backgroundColor: BORDER,
    marginHorizontal: 16,
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

  breakdownCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  breakdownTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  breakdownDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: ICON_MINT,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  breakdownTotalLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  breakdownTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: DEEP_GREEN,
  },

  walletRow: {
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
  walletText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: CREAM,
  },
  payButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ConfirmPayScreen;
